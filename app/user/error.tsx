'use client' 
 
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
 
export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  const router = useRouter()
 
  return (
    <div className='flex flex-col justify-center  w-full h-full gap-8'>
      <h2 className='font-bold text-red-600 text-2xl'>Unexpected Issue Detected 🛠</h2>
      <p className='text-muted-foreground'>
        Our system detected an issue while processing your request. While this is uncommon, rest assured our team is equipped to resolve it.
      </p>
      <p className='font-medium'>Recommended Actions:</p>
      <ul className='text-muted-foreground'>
        <li className='ml-2'>-Refresh the page to restart the process</li>
        <li className='ml-2'>-Log out and log back in to reset your session</li>
        <li className='ml-2'>-For immediate assistance, <a className='text-blue-500' href='mailto:admin@pediascrybe.com'>Contact Our Expert Support Team</a></li>
      </ul>
      <p className='font-medium'>Or you can click below.</p>
      <button
        className='bg-primary text-white px-8 py-2 w-fit rounded-full cursor-pointer'
        onClick={
          // Attempt to recover by trying to re-render the segment
          // () => router.refresh()
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  )
}