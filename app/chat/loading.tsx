import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex h-screen">
      <div className="w-64 border-r p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-24 w-3/4" />
          <Skeleton className="h-24 w-2/3 ml-auto" />
          <Skeleton className="h-32 w-3/4" />
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
