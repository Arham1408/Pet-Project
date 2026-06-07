import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold font-display transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary hover:bg-primary/20',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-emerald-500/10 text-emerald-500',
        warning: 'border-transparent bg-amber-500/10 text-amber-500',
        critical: 'border-transparent bg-red-500/15 text-red-500',
        high: 'border-transparent bg-orange-500/15 text-orange-500',
        medium: 'border-transparent bg-amber-500/15 text-amber-500',
        low: 'border-transparent bg-slate-500/15 text-slate-400',
        cyan: 'border-transparent bg-cyan-500/10 text-cyan-500',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
