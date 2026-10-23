import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 px-4">
      <Skeleton className="h-16 w-16 rounded-2xl" />
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  )
}
