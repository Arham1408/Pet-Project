'use client'
import { motion } from 'framer-motion'
import { FileText, Globe, Youtube, Rss, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelative } from '@/lib/utils'
import type { ContentItem } from '@/types/api'

const typeIcon: Record<string, any> = {
  filing: FileText, article: Globe, video: Youtube, newsletter: Rss,
}

const typeVariant: Record<string, any> = {
  filing: 'cyan', article: 'default', video: 'critical', newsletter: 'medium', website_page: 'secondary',
}

interface TimelineFeedProps {
  items: ContentItem[]
  loading?: boolean
}

export function TimelineFeed({ items, loading }: TimelineFeedProps) {
  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
  }
  if (!items.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No content items yet. Sync to fetch data.</p>
  }

  return (
    <div className="relative space-y-3">
      {/* Timeline line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-border/50" />

      {items.map((item, i) => {
        const Icon = typeIcon[item.content_type] ?? Globe
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-4 pl-2"
          >
            {/* Timeline dot */}
            <div className="flex-shrink-0 relative z-10 w-5 h-5 rounded-full bg-background border-2 border-border flex items-center justify-center mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>

            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-start gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {item.title || (item.metadata?.title as string) || 'Untitled'}
                  </p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary truncate block transition-colors"
                    >
                      {item.url}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={typeVariant[item.content_type] as any} className="text-[10px]">
                    <Icon className="w-2.5 h-2.5" />
                    {item.content_type}
                  </Badge>
                  <Badge
                    variant={item.processing_status === 'completed' ? 'success' : item.processing_status === 'failed' ? 'destructive' : 'secondary'}
                    className="text-[10px]"
                  >
                    {item.processing_status}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelative(item.created_at)}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
