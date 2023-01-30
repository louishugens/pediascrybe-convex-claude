import { Montserrat } from '@next/font/google'
import  '../css/globals.css'


// const montserrat = Montserrat({
//   subsets: ['latin'],
//   variable: 'font-montserrat',
//   display: 'swap',
// })

const montserrat = Montserrat({
  subsets: ['latin']
})


export default function RootLayout({children}) {

  return (
    <html lang="en" className={montserrat.className}>
        <head />
        <body >          
          {children}
        </body>
    </html>
  )
}
