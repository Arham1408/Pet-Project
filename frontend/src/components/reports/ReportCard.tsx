'use client'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelative } from '@/lib/utils'
import type { Report } from '@/types/api'

export function ReportCard({ report }: { report: Report }) {
  return (
    <Link href={`/reports/${report.id}`}>
      <Card className="hover:border-primary/40 transition-all cursor-pointer">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant={report.report_type === 'daily_digest' ? 'cyan' : 'default'} className="text-[10px]">
                {report.report_type.replace('_', ' ')}
              </Badge>
              {!report.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </div>
            <p className="font-medium text-sm text-foreground truncate">{report.title}</p>
            <p className="text-xs text-muted-foreground">{formatRelative(report.generated_at)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
