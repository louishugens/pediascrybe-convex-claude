import { redirect } from "next/navigation"
import { createClient } from '@/utils/supabase/server'

export default async function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await (await supabase).auth.getSession()

  if (session) {
    redirect('/user')
  }
  
  return (
    <div>
      {children}
    </div>
  )
} 