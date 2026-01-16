import { Skeleton } from "@/components/ui/skeleton"

const AppointmentPageSkeleton = () => {
  return (
    <div className='py-4'>
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 text-sm text-slate-900">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col">
            <div className='flex items-center gap-2'>
              <span className='text-primary'>Record of</span>
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
          <div className="flex flex-row justify-start gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-4 grid-cols-3 mt-4 mb-4">
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Service Type:</span>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Cost:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Height:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Weight:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Head Circumference:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Arm Circumference:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">SaO2:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Temperature:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Pulse:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Respiratory Rate:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Systolic Blood Pressure:</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold">Diastolic Blood Pressure:</span>
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-4 grid-cols-2 mt-8">
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Signs and Symptoms</p>
            <Skeleton className="w-full h-40 rounded-md" />
          </div>
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Diagnostic</p>
            <Skeleton className="w-full h-40 rounded-md" />
          </div>
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Other remarks</p>
            <Skeleton className="w-full h-40 rounded-md" />
          </div>
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Prescription</p>
            <Skeleton className="w-full h-40 rounded-md" />
            <div className="mt-1 flex flex-row justify-between">
              <Skeleton className="h-8 w-24 rounded-full self-end mt-2" />
              <Skeleton className="h-8 w-20 rounded-full self-end mt-2" />
            </div>
          </div>
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Lab exams</p>
            <Skeleton className="w-full h-40 rounded-md" />
            <div className="mt-1 flex flex-row justify-between">
              <Skeleton className="h-8 w-24 rounded-full self-end mt-2" />
              <Skeleton className="h-8 w-20 rounded-full self-end mt-2" />
            </div>
          </div>
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Recommendations</p>
            <Skeleton className="w-full h-40 rounded-md" />
            <div className="mt-1 flex flex-row justify-between">
              <Skeleton className="h-8 w-24 rounded-full self-end mt-2" />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-row items-center justify-between">
            <p className="font-semibold">Uploaded files</p>
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          <div className="flex flex-row w-full h-auto items-end gap-4 mt-2">
            <Skeleton className="h-24 w-24 rounded-md" />
            <Skeleton className="h-24 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppointmentPageSkeleton
