import { Skeleton } from "@/components/ui/skeleton"

const ReceiptFormSkeleton = () => {
  return (
    <div className="flex flex-col w-full items-center">
      <Skeleton className="h-8 w-48 mt-8" />
      <div className="flex bg-muted rounded-md p-8 flex-col mt-8 w-2/3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="mt-8 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex flex-row justify-between mt-8">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="col-span-6 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-12 w-1/2 mx-auto mt-8 rounded-full" />
      </div>
    </div>
  )
}

export default ReceiptFormSkeleton
