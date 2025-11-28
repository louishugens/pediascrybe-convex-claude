import { Skeleton } from "@/components/ui/skeleton"

const GenericFormSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 w-full h-fit bg-slate-50 rounded-lg p-4">
      {/* Title */}
      <Skeleton className="h-6 w-48" />

      {/* Form fields */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Button */}
      <Skeleton className="h-10 w-32 rounded-full mt-4" />
    </div>
  )
}

export default GenericFormSkeleton
