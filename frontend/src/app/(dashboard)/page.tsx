'use client'
import { motion } from 'framer-motion'
import { Users, FileText, Bell, TrendingUp, Zap, Activity } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvestors } from '@/hooks/useInvestors'
import { useAlerts } from '@/hooks/useAlerts'
import { useReports } from '@/hooks/useReports'
import Link from 'next/link'
import { formatRelative } from '@/lib/utils'

export default function DashboardPage() {
  const { data: investors, isLoading: loadingInvestors } = useInvestors()
  const { data: alertData, isLoading: loadingAlerts } = useAlerts()
  const { data: reportsData, isLoading: loadingReports } = useReports({ limit: 5 })

  const stats = [
    { title: 'Investors Tracked', value: investors?.length ?? '—', icon: Users, color: 'indigo' as const },
    { title: 'Unread Alerts', value: alertData?.unread_count ?? '—', icon: Bell, color: 'amber' as const },
    { title: 'Reports Generated', value: reportsData?.total ?? '—', icon: FileText, color: 'violet' as const },
    { title: 'Active Sources', value: investors?.reduce((acc, inv) => acc + inv.sources_count, 0) ?? '—', icon: Activity, color: 'cyan' as const },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your hedge fund intelligence overview</p>
          </div>
          <Link href="/investors/new">
            <Button variant="gradient" size="sm" className="gap-2">
              <Zap className="w-4 h-4" />
              Add Investor
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} index={i} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent alerts — 2 cols */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent Alerts</CardTitle>
            <Link href="/alerts">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ActivityFeed alerts={alertData?.data.slice(0, 8) ?? []} loading={loadingAlerts} />
          </CardContent>
        </Card>

        {/* Latest Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Latest Reports</CardTitle>
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingReports ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : reportsData?.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No reports yet</p>
            ) : (
              reportsData?.data.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/reports/${r.id}`}>
                    <div className="p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/30 transition-all cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={r.report_type === 'daily_digest' ? 'cyan' : 'default'} className="text-[10px]">
                          {r.report_type.replace('_', ' ')}
                        </Badge>
                        {!r.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-1">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(r.generated_at)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investors quick view */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Tracked Investors</CardTitle>
          <Link href="/investors">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Manage all</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingInvestors ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : investors?.length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No investors tracked yet</p>
              <Link href="/investors/new">
                <Button variant="gradient" size="sm" className="mt-3">Add your first investor</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {investors?.slice(0, 6).map((inv, i) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                >
                  <Link href={`/investors/${inv.id}`}>
                    <div className="p-4 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                          <span className="font-display font-bold text-sm text-primary">{inv.name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{inv.name}</p>
                          <p className="text-xs text-muted-foreground">{inv.sources_count} sources</p>
                        </div>
                        {inv.is_active ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted" />
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
