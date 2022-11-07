import './globals.css'
import Header from './header'

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <head>
        <title>Don&apos;t mind your handwriting no more | Prescrybr</title>
        <meta name="description" content="Print and send prescription that people can read" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className='py-2 px-4'>
        <Header />
        {children}
      </body>
    </html>
  )
}
