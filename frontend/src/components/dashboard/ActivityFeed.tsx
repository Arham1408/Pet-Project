'use client'
import { motion } from 'framer-motion'
import { formatRelative, capitalise } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Alert } from '@/types/api'

interface ActivityFeedProps {
  alerts: Alert[]
  loading?: boolean
}

const severityVariant: Record<string, any> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

export function ActivityFeed({ alerts, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!alerts.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
  }

  return (
    <div className="space-y-1">
      {alerts.map((alert, i) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-primary">{alert.title[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
              <Badge variant={severityVariant[alert.severity] as any}>{alert.severity}</Badge>
            </div>
            {alert.summary && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{alert.summary}</p>
            )}
            <p className="text-xs text-muted-foreground/60 mt-1">{formatRelative(alert.created_at)}</p>
          </div>
          {!alert.is_read && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
          )}
        </motion.div>
      ))}
    </div>
  )
}
