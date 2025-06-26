import { Skeleton } from "@/components/ui/skeleton"

export default function ChartLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg border">
      {/* Chart Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2 bg-green-100" />
        <Skeleton className="h-4 w-96 bg-green-50" />
      </div>

      {/* Main Chart Area */}
      <div className="relative h-80 bg-gray-50/30 rounded-lg p-6">
        {/* Horizontal grid lines */}
        <div className="absolute inset-6 space-y-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-t border-gray-200" />
          ))}
        </div>

        {/* Bars container */}
        <div className="relative h-full flex items-end justify-center gap-8 pb-8">
          {/* Bar 1 - Very tall */}
          <div className="flex flex-col items-center">
            <Skeleton className="w-16 h-60 bg-green-100 rounded-lg" />
            <Skeleton className="h-3 w-8 mt-3 bg-green-100" />
          </div>

          {/* Bar 2 - Short */}
          <div className="flex flex-col items-center">
            <Skeleton className="w-16 h-16 bg-green-100 rounded-lg" />
            <Skeleton className="h-3 w-8 mt-3 bg-green-100" />
          </div>

          {/* Bar 3 - Very short */}
          <div className="flex flex-col items-center">
            <Skeleton className="w-16 h-8 bg-green-100 rounded-lg" />
            <Skeleton className="h-3 w-8 mt-3 bg-green-100" />
          </div>

          {/* Bar 4 - Short */}
          <div className="flex flex-col items-center">
            <Skeleton className="w-16 h-12 bg-green-100 rounded-lg" />
            <Skeleton className="h-3 w-8 mt-3 bg-green-100" />
          </div>

          {/* Bar 5 - Medium */}
          <div className="flex flex-col items-center">
            <Skeleton className="w-16 h-24 bg-green-100 rounded-lg" />
            <Skeleton className="h-3 w-8 mt-3 bg-green-100" />
          </div>

          {/* Bar 6 - Very short */}
          <div className="flex flex-col items-center">
            <Skeleton className="w-16 h-6 bg-green-100 rounded-lg" />
            <Skeleton className="h-3 w-8 mt-3 bg-green-100" />
          </div>

          {/* Bar 7 - Medium */}
          <div className="flex flex-col items-center">
            <Skeleton className="w-16 h-20 bg-green-100 rounded-lg" />
            <Skeleton className="h-3 w-8 mt-3 bg-green-100" />
          </div>
        </div>
      </div>

      {/* Chart Footer */}
      <div className="mt-6 flex justify-between items-center">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded bg-green-100" />
        </div>
        <Skeleton className="h-4 w-32 bg-green-100" />
      </div>
    </div>
  )
}
