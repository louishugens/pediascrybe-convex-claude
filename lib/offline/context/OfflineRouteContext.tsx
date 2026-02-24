'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { useNetworkStatus } from '@/lib/offline/hooks/useNetworkStatus'

interface OfflineRouteContextType {
  /** The route currently visible — real pathname when online, managed state when offline */
  effectiveRoute: string
  /** Navigate within the offline shell */
  navigate: (route: string) => void
  /** Whether we are currently in offline-routing mode */
  isOfflineRouting: boolean
}

const OfflineRouteContext = createContext<OfflineRouteContextType | null>(null)

/**
 * Returns the offline route context.
 * Returns `null` when used outside the provider (safe to check).
 */
export function useOfflineRoute() {
  return useContext(OfflineRouteContext)
}

export function OfflineRouteProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useNetworkStatus()
  const pathname = usePathname()
  const [offlineRoute, setOfflineRoute] = useState(pathname)
  const wasOffline = useRef(false)

  // Track offline transitions to avoid resetting the route
  useEffect(() => {
    if (!isOnline) {
      // Going offline — only capture pathname if we weren't already offline
      if (!wasOffline.current) {
        setOfflineRoute(pathname)
      }
      wasOffline.current = true
    } else {
      // Back online — sync with the real pathname
      wasOffline.current = false
      setOfflineRoute(pathname)
    }
  }, [isOnline, pathname])

  const navigate = useCallback(
    (route: string) => {
      setOfflineRoute(route)

      // Update the browser URL bar so the user sees where they are
      try {
        window.history.pushState({ offline: true }, '', route)
      } catch {
        // pushState may fail in some environments — non-critical
      }
    },
    []
  )

  // Listen for back/forward browser navigation while offline
  useEffect(() => {
    if (isOnline) return

    const handlePopState = () => {
      // The URL already changed; sync our state with it
      setOfflineRoute(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOnline])

  const effectiveRoute = isOnline ? pathname : offlineRoute
  const isOfflineRouting = !isOnline

  return (
    <OfflineRouteContext.Provider
      value={{ effectiveRoute, navigate, isOfflineRouting }}
    >
      {children}
    </OfflineRouteContext.Provider>
  )
}
