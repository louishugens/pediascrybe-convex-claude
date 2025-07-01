import { redirect } from "next/navigation"
import { createClient } from '@/utils/supabase/server'

export default async function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await (await supabase).auth.getUser()
  console.log(user)

  if (user) {
    redirect('/user')
  }
  
  return (
    <div>
      {children}
    </div>
  )
} 