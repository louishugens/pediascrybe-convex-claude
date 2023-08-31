import { Montserrat } from 'next/font/google'
import  '@/css/globals.css'
import { AnalyticsWrapper } from '@/components/analytics';
import GA from '@/components/googleAnalytics';
import SupabaseProvider from '@/utils/supabase-provider'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SiteHeader } from '@/components/siteHeader';
import Footer from '@/components/Footer';


const montserrat = Montserrat({
  subsets: ['latin']
})

export const dynamic = 'force-dynamic'
export default async function RootLayout({children}) {
  const supabase = createServerComponentClient({cookies})

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en" className={montserrat.className}>
      <body className='min-h-screen bg-background font-sans antialiased' >  
        <GA />  
        <div className='flex-1'>{children}</div>
        <AnalyticsWrapper />
      </body>
    </html>
  )
}
