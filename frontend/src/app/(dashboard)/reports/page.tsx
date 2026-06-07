'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useReports } from '@/hooks/useReports'
import { formatRelative, formatDate } from '@/lib/utils'

export default function ReportsPage() {
  const [reportType, setReportType] = useState<string>('all')
  const { data, isLoading } = useReports(reportType !== 'all' ? { report_type: reportType } : undefined)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">AI-generated intelligence reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="investor_report">Investor Report</SelectItem>
              <SelectItem value="daily_digest">Daily Digest</SelectItem>
              <SelectItem value="event_report">Event Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-foreground font-medium">No reports yet</p>
          <p className="text-sm text-muted-foreground mt-1">Reports are generated automatically when new content is processed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.data.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ x: 2 }}
            >
              <Link href={`/reports/${report.id}`}>
                <Card className="hover:border-primary/40 transition-all cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={report.report_type === 'daily_digest' ? 'cyan' : 'default'} className="text-[10px]">
                            {report.report_type.replace('_', ' ')}
                          </Badge>
                          {!report.is_read && <Badge variant="secondary" className="text-[10px]">Unread</Badge>}
                          {report.period_start && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(report.period_start)}
                              {report.period_end ? ` – ${formatDate(report.period_end)}` : ''}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display font-semibold text-foreground">{report.title}</h3>
                        {report.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{report.summary}</p>}
                      </div>
                      <p className="text-xs text-muted-foreground flex-shrink-0">{formatRelative(report.generated_at)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
