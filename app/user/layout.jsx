import Sidenav from '@/components/sidenav'

export const dynamic = 'force-dynamic';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";
import { redirect } from 'next/navigation';

const Layout = async ({children, params: { doctorId, patientId }}) => {
  const supabase = createServerComponentClient({cookies})
  const { data: {session}} = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }


  return (
    <div className='flex flex-row relative h-screen w-screen'>
      <Sidenav doctorId={doctorId} patientId={patientId} />
      <div className="h-full w-full overflow-y-scroll px-8 py-4">
        {children}
      </div>
    </div>
  )
}

export default Layout