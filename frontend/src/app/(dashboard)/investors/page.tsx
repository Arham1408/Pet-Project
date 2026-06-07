'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus, Users, Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InvestorCard } from '@/components/investors/InvestorCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvestors } from '@/hooks/useInvestors'

export default function InvestorsPage() {
  const { data: investors, isLoading } = useInvestors()
  const [q, setQ] = useState('')

  const filtered = investors?.filter(inv =>
    inv.name.toLowerCase().includes(q.toLowerCase()) ||
    inv.cik_number?.includes(q)
  ) ?? []

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">Investors</h1>
          <p className="text-muted-foreground mt-1">Track hedge fund managers and their activity</p>
        </div>
        <Link href="/investors/new">
          <Button variant="gradient" size="sm">
            <Plus className="w-4 h-4" /> Add Investor
          </Button>
        </Link>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or CIK..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-foreground font-medium">
            {q ? 'No investors match your search' : 'No investors yet'}
          </p>
          {!q && (
            <Link href="/investors/new">
              <Button variant="gradient" size="sm" className="mt-4">Add your first investor</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inv, i) => <InvestorCard key={inv.id} investor={inv} index={i} />)}
        </div>
      )}
    </div>
  )
}
