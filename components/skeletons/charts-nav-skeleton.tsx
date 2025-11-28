import { Skeleton } from "@/components/ui/skeleton"

const ChartsNavSkeleton = () => {
  return (
    <div className='flex flex-row w-full h-auto gap-4'>
      <Skeleton className="mt-4 h-10 w-20 rounded-full" />
      <Skeleton className="mt-4 h-10 w-32 rounded-full" />
      <Skeleton className="mt-4 h-10 w-32 rounded-full" />
      <Skeleton className="mt-4 h-10 w-36 rounded-full" />
      <Skeleton className="mt-4 h-10 w-28 rounded-full" />
      <Skeleton className="mt-4 h-10 w-40 rounded-full" />
    </div>
  )
}

export default ChartsNavSkeleton
