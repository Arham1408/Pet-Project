'use client'
import { use } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InvestorForm } from '@/components/investors/InvestorForm'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvestor } from '@/hooks/useInvestors'

export default function EditInvestorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: investor, isLoading } = useInvestor(id)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Link href={`/investors/${id}`}>
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <h1 className="font-display font-bold text-3xl text-foreground">Edit Investor</h1>
      </motion.div>
      {isLoading ? <Skeleton className="h-64 max-w-lg rounded-xl" /> : investor && <InvestorForm investor={investor} />}
    </div>
  )
}
