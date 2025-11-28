import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AddAppointmentSkeleton() {
  return (
    <div className="py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-green-600 font-bold">
            <Skeleton className="h-7 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Service Selection */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Vital Signs Grid */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            {/* Clinical Notes Grid */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-[120px] w-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-[120px] w-full" />
              </div>
              <div className="lg:col-span-2 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-[120px] w-full" />
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Skeleton className="h-12 w-full max-w-md rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
