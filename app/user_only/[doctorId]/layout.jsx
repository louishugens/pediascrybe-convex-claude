import Sidenav from '../../../components/sidenav'


const Layout = ({children, params: { doctorId }}) => {
  return (
    <div className='flex flex-row relative h-screen w-screen p-4'>
      <Sidenav doctorId={doctorId} />
      <div className="h-full w-full overflow-y-scroll pb-2">
        {children}
      </div>
    </div>
  )
}

export default Layout