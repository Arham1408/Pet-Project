'use client'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sun, Moon, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSearch } from '@/hooks/useSearch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function TopNav() {
  const { theme, setTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const { mutate: search, data, isPending } = useSearch()
  const router = useRouter()

  const handleSearch = (q: string) => {
    setQuery(q)
    if (q.length > 2) {
      setOpen(true)
      search({ query: q, limit: 5 })
    } else {
      setOpen(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center gap-4 px-6">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-9 h-9 bg-muted/50 border-transparent focus:border-primary/50"
          placeholder="Search investors, content..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false) }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Search dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full mt-2 left-0 right-0 bg-popover border border-border rounded-xl shadow-glass-dark overflow-hidden z-50"
            >
              {isPending ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : data?.results.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">No results found</p>
              ) : (
                <div className="divide-y divide-border/50">
                  {data?.results.map((r, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-accent cursor-pointer transition-colors">
                      <p className="text-xs font-medium text-primary font-display">{r.investor_name}</p>
                      <p className="text-sm text-foreground mt-0.5 line-clamp-2">{r.chunk_text}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{r.source_url}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Avatar */}
        <button onClick={handleSignOut} className="focus:outline-none">
          <Avatar className="h-8 w-8 ring-2 ring-border hover:ring-primary/50 transition-all">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs">
              U
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  )
}
