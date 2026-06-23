'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Scoped error boundary for appointment pages (detail, upload-file, prescriptions,
// etc.). Living below the patient layouts means a thrown page error is contained
// here — the navigation sidebars stay mounted instead of the whole /user shell
// being replaced by the top-level error page.
export default function AppointmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    if (error) console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center w-full min-h-[60vh]">
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 max-w-md w-full text-center space-y-5">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mx-auto">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="font-semibold text-lg text-foreground">Couldn&apos;t load this page</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Something went wrong while loading this appointment. Try again, or go back.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button size="sm" onClick={() => reset()} className="rounded-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
