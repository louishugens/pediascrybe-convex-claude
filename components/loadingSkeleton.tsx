import { Skeleton } from "@/components/ui/skeleton"
 
export default function LoadingSkeleton() {
  return (
    <div className="flex flex-col justify-center items-start w-full h-72 space-y-4 p-4">
      {/* <Skeleton className="h-12 w-12 rounded-full" /> */}
      {/* <div className="space-y-2"> */}
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      {/* </div> */}
    </div>
  )
}