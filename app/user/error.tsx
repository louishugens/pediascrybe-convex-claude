'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const [isOffline, setIsOffline] = useState(false)

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
      <div className="flex flex-col items-center justify-center w-full h-full gap-4 py-12">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
          <WifiOff className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="font-semibold text-lg">You&apos;re offline</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Data will reload automatically when your connection is restored.
        </p>
        <Button variant="outline" size="sm" onClick={() => reset()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col justify-center w-full h-full gap-8'>
      <h2 className='font-bold text-red-600 text-2xl'>Unexpected Issue Detected</h2>
      <p className='text-muted-foreground'>
        Our system detected an issue while processing your request. While this is uncommon, rest assured our team is equipped to resolve it.
      </p>
      <p className='font-medium'>Recommended Actions:</p>
      <ul className='text-muted-foreground'>
        <li className='ml-2'>-Refresh the page to restart the process</li>
        <li className='ml-2'>-Log out and log back in to reset your session</li>
        <li className='ml-2'>-For immediate assistance, <a className='text-primary' href='mailto:admin@pediascrybe.com'>Contact Our Expert Support Team</a></li>
      </ul>
      <p className='font-medium'>Or you can click below.</p>
      <button
        className='bg-primary text-white px-8 py-2 w-fit rounded-full cursor-pointer'
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  )
}
