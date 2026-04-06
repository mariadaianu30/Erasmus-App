export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded ${className}`} 
      style={{ 
        backgroundSize: '200% 100%', 
        animation: 'shimmer 1.5s ease-in-out infinite',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      }} 
    />
  )
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group h-full">
      <SkeletonLoader className="h-56 w-full" />
      <div className="p-6 md:p-8 flex flex-col flex-1">
        <SkeletonLoader className="h-8 w-3/4 mb-4 rounded-lg" />
        <div className="space-y-2 mb-6">
          <SkeletonLoader className="h-4 w-full rounded" />
          <SkeletonLoader className="h-4 w-5/6 rounded" />
        </div>
        <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <SkeletonLoader className="h-4 w-2/3 rounded" />
          <SkeletonLoader className="h-4 w-1/2 rounded" />
          <SkeletonLoader className="h-4 w-3/4 rounded" />
          <SkeletonLoader className="h-4 w-1/3 rounded" />
        </div>
        <div className="flex items-center mb-6">
          <SkeletonLoader className="h-8 w-8 rounded-full mr-3" />
          <SkeletonLoader className="h-4 w-32 rounded" />
        </div>
        <SkeletonLoader className="h-12 w-full rounded-xl mt-auto" />
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
          <div key={i} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
            <SkeletonLoader className="h-4 w-20 mb-2 rounded" />
            <SkeletonLoader className="h-8 w-16 rounded" />
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

