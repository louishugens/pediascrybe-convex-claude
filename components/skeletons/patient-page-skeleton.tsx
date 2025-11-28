import { Skeleton } from "@/components/ui/skeleton"

const PatientPageSkeleton = () => {
  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex flex-row w-full gap-4">
        <Skeleton className="mt-4 h-9 w-32 rounded-full" />
        <Skeleton className="mt-4 h-9 w-24 rounded-full" />
        <Skeleton className="mt-4 h-9 w-64 rounded-full" />
        <Skeleton className="mt-4 h-9 w-24 rounded-full" />
      </div>
      <div className="flex flex-row w-full justify-between pt-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>
      <table className="table-auto color-0 rounded-lg relative text-sm w-full mt-4 border-separate border-spacing-y-1.5">
        <thead className="rounded-t-lg bg-blue-50">
          <tr className="rounded-full shadow">
            <th className="text-left px-4 py-2 rounded-l-full"><Skeleton className="h-4 w-12" /></th>
            <th className="text-left px-4 py-2"><Skeleton className="h-4 w-16" /></th>
            <th className="text-left px-4 py-2"><Skeleton className="h-4 w-16" /></th>
            <th className="text-left px-4 py-2"><Skeleton className="h-4 w-32" /></th>
            <th className="text-left px-4 py-2 rounded-r-full"><Skeleton className="h-4 w-16" /></th>
          </tr>
        </thead>
        <tbody className='w-full'>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="rounded-full shadow bg-white">
              <td className="px-4 py-2 rounded-l-full"><Skeleton className="h-4 w-24" /></td>
              <td className="px-4 py-2"><Skeleton className="h-4 w-16" /></td>
              <td className="px-4 py-2"><Skeleton className="h-4 w-16" /></td>
              <td className="px-4 py-2"><Skeleton className="h-4 w-16" /></td>
              <td className="px-4 py-2 rounded-r-full"><Skeleton className="h-8 w-20 rounded-full" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PatientPageSkeleton
