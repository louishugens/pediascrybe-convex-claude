'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WifiOff, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const [isOffline, setIsOffline] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const goOffline = () => setIsOffline(true)
    const goOnline = () => {
      setIsOffline(false)
      reset()
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [reset])

  useEffect(() => {
    if (error) {
      console.error(error.message || error)
    }
  }, [error])

  if (isOffline) {
    return (
      <div className="flex items-center justify-center w-full min-h-[60vh]">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 max-w-sm w-full text-center space-y-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950/30 mx-auto">
            <WifiOff className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-foreground">You&apos;re offline</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Data will reload automatically when your connection is restored.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => reset()} className="rounded-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center w-full min-h-[60vh]">
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 max-w-md w-full text-center space-y-5">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mx-auto">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="font-semibold text-lg text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-1">
            An unexpected error occurred. Try refreshing or go back to the dashboard.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/user')} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button size="sm" onClick={() => reset()} className="rounded-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          If this keeps happening, <a className="text-primary hover:underline" href="mailto:admin@pediascrybe.com">contact support</a>.
        </p>
      </div>
    </div>
  )
}
