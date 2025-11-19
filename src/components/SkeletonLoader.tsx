export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
      <SkeletonLoader className="h-48 w-full" />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <SkeletonLoader className="h-6 w-3/4" />
          <SkeletonLoader className="h-5 w-20 rounded-full" />
        </div>
        <SkeletonLoader className="h-4 w-full mb-2" />
        <SkeletonLoader className="h-4 w-5/6 mb-4" />
        <div className="space-y-2 mb-4">
          <SkeletonLoader className="h-4 w-2/3" />
          <SkeletonLoader className="h-4 w-1/2" />
          <SkeletonLoader className="h-4 w-3/4" />
        </div>
        <SkeletonLoader className="h-10 w-full rounded-lg mt-auto" />
      </div>
    </div>
  )
}

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonLoader className="h-4 w-24" />
      <SkeletonLoader className="h-10 w-full rounded-md" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
            <SkeletonLoader className="h-4 w-20 mb-2" />
            <SkeletonLoader className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

