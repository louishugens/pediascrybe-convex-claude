import Sidenav from './sidenav'


const Layout = ({children}) => {
  return (
    <div className='flex flex-row relative h-screen w-screen p-4'>
      <Sidenav />
      <div className="min-h-full w-full">
        {children}
      </div>
    </div>
  )
}

export default Layout