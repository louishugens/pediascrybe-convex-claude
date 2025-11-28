import { Skeleton } from "@/components/ui/skeleton"

export default function AppointmentListSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b text-sm font-light w-full bg-slate-50 shadow pt-12 rounded-full border-none border-spacing-x-2">
          <td className="px-4 py-2 rounded-l-full mt-2">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="px-4 py-2">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="px-4 py-2">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="px-4 py-2">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="px-4 py-2 rounded-r-full">
            <div className="flex flex-row justify-start gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}
