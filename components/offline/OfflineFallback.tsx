'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OfflineFallbackProps {
  onNavigate: (route: string) => void
}

export function OfflineFallback({ onNavigate }: OfflineFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4 py-12">
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
        <WifiOff className="h-6 w-6 text-amber-600" />
      </div>
      <h2 className="font-semibold text-lg">Page not available offline</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        This page requires an internet connection. You can still access your dashboard, patients, and profile with cached data.
      </p>
      <div className="flex gap-3">
        <Button variant="default" size="sm" onClick={() => onNavigate('/user')}>
          Dashboard
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('/user/patients')}>
          Patients
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('/user/profile')}>
          Profile
        </Button>
      </div>
    </div>
  )
}
