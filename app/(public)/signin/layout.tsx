// import { createServerClient } from "@/utils/supabase-server"
import supabase from "@/utils/supabase-ssr"
import { redirect } from "next/navigation"

const SigninLayout = async ({children}) => {
  // const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect('/user')
  }
  
  return (
    <div>
      {children}
    </div>
  )
}

export default SigninLayout 