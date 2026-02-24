"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import type { Preloaded } from "convex/react"
import { useEffect, useState } from "react"
import { useNetworkStatus } from "@/lib/offline/hooks/useNetworkStatus"
import { cacheDocuments } from "@/lib/offline/cache-manager"
import { offlineDb } from "@/lib/offline/db"
import { WifiOff } from "lucide-react"

interface PatientListProps {
  preloadedPatients: Preloaded<typeof api.patients.list>
}

// Client component that receives preloaded data
export function PatientListClient({ preloadedPatients }: PatientListProps) {
  const patients = usePreloadedAuthQuery(preloadedPatients) ?? []
  const { isOnline } = useNetworkStatus()
  const [offlinePatients, setOfflinePatients] = useState<any[]>([])

  // Cache-on-read: save patients to IndexedDB when online
  useEffect(() => {
    if (isOnline && patients.length > 0) {
      cacheDocuments("patients", patients).catch(() => {})
    }
  }, [isOnline, patients])

  // Read from IndexedDB when offline
  useEffect(() => {
    if (isOnline) return

    offlineDb.patients.toArray().then((cached) => {
      setOfflinePatients(cached.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)))
    }).catch(() => setOfflinePatients([]))
  }, [isOnline])

  const displayPatients = isOnline ? patients : offlinePatients

  return (
    <>
      {!isOnline && displayPatients.length > 0 && (
        <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
          <WifiOff className="h-3 w-3" />
          <span>Showing cached patients (offline)</span>
        </div>
      )}
      {displayPatients.length === 0 && (
        <div className="flex flex-col items-start justify-center mt-4">
          <p className="text-sm text-slate-500 italic">No patients found</p>
        </div>
      )}
      <div className="grid gap-4 grid-cols-3 mt-4 pb-4">
        {displayPatients.map((patient) => (
          <div
            className="basis-1/3 h-auto rounded-lg p-4 border border-slate-300 hover:border-blue-200 hover:shadow-md"
            key={patient._id}
          >
            <p className="text-base font-semibold text-slate-900">
              {patient.firstname} {patient.lastname}
            </p>
            <p className="text-sm font-light text-slate-900 mt-2 mb-4">
              <span className="font-medium">
                {formatDistanceToNow(new Date(patient.birthdate))}
              </span> old
            </p>
            <div className="flex flex-row justify-between mt-6">
              <Link
                href={`/user/patients/${patient._id}`}
                className="py-2 px-4 rounded-full bg-muted text-primary text-xs font-medium"
              >
                View
              </Link>
              <Link
                href={`/user/patients/${patient._id}/add-record`}
                className="py-2 px-4 rounded-full bg-primary text-xs text-white font-medium"
              >
                Add Record
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// Keep this for backwards compatibility during migration
export default function PatientList({ preloadedPatients }: PatientListProps) {
  return <PatientListClient preloadedPatients={preloadedPatients} />
}

