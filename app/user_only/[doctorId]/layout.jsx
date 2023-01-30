import Sidenav from '../../../components/sidenav'


const Layout = ({children, params: { doctorId }}) => {
  return (
    <div className='flex flex-row relative h-screen w-screen'>
      <Sidenav doctorId={doctorId} />
      <div className="h-full w-full overflow-y-scroll p-4">
        {children}
      </div>
    </div>
  )
}

export default Layout