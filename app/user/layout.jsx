import Sidenav from '@/components/sidenav'

export const dynamic = 'force-dynamic';

const Layout = ({children, params: { doctorId, patientId }}) => {

  return (
    <div className='flex flex-row relative h-screen w-screen'>
      <Sidenav doctorId={doctorId} patientId={patientId} />
      <div className="h-full w-full overflow-y-scroll p-4">
        {children}
      </div>
    </div>
  )
}

export default Layout