'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCreateInvestor, useUpdateInvestor } from '@/hooks/useInvestors'
import { useToast } from '@/hooks/use-toast'
import type { Investor } from '@/types/api'

interface InvestorFormProps {
  investor?: Investor
}

export function InvestorForm({ investor }: InvestorFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({ name: investor?.name ?? '', cik_number: investor?.cik_number ?? '' })
  const { mutate: create, isPending: creating } = useCreateInvestor()
  const { mutate: update, isPending: updating } = useUpdateInvestor()
  const loading = creating || updating

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { name: form.name, cik_number: form.cik_number || undefined }
    if (investor) {
      update({ id: investor.id, data }, {
        onSuccess: () => { toast({ title: 'Investor updated' }); router.push(`/investors/${investor.id}`) },
        onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
      })
    } else {
      create(data, {
        onSuccess: (inv) => { toast({ title: 'Investor added' }); router.push(`/investors/${inv.id}`) },
        onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
      })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{investor ? 'Edit Investor' : 'Add Investor'}</CardTitle>
          <CardDescription>
            {investor ? 'Update investor details' : 'Start tracking a hedge fund manager or investor'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Bridgewater Associates"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cik">SEC CIK Number (optional)</Label>
              <Input
                id="cik"
                placeholder="e.g. 0001350694"
                value={form.cik_number}
                onChange={e => setForm({ ...form, cik_number: e.target.value })}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Used to automatically fetch 13F filings from SEC EDGAR</p>
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="gradient" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {investor ? 'Update' : 'Create'}</>}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
