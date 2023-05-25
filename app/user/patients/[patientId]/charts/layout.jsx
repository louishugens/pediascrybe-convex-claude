import ChartsNav from '@/components/chartsNav'

const Layout = ({children, params: { patientId}}) => {
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