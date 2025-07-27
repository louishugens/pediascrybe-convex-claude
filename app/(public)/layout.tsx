import { SiteHeader } from '@/components/siteHeader';
import Footer from '@/components/Footer';
import type { Metadata } from 'next'
import { redirect } from "next/navigation"
import { createClient } from '@/utils/supabase/server'
 
export const metadata: Metadata = {
  title: 'Pediatric Care, Elevated by AI Integration | Pediascrybe',
  description: 'Tailored for dedicated pediatricians, Pediascrybe streamlines patient data management like never before. Harness the power of advanced AI integration to elevate your practice. Experience efficiency and precision like never before.',
  metadataBase: new URL('https://www.pediascrybe.com'),
  alternates: {
    canonical: '/',
  },

}

export default async function RootLayout({children}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await (await supabase).auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <div className='relative flex min-h-screen flex-col'>
      <SiteHeader />
      <div className='flex-1'>{children}</div>
      <Footer />
    </div>
  )
}
