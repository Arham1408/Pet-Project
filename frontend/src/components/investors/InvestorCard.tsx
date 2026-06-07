'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MoreHorizontal, RefreshCw, Trash2, Edit, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeleteInvestor, useSyncInvestor } from '@/hooks/useInvestors'
import { useToast } from '@/hooks/use-toast'
import { formatRelative } from '@/lib/utils'
import type { Investor } from '@/types/api'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface InvestorCardProps {
  investor: Investor
  index: number
}

export function InvestorCard({ investor, index }: InvestorCardProps) {
  const { mutate: deleteInvestor } = useDeleteInvestor()
  const { mutate: syncInvestor, isPending: syncing } = useSyncInvestor()
  const { toast } = useToast()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className="group"
    >
      <Card className="p-5 hover:border-primary/40 transition-all duration-300 relative overflow-hidden">
        {/* Glow on hover */}
        <div className="absolute inset-0 bg-glow-indigo opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="relative flex items-start justify-between gap-3">
          {/* Avatar + Name */}
          <Link href={`/investors/${investor.id}`} className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:shadow-glow-sm transition-shadow">
              <span className="font-display font-bold text-base text-primary">{investor.name[0]}</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                {investor.name}
              </h3>
              {investor.cik_number && (
                <p className="text-xs font-mono text-muted-foreground">CIK {investor.cik_number}</p>
              )}
            </div>
          </Link>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem asChild>
                <Link href={`/investors/${investor.id}/edit`} className="flex items-center gap-2 cursor-pointer">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  syncInvestor(investor.id)
                  toast({ title: 'Sync started', description: `Fetching latest data for ${investor.name}` })
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync now
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteInvestor(investor.id)}
                className="flex items-center gap-2 text-destructive cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-lg font-display font-bold text-foreground">{investor.sources_count}</p>
            <p className="text-xs text-muted-foreground">Sources</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <Badge variant={investor.is_active ? 'success' : 'secondary'} className="text-xs">
              {investor.is_active ? 'Active' : 'Paused'}
            </Badge>
          </div>
        </div>

        {investor.last_synced_at && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Synced {formatRelative(investor.last_synced_at)}
          </p>
        )}
      </Card>
    </motion.div>
  )
}
