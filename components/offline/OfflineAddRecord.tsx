'use client'

import { useEffect, useState } from 'react'
import { offlineDb } from '@/lib/offline/db'
import AddAppointment from '@/components/add-appointment'
import type { CachedPatient, CachedDoctor, CachedService } from '@/lib/offline/types'
import type { Id } from '@/convex/_generated/dataModel'
import { Skeleton } from '@/components/ui/skeleton'

interface OfflineAddRecordProps {
  patientId: string
}

export function OfflineAddRecord({ patientId }: OfflineAddRecordProps) {
  const [patient, setPatient] = useState<CachedPatient | null>(null)
  const [doctor, setDoctor] = useState<CachedDoctor | null>(null)
  const [services, setServices] = useState<CachedService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      offlineDb.patients.get(patientId),
      offlineDb.doctors.toArray(),
      offlineDb.services.toArray(),
    ])
      .then(([p, doctors, svcs]) => {
        setPatient(p ?? null)
        setDoctor(doctors[0] ?? null)
        setServices(svcs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) {
    return <AddRecordSkeleton />
  }

  if (!patient || !doctor) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Required data not found in offline cache.</p>
      </div>
    )
  }

  return (
    <AddAppointment
      doctorId={doctor._id as Id<"doctors">}
      patientId={patientId as Id<"patients">}
      patient={patient}
      services={services as any}
    />
  )
}

function AddRecordSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-12 w-48 rounded-full mx-auto" />
    </div>
  )
}
