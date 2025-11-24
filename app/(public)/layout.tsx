import { SiteHeader } from '@/components/siteHeader';
import Footer from '@/components/Footer';
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthCheck } from '@/components/auth-check'
 
export const metadata: Metadata = {
  title: 'Pediatric Care, Elevated by AI Integration | Pediascrybe',
  description: 'Tailored for dedicated pediatricians, Pediascrybe streamlines patient data management like never before. Harness the power of advanced AI integration to elevate your practice. Experience efficiency and precision like never before.',
  metadataBase: new URL('https://www.pediascrybe.com'),
  alternates: {
    canonical: '/',
  },

}

export default function RootLayout({children}) {
  return (
    <div className='relative flex min-h-screen flex-col'>
      <Suspense fallback={null}>
        <AuthCheck />
      </Suspense>
      <SiteHeader />
      <div className='flex-1'>{children}</div>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  )
}
