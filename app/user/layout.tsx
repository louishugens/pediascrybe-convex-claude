// 'use server'
import Sidenav from '@/components/sidenav'
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from 'react'



const Layout = async props => {

  const {
    children
  } = props;


  return (
    <div className='flex relative h-screen w-screen overflow-hidden'>
      <Suspense fallback={<div className='h-full w-64 bg-green-50 shadow sticky px-8' />}>
        <Sidenav />
      </Suspense>
      <div className="h-full w-full overflow-y-scroll px-4 py-4">
        {children}
        <Toaster richColors position="top-center" toastOptions={{ duration: 10000 }} closeButton={true} />
      </div>
    </div>
  )
}

export default Layout