import ChartsNav from '@/components/chartsNav'

type Params = Promise<{ patientId: string }>

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) => {
  const { patientId } = await params;

  return (
    <>
      <ChartsNav patientId={patientId}  />
      <div className="mt-4">
        {children}
      </div>
    </>
  )
}

export default Layout