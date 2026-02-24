'use client'

import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { offlineDb } from '@/lib/offline/db'
import VaccineTrackingDashboard from '@/components/patient/vaccine-tracking-dashboard'
import type {
  CachedPatient,
  CachedVaccin,
  CachedVaccinationRecord,
} from '@/lib/offline/types'

interface OfflineVaccinesPageProps {
  patientId: string
  onNavigate: (route: string) => void
}

export function OfflineVaccinesPage({ patientId, onNavigate }: OfflineVaccinesPageProps) {
  const [patient, setPatient] = useState<CachedPatient | null>(null)
  const [vaccines, setVaccines] = useState<CachedVaccin[]>([])
  const [records, setRecords] = useState<CachedVaccinationRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [p, cachedVaccines, cachedRecords] = await Promise.all([
          offlineDb.patients.get(patientId),
          offlineDb.vaccins.toArray(),
          offlineDb.vaccinationRecords
            .where('patientId')
            .equals(patientId)
            .toArray()
            .catch(() => []),
        ])
        setPatient(p ?? null)
        setVaccines(cachedVaccines)
        setRecords(cachedRecords)
      } catch {
        setPatient(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [patientId])

  // Build the vaccines-with-doses array that VaccineTrackingDashboard expects
  const vaccinesWithDoses = useMemo(() => {
    return vaccines.map((v) => ({
      ...v,
      doses: (v as any).doses || [],
    }))
  }, [vaccines])

  if (loading) return <VaccinesSkeleton />

  if (!patient) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Patient not found in offline cache.</p>
      </div>
    )
  }

  return (
    <div className="h-full mb-8 mt-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate(`/user/patients/${patientId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            Vaccines — {patient.firstname} {patient.lastname}
          </h1>
        </div>
        <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
          <WifiOff className="h-3 w-3" /> Offline
        </Badge>
      </div>

      {/* Vaccination Tracking Dashboard — same component as online */}
      <VaccineTrackingDashboard
        patientId={patientId}
        birthdate={patient.birthdate}
        vaccines={vaccinesWithDoses as any}
        records={records as any}
      />

      {/* Vaccination History (simplified table from cached records) */}
      {records.length > 0 && (
        <div className="flex flex-col gap-4 w-full h-fit rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Vaccination History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Vaccine
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Manufacturer
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Lot #
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  // Look up vaccine name from cached vaccins
                  const vaccin = vaccines.find((v) => v._id === record.vaccinId)
                  return (
                    <tr key={record._id} className="border-b border-border/30">
                      <td className="px-3 py-2 font-medium">{vaccin?.name || 'Unknown'}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{record.manufacturer}</td>
                      <td className="px-3 py-2 text-muted-foreground">{record.lotNumber}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function VaccinesSkeleton() {
  return (
    <div className="h-full mb-8 mt-4 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="rounded-xl border border-border/50 bg-card/50 p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-3 w-full mb-3 rounded-full" />
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-4">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-2 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
