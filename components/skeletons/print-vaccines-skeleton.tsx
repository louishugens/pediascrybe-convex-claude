import { Skeleton } from "@/components/ui/skeleton"

export default function PrintVaccinesSkeleton() {
  return (
    <div className='pt-4 h-auto relative'>
      <div className="w-full min-h-screen shadow-md rounded-lg px-8 py-8 flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Patient info and title */}
        <div className="py-4 flex flex-row justify-between mb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Vaccine records table */}
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex flex-row gap-4 mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-row gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* Signature */}
        <div className="flex flex-row-reverse mt-8">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-row justify-between pb-2 mt-6">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    </div>
  )
}
