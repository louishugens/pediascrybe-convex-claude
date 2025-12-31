import Sidenav from '@/components/sidenav'
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from 'react'
import { ClientAuthBoundary } from "@/lib/auth-client"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <ClientAuthBoundary>
      <div className='flex relative h-screen w-screen overflow-hidden'>
        <Suspense fallback={<div className='h-full w-64 bg-green-50 shadow sticky px-8' />}>
          <Sidenav />
        </Suspense>
        <div className="h-full w-full overflow-y-scroll px-4 py-4">
          {children}
          <Toaster richColors position="top-center" toastOptions={{ duration: 10000 }} closeButton={true} />
        </div>
      </div>
    </ClientAuthBoundary>
  )
}

export default Layout