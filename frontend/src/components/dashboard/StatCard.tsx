'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  delta?: string
  icon: LucideIcon
  color?: 'indigo' | 'cyan' | 'violet' | 'emerald' | 'amber'
  index?: number
}

const colorMap = {
  indigo: 'from-indigo-500 to-indigo-600 text-indigo-500 bg-indigo-500/10',
  cyan: 'from-cyan-500 to-cyan-600 text-cyan-500 bg-cyan-500/10',
  violet: 'from-violet-500 to-violet-600 text-violet-500 bg-violet-500/10',
  emerald: 'from-emerald-500 to-emerald-600 text-emerald-500 bg-emerald-500/10',
  amber: 'from-amber-500 to-amber-600 text-amber-500 bg-amber-500/10',
}

export function StatCard({ title, value, delta, icon: Icon, color = 'indigo', index = 0 }: StatCardProps) {
  const colors = colorMap[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      whileHover={{ y: -2 }}
      className="glass-card rounded-xl p-5 cursor-default"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="font-display font-bold text-2xl mt-1 text-foreground">{value}</p>
          {delta && (
            <p className="text-xs text-muted-foreground mt-1">{delta}</p>
          )}
        </div>
        <div className={cn('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', colors.split(' ').slice(2).join(' '))}>
          <Icon className={cn('w-5 h-5', colors.split(' ')[2])} />
        </div>
      </div>
    </motion.div>
  )
}
