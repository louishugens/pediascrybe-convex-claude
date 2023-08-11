import { Montserrat } from 'next/font/google'
import  '../css/globals.css'
import { AnalyticsWrapper } from '../components/analytics';
import GA from '../components/googleAnalytics';
import SupabaseProvider from '@/utils/supabase-provider'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'


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
        <head />
        <body >  
          <GA />  
          {/* <SupabaseProvider session={session}> */}
            {children}
          {/* </SupabaseProvider>       */}
          <AnalyticsWrapper />
        </body>
    </html>
  )
}
