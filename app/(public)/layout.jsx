import { SiteHeader } from '@/components/siteHeader';
import Footer from '@/components/Footer';


export default async function RootLayout({children}) {
  return (
    <div className='relative flex min-h-screen flex-col'>
      <SiteHeader />
      <div className='flex-1'>{children}</div>
      <Footer />
    </div>
  )
}
