'use client'

import { useEffect, useState, useMemo } from 'react'
import { differenceInDays } from 'date-fns'
import { WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { offlineDb } from '@/lib/offline/db'

// Re-use the exact same components as the online patient page
import DemographicsPreview from '@/components/patient/demographics-preview'
import VaccinationStatusCard from '@/components/patient/vaccination-status-card'
import QuickActions from '@/components/patient/quick-actions'
import ChartCarousel from '@/components/patient/chart-carousel'
import RecordListWrapper from '@/components/patient/record-list-wrapper'

import type { CachedPatient, CachedAppointment, CachedChart, CachedVaccin, CachedVaccinationRecord } from '@/lib/offline/types'
import { Skeleton } from '@/components/ui/skeleton'

interface OfflinePatientDetailProps {
  patientId: string
  onNavigate?: (route: string) => void
}

// ─── Chart data helpers (mirrors server-side ChartCarouselWrapper) ───

interface ReferenceData {
  p03?: number[]
  p15?: number[]
  p50?: number[]
  p85?: number[]
  p97?: number[]
}

interface FormattedChartData {
  age?: number
  length?: number
  '3rd': number | null
  '15th': number | null
  '50th': number | null
  '85th': number | null
  '97th': number | null
  [key: string]: number | null | undefined
}

function getChartId(chartType: string, sex: string | undefined): string {
  const isFemale = sex === 'female'
  switch (chartType) {
    case 'wfa': return isFemale ? 'gwfa' : 'bwfa'
    case 'hfa': return isFemale ? 'ghfa' : 'bhfa'
    case 'bfa': return isFemale ? 'gbfa' : 'bbfa'
    case 'hcfa': return isFemale ? 'ghcfa' : 'bhcfa'
    case 'wfl0To2': return isFemale ? 'gwfh_0_2' : 'bwfh_0_2'
    default: return ''
  }
}

function formatAgeBasedData(
  data: ReferenceData | null,
  patientValues: { age: number; value: number }[],
  patientName: string
): FormattedChartData[] {
  if (!data) return []
  const maxLen = Math.max(
    data.p03?.length || 0, data.p15?.length || 0,
    data.p50?.length || 0, data.p85?.length || 0, data.p97?.length || 0
  )
  const out: FormattedChartData[] = []
  for (let i = 0; i < maxLen; i++) {
    const pv = patientValues.find(item => item.age === i)
    out.push({
      age: i,
      '3rd': data.p03?.[i] ?? null, '15th': data.p15?.[i] ?? null,
      '50th': data.p50?.[i] ?? null, '85th': data.p85?.[i] ?? null,
      '97th': data.p97?.[i] ?? null,
      [patientName]: pv?.value ?? null,
    })
  }
  return out
}

function formatLengthBasedData(
  data: ReferenceData | null,
  patientValues: { length: number; value: number }[],
  patientName: string
): FormattedChartData[] {
  if (!data) return []
  const maxLen = Math.max(
    data.p03?.length || 0, data.p15?.length || 0,
    data.p50?.length || 0, data.p85?.length || 0, data.p97?.length || 0
  )
  const out: FormattedChartData[] = []
  for (let i = 0; i < maxLen; i++) {
    const lengthValue = 45 + i * 0.5
    const pv = patientValues.find(item => Math.abs(item.length - lengthValue) < 0.25)
    out.push({
      length: lengthValue,
      '3rd': data.p03?.[i] ?? null, '15th': data.p15?.[i] ?? null,
      '50th': data.p50?.[i] ?? null, '85th': data.p85?.[i] ?? null,
      '97th': data.p97?.[i] ?? null,
      [patientName]: pv?.value ?? null,
    })
  }
  return out
}

// ─── Main Component ───

export function OfflinePatientDetail({ patientId }: OfflinePatientDetailProps) {
  const [patient, setPatient] = useState<CachedPatient | null>(null)
  const [appointments, setAppointments] = useState<CachedAppointment[]>([])
  const [charts, setCharts] = useState<CachedChart[]>([])
  const [vaccines, setVaccines] = useState<CachedVaccin[]>([])
  const [vaccinationRecords, setVaccinationRecords] = useState<CachedVaccinationRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, apts, cachedCharts, cachedVaccines, cachedRecords] = await Promise.all([
          offlineDb.patients.get(patientId),
          offlineDb.appointments.where('patientId').equals(patientId).sortBy('startDate'),
          offlineDb.charts.toArray(),
          offlineDb.vaccins.toArray(),
          offlineDb.vaccinationRecords.where('patientId').equals(patientId).toArray().catch(() => []),
        ])
        setPatient(p ?? null)
        setAppointments(apts)
        setCharts(cachedCharts)
        setVaccines(cachedVaccines)
        setVaccinationRecords(cachedRecords)
      } catch {
        setPatient(null)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [patientId])

  // Compute chart data from cache
  const allChartData = useMemo(() => {
    if (!patient || charts.length === 0) {
      return { wfa: [], hfa: [], wfl: [], bfa: [], hcfa: [] }
    }
    const patientName = patient.firstname ?? 'patient'
    const birthdate = patient.birthdate
    const chartMap = new Map<string, CachedChart>()
    charts.forEach((c) => chartMap.set(c.chartId, c))

    const wfaRef = chartMap.get(getChartId('wfa', patient.sex)) || null
    const hfaRef = chartMap.get(getChartId('hfa', patient.sex)) || null
    const wflRef = chartMap.get(getChartId('wfl0To2', patient.sex)) || null
    const bfaRef = chartMap.get(getChartId('bfa', patient.sex)) || null
    const hcfaRef = chartMap.get(getChartId('hcfa', patient.sex)) || null

    const wfaData: { age: number; value: number }[] = []
    const hfaData: { age: number; value: number }[] = []
    const wflData: { length: number; value: number }[] = []
    const bfaData: { age: number; value: number }[] = []
    const hcfaData: { age: number; value: number }[] = []

    appointments.forEach((apt) => {
      const ageInDays = differenceInDays(apt.startDate, birthdate)
      if (apt.weight) wfaData.push({ age: ageInDays, value: apt.weight })
      if (apt.height && ageInDays / 30.4375 <= 60) hfaData.push({ age: ageInDays, value: apt.height })
      if (apt.weight && apt.height && ageInDays < 365 * 2) wflData.push({ length: apt.height, value: apt.weight })
      if (apt.weight && apt.height && ageInDays / 30.4375 <= 60) {
        const bmi = apt.weight / Math.pow(apt.height / 100, 2)
        bfaData.push({ age: ageInDays, value: parseFloat(bmi.toPrecision(5)) })
      }
      if (apt.head) hcfaData.push({ age: ageInDays, value: apt.head })
    })

    return {
      wfa: formatAgeBasedData(wfaRef as ReferenceData | null, wfaData, patientName),
      hfa: formatAgeBasedData(hfaRef as ReferenceData | null, hfaData, patientName),
      wfl: formatLengthBasedData(wflRef as ReferenceData | null, wflData, patientName),
      bfa: formatAgeBasedData(bfaRef as ReferenceData | null, bfaData, patientName),
      hcfa: formatAgeBasedData(hcfaRef as ReferenceData | null, hcfaData, patientName),
    }
  }, [patient, appointments, charts])

  // Prepare vaccination compliance data
  const vaccinationData = useMemo(() => {
    if (!patient || vaccines.length === 0) return null
    const vaccinesWithDoses = vaccines.map((v) => ({
      ...v,
      doses: (v as any).doses || [],
    }))
    return { vaccines: vaccinesWithDoses, records: vaccinationRecords }
  }, [patient, vaccines, vaccinationRecords])

  if (loading) return <PatientDetailSkeleton />

  if (!patient) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Patient not found in offline cache.</p>
      </div>
    )
  }

  const hasChartData = Object.values(allChartData).some((d) => d.length > 0)

  return (
    <div className="flex gap-6 w-full relative">
      {/* Main Content — same structure as (withLayout)/page.tsx */}
      <div className="flex-1 min-w-0 overflow-x-clip">
        <div className="flex flex-col gap-6">
          {/* Growth Charts */}
          {hasChartData && (
            <ChartCarousel
              patient={{
                _id: patient._id,
                firstname: patient.firstname,
                lastname: patient.lastname,
                sex: patient.sex,
                birthdate: patient.birthdate,
              }}
              patientId={patientId}
              allChartData={allChartData}
            />
          )}

          {/* Record List — already has offline support via useOfflineQuery */}
          <RecordListWrapper patientId={patientId} />
        </div>
      </div>

      {/* Sidebar — same structure as (withLayout)/layout.tsx */}
      <aside className="hidden lg:block w-[320px] shrink-0">
        <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4">
          {/* Offline indicator */}
          <div className="flex justify-end">
            <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          </div>

          {/* Demographics — exact same component as online */}
          <DemographicsPreview patient={patient as any} patientId={patientId} />

          {/* Vaccination Status — exact same component as online */}
          {vaccinationData && vaccinationData.vaccines.length > 0 && (
            <VaccinationStatusCard
              patientId={patientId}
              birthdate={patient.birthdate}
              vaccines={vaccinationData.vaccines as any}
              records={vaccinationData.records as any}
            />
          )}

          {/* Quick Actions — exact same component as online */}
          <QuickActions
            patientId={patientId}
            patientName={`${patient.firstname} ${patient.lastname}`}
            patientEmail={patient.email}
          />
        </div>
      </aside>
    </div>
  )
}

// ─── Skeleton (matches online version) ───

function PatientDetailSkeleton() {
  return (
    <div className="flex gap-6 w-full">
      <div className="flex-1 min-w-0">
        {/* Chart skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 mb-6">
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </div>
        {/* Records skeleton */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-36 rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
      <aside className="hidden lg:block w-[320px] shrink-0">
        <div className="space-y-4">
          {/* Demographics skeleton */}
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
          {/* Quick Actions skeleton */}
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
