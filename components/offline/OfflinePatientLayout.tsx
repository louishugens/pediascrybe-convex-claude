'use client'

import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { offlineDb } from '@/lib/offline/db'
import DemographicsPreview from '@/components/patient/demographics-preview'
import VaccinationStatusCard from '@/components/patient/vaccination-status-card'
import QuickActions from '@/components/patient/quick-actions'
import type {
  CachedPatient,
  CachedVaccin,
  CachedVaccinationRecord,
} from '@/lib/offline/types'

interface OfflinePatientLayoutProps {
  patientId: string
  children: ReactNode
}

/**
 * Mirrors the online (withLayout)/layout.tsx — main content on the left,
 * patient sidebar (demographics + vaccination + quick-actions) on the right.
 */
export function OfflinePatientLayout({
  patientId,
  children,
}: OfflinePatientLayoutProps) {
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
            .catch(() => [] as CachedVaccinationRecord[]),
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

  const vaccinationData = useMemo(() => {
    if (!patient || vaccines.length === 0) return null
    const vaccinesWithDoses = vaccines.map((v) => ({
      ...v,
      doses: (v as any).doses || [],
    }))
    return { vaccines: vaccinesWithDoses, records }
  }, [patient, vaccines, records])

  if (loading) {
    return <LayoutSkeleton />
  }

  return (
    <div className="flex gap-6 w-full relative">
      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-x-clip">{children}</div>

      {/* Sidebar — mirrors (withLayout)/layout.tsx */}
      <aside className="hidden lg:block w-[320px] shrink-0">
        <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4">
          {/* Offline badge */}
          <div className="flex justify-end">
            <Badge
              variant="outline"
              className="text-xs gap-1 text-amber-600 border-amber-300"
            >
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          </div>

          {patient && (
            <>
              <DemographicsPreview
                patient={patient as any}
                patientId={patientId}
              />

              {vaccinationData &&
                vaccinationData.vaccines.length > 0 && (
                  <VaccinationStatusCard
                    patientId={patientId}
                    birthdate={patient.birthdate}
                    vaccines={vaccinationData.vaccines as any}
                    records={vaccinationData.records as any}
                  />
                )}

              <QuickActions
                patientId={patientId}
                patientName={`${patient.firstname} ${patient.lastname}`}
                patientEmail={patient.email}
              />
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

function LayoutSkeleton() {
  return (
    <div className="flex gap-6 w-full">
      <div className="flex-1 min-w-0">
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </div>
      </div>
      <aside className="hidden lg:block w-[320px] shrink-0">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-9 w-full mt-4 rounded-full" />
          </div>
          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
