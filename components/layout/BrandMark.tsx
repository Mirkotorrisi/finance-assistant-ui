import { cn } from '@/lib/utils'

/** The app mark: three rising bars in a primary square. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground', className)}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <rect x="1" y="8" width="3" height="5" rx="0.75" />
        <rect x="5.5" y="4.5" width="3" height="8.5" rx="0.75" />
        <rect x="10" y="1" width="3" height="12" rx="0.75" />
      </svg>
    </span>
  )
}
