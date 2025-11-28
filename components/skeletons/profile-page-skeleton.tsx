import { Skeleton } from "@/components/ui/skeleton"

const ProfilePageSkeleton = () => {
  return (
    <div className='flex flex-col w-full'>
      {/* Doctor info card */}
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50">
        <div className="flex flex-row w-full justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 col-span-2" />
        </div>
      </div>

      {/* Tracked Vaccines card */}
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-md" />
          ))}
        </div>
      </div>

      {/* Services card */}
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfilePageSkeleton
