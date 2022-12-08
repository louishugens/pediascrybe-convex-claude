import './globals.css'
import Header from './header'
// import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
// import { SessionContextProvider } from '@supabase/auth-helpers-react'

export default function RootLayout({children}) {
  // const [supabaseClient] = useState(() => createBrowserSupabaseClient())
  return (
    <html lang="en">
      <head>
        <title>Don&apos;t mind your handwriting no more | Prescrybr</title>
        <meta name="description" content="Print and send prescription that people can read" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      {/* <SessionContextProvider
        supabaseClient={supabaseClient}
        initialSession={pageProps.initialSession}
      > */}
        <body>          
          {children}
        </body>
      {/* </SessionContextProvider> */}
    </html>
  )
}
