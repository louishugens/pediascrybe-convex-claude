import { Skeleton } from "@/components/ui/skeleton"

const ReceiptsSkeleton = () => {
  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-row w-full h-auto gap-4'>
        <Skeleton className="mt-4 h-9 w-20 rounded-full" /> {/* Leave button */}
      </div>
      <div className="flex flex-row w-full justify-between mt-4">
        <Skeleton className='h-6 w-32' /> {/* Title: Receipt list */}
        <Skeleton className='h-9 w-32 rounded-full' /> {/* Create Receipt button */}
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2 p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReceiptsSkeleton
