import { Suspense } from 'react'
import { ViewTransition } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ChartCarouselWrapper from '@/components/patient/chart-carousel-wrapper'
import ConsultationListWrapper from '@/components/patient/consultation-list-wrapper'
import ChartCarouselSkeleton from '@/components/patient/chart-carousel-skeleton'

type Params = Promise<{ patientId: string }>

function ConsultationListSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

async function Patient({ params }: { params: Params }) {
  const { patientId } = await params;

  return (
    <ViewTransition>
      <div className="flex flex-col gap-6">
        {/* Chart Carousel */}
        <Suspense fallback={<ChartCarouselSkeleton />}>
          <ChartCarouselWrapper patientId={patientId} />
        </Suspense>

        {/* Consultation List */}
        <Suspense fallback={<ConsultationListSkeleton />}>
          <ConsultationListWrapper patientId={patientId} />
        </Suspense>
      </div>
    </ViewTransition>
  )
}

export default Patient
