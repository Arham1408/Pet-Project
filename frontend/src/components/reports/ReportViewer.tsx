'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ReportViewer({ markdown }: { markdown: string }) {
  return (
    <ScrollArea className="max-h-[70vh]">
      <div className="p-6 prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-code:font-mono prose-code:text-cyan-400">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </ScrollArea>
  )
}
