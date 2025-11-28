import { Skeleton } from "@/components/ui/skeleton"

const PrintAppointmentSkeleton = () => {
  return (
    <div className="flex flex-col items-center w-full p-8 gap-8">
      <div className="w-full max-w-4xl border rounded-lg p-8 shadow-sm bg-white space-y-8">
        {/* Header with doctor info and logo */}
        <div className="flex justify-between items-start border-b pb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>

        {/* Patient info section */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>

        {/* Appointment details */}
        <div className="space-y-4 pt-8">
          <Skeleton className="h-6 w-1/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>

        {/* Signature section */}
        <div className="flex justify-end pt-12">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    </div>
  )
}

export default PrintAppointmentSkeleton
