import ChartsNav from '@/components/chartsNav'
import { Suspense } from 'react'

type Params = Promise<{ patientId: string }>

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) => {


  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <ChartNavContainer params={params} />
      </Suspense>
      <div className="mt-4">
        {children}
      </div>
    </>
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