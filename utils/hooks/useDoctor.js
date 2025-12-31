'use client'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { authClient } from '@/lib/auth-client'

const useDoctor = () => {
  const { data: session } = authClient.useSession()
  
  const doctor = useQuery(
    api.doctors.getDoctorByAuthUserId,
    session?.user ? { authUserId: session.user.id } : 'skip'
  )

  return doctor ?? null
}

export default useDoctor
