'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { offlineDb } from '@/lib/offline/db'
import EditPatient from '@/components/editPatient'
import type { CachedPatient, CachedDoctor } from '@/lib/offline/types'
import { toast } from 'sonner'
import { useOfflineRoute } from '@/lib/offline/context/OfflineRouteContext'
import { useNetworkStatus } from '@/lib/offline/hooks/useNetworkStatus'

interface OfflineEditPatientProps {
  patientId: string
}

/**
 * Loads patient + doctor from IndexedDB and renders the
 * same EditPatient form used online — with offline save support.
 */
export function OfflineEditPatient({ patientId }: OfflineEditPatientProps) {
  const [patient, setPatient] = useState<CachedPatient | null>(null)
  const [doctor, setDoctor] = useState<CachedDoctor | null>(null)
  const [loading, setLoading] = useState(true)
  const offlineCtx = useOfflineRoute()
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    const load = async () => {
      try {
        const [p, docs] = await Promise.all([
          offlineDb.patients.get(patientId),
          offlineDb.doctors.toArray(),
        ])
        setPatient(p ?? null)
        setDoctor(docs[0] ?? null)
      } catch {
        setPatient(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [patientId])

  if (loading) {
    return <EditPatientSkeleton />
  }

  if (!patient || !doctor) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Patient or doctor not found in offline cache.</p>
      </div>
    )
  }

  return (
    <OfflineEditPatientForm
      patient={patient}
      doctorId={doctor._id}
      patientId={patientId}
      offlineNavigate={offlineCtx?.navigate}
      isOnline={isOnline}
    />
  )
}

/**
 * Wraps the real EditPatient component but intercepts the form submit
 * when offline to save to IndexedDB + queue for sync.
 */
function OfflineEditPatientForm({
  patient,
  doctorId,
  patientId,
  offlineNavigate,
  isOnline,
}: {
  patient: CachedPatient
  doctorId: string
  patientId: string
  offlineNavigate?: (route: string) => void
  isOnline: boolean
}) {
  // The EditPatient component uses fetch + router.push internally.
  // When offline, the fetch will fail. We override the submit by
  // wrapping it in a component that patches the save behavior.
  //
  // Since EditPatient doesn't expose onSubmit as a prop, we wrap it
  // and intercept the fetch call at a higher level via the OfflineContentGuard
  // click interceptor for navigation.
  //
  // For the actual save, we render the real EditPatient form.
  // The fetch call inside it will fail when offline, but we add a
  // global fetch interceptor below to handle it.

  useEffect(() => {
    if (isOnline) return

    // Intercept fetch calls to the updatePatient API when offline
    const originalFetch = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url
      if (url.includes('/api/patients/updatePatient') && init?.method === 'POST') {
        try {
          const body = JSON.parse(init.body as string)
          const now = Date.now()

          // Update the patient in IndexedDB
          await offlineDb.patients.update(patientId, {
            ...body,
            birthdate: typeof body.birthdate === 'string' ? new Date(body.birthdate).getTime() : body.birthdate,
            updatedAt: now,
            _cachedAt: now,
          })

          // Queue the mutation for sync
          await offlineDb.syncQueue.add({
            apiRoute: '/api/patients/updatePatient',
            method: 'POST',
            payload: body,
            status: 'pending',
            retryCount: 0,
            maxRetries: 3,
            entityType: 'patient',
            entityId: patientId,
            createdAt: now,
          })

          toast.info('Patient updated offline. Will sync when back online.')

          // Navigate back to patient detail
          if (offlineNavigate) {
            offlineNavigate(`/user/patients/${patientId}`)
          }

          // Return a fake successful response
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          console.error('Offline patient update failed:', err)
          toast.error('Failed to save patient offline.')
          throw err
        }
      }

      return originalFetch(input, init)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [isOnline, patientId, offlineNavigate])

  return (
    <div>
      {!isOnline && (
        <div className="flex justify-end mb-2">
          <Badge
            variant="outline"
            className="text-xs gap-1 text-amber-600 border-amber-300"
          >
            <WifiOff className="h-3 w-3" /> Offline — changes will sync later
          </Badge>
        </div>
      )}
      <EditPatient patient={patient as any} doctorId={doctorId} />
    </div>
  )
}

function EditPatientSkeleton() {
  return (
    <div className="py-4">
      <div className="rounded-xl border p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full max-w-md mx-auto rounded-full" />
      </div>
    </div>
  )
}
