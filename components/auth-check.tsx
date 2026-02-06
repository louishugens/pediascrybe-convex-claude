import { redirect } from "next/navigation"
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server"
import { api } from "@/convex/_generated/api"

export async function AuthCheck() {
  const authenticated = await isAuthenticated()

  if (authenticated) {
    try {
      const appUser = await fetchAuthQuery(api.appUsers.getCurrentAppUser)
      if (appUser?.role === "patient") {
        redirect('/portal')
      }
      if (appUser?.role === "doctor" || appUser?.role === "admin") {
        redirect('/user')
      }
    } catch {
      // If query fails, don't redirect — let the client-side role guards handle it
    }
  }

  return null
}
