'use client'

import { useEffect, useState, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import { offlineDb } from '@/lib/offline/db'
import type { CachedPatient } from '@/lib/offline/types'
import { Skeleton } from '@/components/ui/skeleton'

interface OfflinePatientListProps {
  onNavigate: (route: string) => void
}

export function OfflinePatientList({ onNavigate }: OfflinePatientListProps) {
  const [patients, setPatients] = useState<CachedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    offlineDb.patients
      .toArray()
      .then((cached) => {
        setPatients(
          cached.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        )
      })
      .catch(() => setPatients([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return patients
    const q = search.toLowerCase()
    return patients.filter(
      (p) =>
        p.firstname.toLowerCase().includes(q) ||
        p.lastname.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
    )
  }, [patients, search])

  return (
    <div className="h-full mb-8 pb-4">
      {/* Header — matches online patients/page.tsx */}
      <div className="flex flex-row w-full justify-between">
        <p className="font-bold text-foreground">
          <span className="text-primary">Patient list</span>
        </p>
        <Link
          href="/user/add-patient"
          className="self-end px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm hover:bg-primary/80 transition-colors"
        >
          Add Patient
        </Link>
      </div>

      {/* Offline indicator */}
      <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
        <WifiOff className="h-3 w-3" />
        <span>Showing cached patients (offline)</span>
      </div>

      {/* Search — matches online layout */}
      <div className="flex w-full justify-center">
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md mt-4 px-4 py-2 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {loading ? (
        <PatientListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-start justify-center mt-4">
          <p className="text-sm text-slate-500 italic">
            {search ? 'No matching patients' : 'No patients found'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-3 mt-4 pb-4">
          {filtered.map((patient) => (
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
                </span>{' '}
                old
              </p>
              <div className="flex flex-row justify-between mt-6">
                {/* Using <Link> so clicks are intercepted by OfflineContentGuard */}
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
      )}
    </div>
  )
}

function PatientListSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-3 mt-4 pb-4">
      {Array.from({ length: 15 }).map((_, index) => (
        <div
          key={index}
          className="basis-1/3 h-auto rounded-lg p-4 border border-border"
        >
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="flex flex-row justify-between mt-6">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
