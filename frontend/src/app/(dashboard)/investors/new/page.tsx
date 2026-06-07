'use client'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { InvestorForm } from '@/components/investors/InvestorForm'

export default function NewInvestorPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/investors">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <h1 className="font-display font-bold text-3xl text-foreground">Add Investor</h1>
        <p className="text-muted-foreground mt-1">Track a new hedge fund manager</p>
      </motion.div>
      <InvestorForm />
    </div>
  )
}
