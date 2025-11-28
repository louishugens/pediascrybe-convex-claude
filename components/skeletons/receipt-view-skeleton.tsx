import { Skeleton } from "@/components/ui/skeleton"

const ReceiptViewSkeleton = () => {
  return (
    <div className="flex flex-col items-center w-full p-8 gap-8">
      <div className="w-full max-w-3xl border rounded-lg p-8 shadow-sm bg-white space-y-8">
        <div className="flex justify-between items-start border-b pb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-6 w-24 ml-auto" />
            <Skeleton className="h-4 w-32 ml-auto" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between py-4 border-b">
              <div className="space-y-2 w-2/3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <div className="w-1/3 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiptViewSkeleton
