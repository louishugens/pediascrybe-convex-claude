import ChartsNav from '@/components/chartsNav'
import { Suspense, ViewTransition } from 'react'
import ChartsNavSkeleton from '@/components/skeletons/charts-nav-skeleton'

type Params = Promise<{ patientId: string }>

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) => {


  return (
    <div className="w-full overflow-hidden">
      <ViewTransition>
        <Suspense fallback={<ChartsNavSkeleton />}>
          <ChartNavContainer params={params} />
        </Suspense>
      </ViewTransition>
      <div className="mt-4">
        {children}
      </div>
    </div>
  )
}

export default Layout


async function ChartNavContainer({ params }: { params: Params }) {
  'use cache'

  const { patientId } = await params;

  return (
    <ChartsNav patientId={patientId} />
  )
}