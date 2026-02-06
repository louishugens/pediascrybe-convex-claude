"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"

export function PortalRoleGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const appUser = useQuery(api.appUsers.getCurrentAppUser)
  const router = useRouter()

  // Wait for both session and appUser to be ready before redirecting
  const isLoading = sessionPending || appUser === undefined || (session && appUser === null)

  useEffect(() => {
    if (isLoading) return
    if (!session || !appUser || appUser.role !== "patient") {
      router.replace("/user")
    }
  }, [isLoading, session, appUser, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (!session || !appUser || appUser.role !== "patient") {
    return null
  }

  return <>{children}</>
}
