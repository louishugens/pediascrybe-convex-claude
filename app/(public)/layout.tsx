import { SiteHeader } from '@/components/siteHeader';
import Footer from '@/components/Footer';
import type { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: 'Pediatric Care, Elevated by AI Integration | Pediascrybe',
  description: 'Tailored for dedicated pediatricians, Pediascrybe streamlines patient data management like never before. Harness the power of advanced AI integration to elevate your practice. Experience efficiency and precision like never before.',
  metadataBase: new URL(`${process.env.BASE_URL}`),

}

export default async function RootLayout({children}) {
  return (
    <div className='relative flex min-h-screen flex-col'>
      <SiteHeader />
      <div className='flex-1'>{children}</div>
      <Footer />
    </div>
  )
}
