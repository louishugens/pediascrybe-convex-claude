"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { useNetworkStatus } from "@/lib/offline/hooks/useNetworkStatus"
import { getCachedAppUser } from "@/lib/offline/cache-manager"
import { WifiOff } from "lucide-react"

export function DoctorRoleGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const { isOnline } = useNetworkStatus()
  const appUser = useQuery(api.appUsers.getCurrentAppUser, isOnline ? undefined : "skip")
  const router = useRouter()
  const [offlineAuth, setOfflineAuth] = useState<"loading" | "allowed" | "denied">("loading")

  // Offline auth check
  useEffect(() => {
    if (isOnline) {
      setOfflineAuth("loading")
      return
    }

    // When offline and Convex returns undefined, check IndexedDB
    if (appUser === undefined && session?.user?.id) {
      getCachedAppUser(session.user.id).then((cached) => {
        if (cached && cached.role === "doctor") {
          setOfflineAuth("allowed")
        } else if (cached && cached.role === "patient") {
          router.replace("/portal")
        } else {
          setOfflineAuth("denied")
        }
      }).catch(() => {
        setOfflineAuth("denied")
      })
    } else if (!session && !sessionPending) {
      setOfflineAuth("denied")
    }
  }, [isOnline, appUser, session, sessionPending, router])

  // Offline: no cached user
  if (!isOnline && offlineAuth === "denied") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-muted-foreground">
        <WifiOff className="h-12 w-12" />
        <p className="text-lg font-medium">You&apos;re offline</p>
        <p className="text-sm">Connect to the internet to sign in</p>
      </div>
    )
  }

  // Offline: cached doctor — allow access
  if (!isOnline && offlineAuth === "allowed") {
    return <>{children}</>
  }

  // Online: standard flow
  // Wait for both session and appUser to be ready before redirecting
  const isLoading = sessionPending || appUser === undefined || (session && appUser === null)

  if (isLoading && isOnline) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (appUser?.role === "patient") {
    return null
  }

  return <>{children}</>
}
