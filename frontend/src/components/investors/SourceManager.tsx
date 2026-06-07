'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Globe, Youtube, Rss, FileText, Link as LinkIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useSources, useCreateSource, useDeleteSource } from '@/hooks/useInvestors'
import { useToast } from '@/hooks/use-toast'
import { formatRelative } from '@/lib/utils'

const sourceIcons: Record<string, any> = {
  website: Globe, youtube: Youtube, rss: Rss, sec_13f: FileText, custom: LinkIcon, twitter: LinkIcon,
}

const sourceColors: Record<string, string> = {
  website: 'default', youtube: 'critical', rss: 'amber', sec_13f: 'cyan', custom: 'secondary', twitter: 'secondary',
}

interface SourceManagerProps { investorId: string }

export function SourceManager({ investorId }: SourceManagerProps) {
  const { data: sources, isLoading } = useSources(investorId)
  const { mutate: createSource, isPending: creating } = useCreateSource(investorId)
  const { mutate: deleteSource } = useDeleteSource(investorId)
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ source_type: 'website' as const, url: '' })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    createSource(form, {
      onSuccess: () => { setShowForm(false); setForm({ source_type: 'website', url: '' }); toast({ title: 'Source added' }) },
      onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">Data Sources</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5" /> Add Source
        </Button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source type</Label>
                  <Select value={form.source_type} onValueChange={v => setForm({ ...form, source_type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="rss">RSS Feed</SelectItem>
                      <SelectItem value="sec_13f">SEC 13F</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="default" size="sm" disabled={creating}>
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Sources list */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : sources?.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No sources yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {sources?.map((source, i) => {
            const Icon = sourceIcons[source.source_type] ?? LinkIcon
            return (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-accent/30 transition-colors group"
              >
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate text-foreground">{source.url}</p>
                  {source.last_checked_at && (
                    <p className="text-xs text-muted-foreground">Checked {formatRelative(source.last_checked_at)}</p>
                  )}
                </div>
                <Badge variant={sourceColors[source.source_type] as any} className="text-[10px] flex-shrink-0">
                  {source.source_type}
                </Badge>
                {source.consecutive_failures > 0 && (
                  <Badge variant="destructive" className="text-[10px]">{source.consecutive_failures} fails</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteSource(source.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
