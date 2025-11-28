import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const TransactionsPageSkeleton = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-[280px] rounded-md" />
      </div>

      {/* Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          {/* Table header */}
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>

          {/* Table rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 mb-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}

          {/* Total */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TransactionsPageSkeleton
