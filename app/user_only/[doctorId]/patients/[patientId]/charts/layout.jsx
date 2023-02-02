import ChartsNav from '../../../../../../components/chartsNav'

const Layout = ({children, params: {doctorId, patientId}}) => {
  return (
    <>
      <ChartsNav doctorId={doctorId} patientId={patientId}  />
      <div className="mt-4">
        {children}
      </div>
    </>
    
  )
}

export default Layout