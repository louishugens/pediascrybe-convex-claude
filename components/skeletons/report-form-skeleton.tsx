import { Skeleton } from "@/components/ui/skeleton"

const ReportFormSkeleton = () => {
  return (
    <div className="flex flex-col w-full items-center">
      <Skeleton className="h-8 w-64 mt-8" />
      <div className="flex bg-muted rounded-md p-8 flex-col mt-8 w-2/3">
        <div className="grid gap-x-8 gap-y-8 grid-cols-2 mt-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="mt-8 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-12 w-1/2 mx-auto mt-8 rounded-full" />
      </div>
    </div>
  )
}

export default ReportFormSkeleton
