import ChartsNav from '@/components/chartsNav'

const Layout = async props => {
  const params = await props.params;

  const {
    patientId
  } = params;

  const {
    children
  } = props;

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