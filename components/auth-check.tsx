'use cache: private'

import { redirect } from "next/navigation"
import { createClient } from '@/utils/supabase/server'

export async function AuthCheck() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/user')
  }

  return null
}

