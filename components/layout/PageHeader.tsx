import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** small facts under the subtitle (period, counts) */
  meta?: ReactNode
  /** buttons on the right */
  actions?: ReactNode
  className?: string
}

/** The one page header: title left, actions right, same gutters as the content below. */
export function PageHeader({ title, subtitle, meta, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('enter mx-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pb-2 pt-7 sm:px-6', className)}>
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** The content column under a PageHeader. */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1400px] px-4 pb-24 pt-4 sm:px-6', className)}>{children}</div>
}
