// 'use server'
import Sidenav from '@/components/sidenav'
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
// import supabase from '@/utils/supabase-ssr';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Toaster } from "@/components/ui/sonner"



const Layout = async ({children, params: {  patientId }}) => {
  // const supabase = createServerComponentClient({cookies})
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  const { data: {session}} = await supabase.auth.getSession()

  if (!session) {
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