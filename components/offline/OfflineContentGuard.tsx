'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { useNetworkStatus } from '@/lib/offline/hooks/useNetworkStatus'
import { useOfflineRoute } from '@/lib/offline/context/OfflineRouteContext'
import { offlineDb } from '@/lib/offline/db'
import { Skeleton } from '@/components/ui/skeleton'
import { OfflineDashboard } from './OfflineDashboard'
import { OfflinePatientList } from './OfflinePatientList'
import { OfflinePatientDetail } from './OfflinePatientDetail'
import { OfflineAddRecord } from './OfflineAddRecord'
import { OfflineAppointmentDetail } from './OfflineAppointmentDetail'
import { OfflineEditAppointment } from './OfflineEditAppointment'
import { OfflineEditPatient } from './OfflineEditPatient'
import { OfflineProfile } from './OfflineProfile'
import { OfflineFallback } from './OfflineFallback'
import { OfflineVaccinesPage } from './OfflineVaccinesPage'
import { OfflinePatientLayout } from './OfflinePatientLayout'
import type { CachedDoctor } from '@/lib/offline/types'

// Direct import — dynamic() fails offline when the chunk isn't cached
import AddPatientPage from '@/app/user/add-patient/page'
import EditDoctorComponent from '@/components/editDoctor'

// ─── Main Guard ───

export function OfflineContentGuard({ children }: { children: ReactNode }) {
  const { isOnline } = useNetworkStatus()
  const offlineCtx = useOfflineRoute()

  // Intercept ALL link clicks when offline
  useEffect(() => {
    if (isOnline || !offlineCtx) return

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Allow mailto:, tel:, etc.
      if (/^(mailto|tel|sms):/.test(href)) return

      e.preventDefault()
      e.stopPropagation()

      // Route through offline navigation
      if (href.startsWith('/user')) {
        offlineCtx.navigate(href)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [isOnline, offlineCtx])

  if (!isOnline && offlineCtx) {
    return (
      <OfflineRouter
        route={offlineCtx.effectiveRoute}
        onNavigate={offlineCtx.navigate}
      />
    )
  }

  return children
}

// ─── Route matching (most specific patterns first) ───

const EDIT_APPOINTMENT_RE = /^\/user\/patients\/([^/]+)\/([^/]+)\/edit-appointment$/
const ADD_RECORD_RE = /^\/user\/patients\/([^/]+)\/add-record$/
const EDIT_PATIENT_RE = /^\/user\/patients\/([^/]+)\/edit-patient$/
const VACCINES_RE = /^\/user\/patients\/([^/]+)\/vaccines$/
const APPOINTMENT_DETAIL_RE = /^\/user\/patients\/([^/]+)\/([^/]+)$/
const PATIENT_DETAIL_RE = /^\/user\/patients\/([^/]+)$/

// Known patient sub-routes that are NOT appointment IDs
const KNOWN_PATIENT_SUBROUTES = new Set([
  'charts', 'vaccines', 'reports', 'receipts', 'scrybegpt',
  'add-record', 'edit-patient', 'hfa', 'wfa', 'bfa', 'hcfa', 'wfl',
  'hfa5To19', 'bfa5To19', 'wfl0To2',
])

function OfflineRouter({
  route,
  onNavigate,
}: {
  route: string
  onNavigate: (route: string) => void
}) {
  // Normalize trailing slashes
  const normalizedRoute = route.length > 1 && route.endsWith('/') ? route.slice(0, -1) : route

  // Static routes
  if (normalizedRoute === '/user') return <OfflineDashboard />
  if (normalizedRoute === '/user/patients') return <OfflinePatientList onNavigate={onNavigate} />
  if (normalizedRoute === '/user/add-patient') return <AddPatientPage />
  if (normalizedRoute === '/user/profile') return <OfflineProfile />
  if (normalizedRoute === '/user/edit-profile') return <EditProfileLoader />

  // Dynamic patient routes
  let match: RegExpMatchArray | null

  match = normalizedRoute.match(EDIT_APPOINTMENT_RE)
  if (match) {
    return (
      <OfflinePatientLayout patientId={match[1]}>
        <OfflineEditAppointment patientId={match[1]} appointmentId={match[2]} />
      </OfflinePatientLayout>
    )
  }

  match = normalizedRoute.match(ADD_RECORD_RE)
  if (match) {
    return (
      <OfflinePatientLayout patientId={match[1]}>
        <OfflineAddRecord patientId={match[1]} />
      </OfflinePatientLayout>
    )
  }

  match = normalizedRoute.match(EDIT_PATIENT_RE)
  if (match) {
    return (
      <OfflinePatientLayout patientId={match[1]}>
        <OfflineEditPatient patientId={match[1]} />
      </OfflinePatientLayout>
    )
  }

  match = normalizedRoute.match(VACCINES_RE)
  if (match) {
    return (
      <OfflinePatientLayout patientId={match[1]}>
        <OfflineVaccinesPage patientId={match[1]} onNavigate={onNavigate} />
      </OfflinePatientLayout>
    )
  }

  match = normalizedRoute.match(APPOINTMENT_DETAIL_RE)
  if (match && !KNOWN_PATIENT_SUBROUTES.has(match[2])) {
    return (
      <OfflinePatientLayout patientId={match[1]}>
        <OfflineAppointmentDetail
          patientId={match[1]}
          appointmentId={match[2]}
          onNavigate={onNavigate}
        />
      </OfflinePatientLayout>
    )
  }

  match = normalizedRoute.match(PATIENT_DETAIL_RE)
  if (match) {
    return <OfflinePatientDetail patientId={match[1]} onNavigate={onNavigate} />
  }

  // Fallback: for unhandled sub-routes under a patient (e.g. print pages, chart pages),
  // redirect to the nearest handled parent route instead of showing "not available offline"
  const patientSubRouteMatch = normalizedRoute.match(/^\/user\/patients\/([^/]+)\/([^/]+)\//)
  if (patientSubRouteMatch) {
    const patientId = patientSubRouteMatch[1]
    const secondSegment = patientSubRouteMatch[2]
    // If second segment is a known sub-route (charts, reports, etc.), go to patient detail
    // Otherwise it's likely an appointment ID — go to the appointment detail
    if (KNOWN_PATIENT_SUBROUTES.has(secondSegment)) {
      onNavigate(`/user/patients/${patientId}`)
      return null
    }
    onNavigate(`/user/patients/${patientId}/${secondSegment}`)
    return null
  }

  // Unhandled patient sub-route with just one extra segment (e.g. /user/patients/[id]/scrybegpt)
  const patientDirectSubMatch = normalizedRoute.match(/^\/user\/patients\/([^/]+)\/(.+)$/)
  if (patientDirectSubMatch && KNOWN_PATIENT_SUBROUTES.has(patientDirectSubMatch[2])) {
    onNavigate(`/user/patients/${patientDirectSubMatch[1]}`)
    return null
  }

  return <OfflineFallback onNavigate={onNavigate} />
}

// ─── Edit Profile Loader (reads doctor from IDB) ───

function EditProfileLoader() {
  const [doctor, setDoctor] = useState<CachedDoctor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    offlineDb.doctors
      .toArray()
      .then((docs) => setDoctor(docs[0] ?? null))
      .catch(() => setDoctor(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Profile not found in offline cache.</p>
      </div>
    )
  }

  return <EditDoctorComponent doctor={doctor} />
}
