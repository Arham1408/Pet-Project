'use client'
import { use, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useReport, useMarkReportRead } from '@/hooks/useReports'
import { formatDate, formatRelative } from '@/lib/utils'

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: report, isLoading } = useReport(id)
  const { mutate: markRead } = useMarkReportRead()

  useEffect(() => {
    if (report && !report.is_read) markRead(id)
  }, [report?.id])

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }
  if (!report) return <p className="text-muted-foreground">Report not found</p>

  return (
    <div className="max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Reports
          </Button>
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <Badge variant={report.report_type === 'daily_digest' ? 'cyan' : 'default'}>
            {report.report_type.replace('_', ' ')}
          </Badge>
          {report.period_start && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(report.period_start)} – {report.period_end ? formatDate(report.period_end) : 'present'}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {formatRelative(report.generated_at)}
          </span>
        </div>

        <h1 className="font-display font-bold text-3xl text-foreground">{report.title}</h1>
        {report.summary && <p className="text-muted-foreground mt-2">{report.summary}</p>}
      </motion.div>

      {/* Markdown content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border/50 rounded-2xl overflow-hidden"
      >
        <ScrollArea className="max-h-[70vh]">
          <div className="p-8 prose prose-sm dark:prose-invert max-w-none
            prose-headings:font-display prose-headings:font-semibold
            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
            prose-p:text-foreground prose-p:leading-relaxed
            prose-strong:text-foreground prose-strong:font-semibold
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:text-cyan-400 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
            prose-pre:bg-muted prose-pre:border prose-pre:border-border/50
            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
            prose-hr:border-border prose-table:text-sm
            prose-th:text-foreground prose-td:text-muted-foreground
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report.content_markdown}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  )
}
