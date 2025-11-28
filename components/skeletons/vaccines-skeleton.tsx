import { Skeleton } from "@/components/ui/skeleton"

const VaccinesSkeleton = () => {
  return (
    <div className='flex flex-col gap-4 w-full h-fit bg-slate-50 rounded-lg p-4'>
      <div className='flex flex-row justify-between'>
        <Skeleton className='h-6 w-32' /> {/* Title: Vaccine Records */}
        <div className='flex flex-row gap-2'>
          <Skeleton className='w-4 h-4 rounded-full' /> {/* Back Icon */}
          <Skeleton className='w-4 h-4 rounded-full' /> {/* Add Icon */}
          <Skeleton className='w-4 h-4 rounded-full' /> {/* Print Icon */}
        </div>
      </div>
      <div className=''>
        <table className="table-auto w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="text-left"><Skeleton className="h-4 w-20" /></th>
              <th className="text-left"><Skeleton className="h-4 w-20" /></th>
              <th className="text-left"><Skeleton className="h-4 w-20" /></th>
              <th className="text-left"><Skeleton className="h-4 w-20" /></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="py-2"><Skeleton className="h-4 w-24" /></td>
                <td className="py-2"><Skeleton className="h-4 w-24" /></td>
                <td className="py-2"><Skeleton className="h-4 w-24" /></td>
                <td className="py-2"><Skeleton className="h-4 w-24" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VaccinesSkeleton
