import { redirect } from "next/navigation"
import { isAuthenticated } from "@/lib/auth-server"

export async function AuthCheck() {
  const authenticated = await isAuthenticated()

  if (authenticated) {
    redirect('/user')
  }

  return null
}

