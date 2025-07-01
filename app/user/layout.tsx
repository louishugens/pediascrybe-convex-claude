// 'use server'
import Sidenav from '@/components/sidenav'
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'
import { Toaster } from "@/components/ui/sonner"



const Layout = async props => {
  const params = await props.params;

  const {
    patientId
  } = params;

  const {
    children
  } = props;

  const supabase = await createClient()
  const { data: {user}} = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }


  return (
    <div className='flex relative h-screen w-screen overflow-hidden'>
      <Sidenav />
      <div className="h-full w-full overflow-y-scroll px-8 py-4">
        {children}
        <Toaster richColors position="top-center" toastOptions={{ duration: 10000 }} closeButton={true} />
      </div>
    </div>
  )
}

export default Layout