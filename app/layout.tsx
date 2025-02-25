import { Montserrat } from 'next/font/google'
import  '@/css/globals.css'
import { AnalyticsWrapper } from '@/components/analytics';
import GA from '@/components/googleAnalytics';
import type { Metadata } from 'next'
import { SpeedInsights } from "@vercel/speed-insights/next"
import {PHProvider, PostHogPageview} from './provider';
import { Suspense } from 'react';
 
export const metadata: Metadata = {
  title: 'Pediatric Care, Elevated by AI Integration | Pediascrybe',
  description: 'Tailored for dedicated pediatricians, Pediascrybe streamlines patient data management like never before. Harness the power of advanced AI integration to elevate your practice. Experience efficiency and precision like never before.',
  metadataBase: new URL('https://www.pediascrybe.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Pediatric Care, Elevated by AI Integration | Pediascrybe',
    description: 'Tailored for dedicated pediatricians, Pediascrybe streamlines patient data management like never before. Harness the power of advanced AI integration to elevate your practice. Experience efficiency and precision like never before.',
  },
}


const montserrat = Montserrat({
  subsets: ['latin']
})

// export const dynamic = 'force-dynamic'
export default async function RootLayout({children}) {


  return (
    <html lang="en" className={montserrat.className}>
      {/* <Suspense>
        <PostHogPageview />
      </Suspense> */}
      <Suspense >
      <PHProvider>
        <body className='min-h-screen bg-background font-sans antialiased' >  
          <GA />  
          <div className='flex-1'>{children}</div>
          <AnalyticsWrapper />
          <SpeedInsights />
        </body>
      </PHProvider>
      </Suspense>
    </html>
  )
}
