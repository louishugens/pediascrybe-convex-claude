'use client'

import { useEffect, useState } from 'react'
import { offlineDb } from '@/lib/offline/db'
import EditAppointment from '@/components/edit-appointment'
import type { CachedAppointment, CachedPatient, CachedService } from '@/lib/offline/types'
import { Skeleton } from '@/components/ui/skeleton'

interface OfflineEditAppointmentProps {
  patientId: string
  appointmentId: string
}

export function OfflineEditAppointment({
  patientId,
  appointmentId,
}: OfflineEditAppointmentProps) {
  const [appointment, setAppointment] = useState<CachedAppointment | null>(null)
  const [patient, setPatient] = useState<CachedPatient | null>(null)
  const [services, setServices] = useState<CachedService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      offlineDb.appointments.get(appointmentId),
      offlineDb.patients.get(patientId),
      offlineDb.services.toArray(),
    ])
      .then(([apt, pat, svcs]) => {
        setAppointment(apt ?? null)
        setPatient(pat ?? null)
        setServices(svcs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [appointmentId, patientId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!appointment || !patient) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Required data not found in offline cache.</p>
      </div>
    )
  }

  return (
    <EditAppointment
      appointment={appointment}
      patientId={patientId}
      patient={patient}
      services={services as any}
    />
  )
}
