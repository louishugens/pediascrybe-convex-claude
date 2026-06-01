'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowUturnLeftIcon, PencilIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { EyeOff, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { offlineDb } from '@/lib/offline/db'
import type {
  CachedAppointment,
  CachedPatient,
  CachedService,
  CachedFile,
  CachedPrescription,
  CachedLabOrder,
} from '@/lib/offline/types'
import AppointmentPageSkeleton from '@/components/appointment-page-skeleton'

interface OfflineAppointmentDetailProps {
  patientId: string
  appointmentId: string
  onNavigate: (route: string) => void
}

export function OfflineAppointmentDetail({
  patientId,
  appointmentId,
  onNavigate,
}: OfflineAppointmentDetailProps) {
  const [appointment, setAppointment] = useState<CachedAppointment | null>(null)
  const [patient, setPatient] = useState<CachedPatient | null>(null)
  const [service, setService] = useState<CachedService | null>(null)
  const [files, setFiles] = useState<CachedFile[]>([])
  const [prescriptions, setPrescriptions] = useState<CachedPrescription[]>([])
  const [labOrders, setLabOrders] = useState<CachedLabOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [apt, pat, cachedFiles, cachedRx, cachedLabs] = await Promise.all([
          offlineDb.appointments.get(appointmentId),
          offlineDb.patients.get(patientId),
          offlineDb.files
            .where('appointmentId')
            .equals(appointmentId)
            .toArray()
            .catch(() => [] as CachedFile[]),
          offlineDb.prescriptions
            .where('appointmentId')
            .equals(appointmentId)
            .toArray()
            .catch(() => [] as CachedPrescription[]),
          offlineDb.labOrders
            .where('appointmentId')
            .equals(appointmentId)
            .toArray()
            .catch(() => [] as CachedLabOrder[]),
        ])

        setAppointment(apt ?? null)
        setPatient(pat ?? null)
        setFiles(cachedFiles)
        setPrescriptions(cachedRx.sort((a, b) => a.createdAt - b.createdAt))
        setLabOrders(cachedLabs.sort((a, b) => a.createdAt - b.createdAt))

        // Look up service if the appointment has a serviceId
        if (apt?.serviceId) {
          const svc = await offlineDb.services.get(apt.serviceId).catch(() => null)
          setService(svc ?? null)
        }
      } catch {
        setAppointment(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [appointmentId, patientId])

  if (loading) return <AppointmentPageSkeleton />

  if (!appointment) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Appointment not found in offline cache.</p>
      </div>
    )
  }

  const medications = prescriptions
  const exams = labOrders

  return (
    <div className="py-4">
      {/* Offline badge */}
      <div className="flex justify-end mb-2">
        <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
          <WifiOff className="h-3 w-3" /> Offline
        </Badge>
      </div>

      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 text-sm text-slate-900">
        {/* Header row — matches AppointmentPageComponent */}
        <div className="flex flex-row justify-between">
          <div className="flex flex-col">
            <p className="text-primary">
              Record of{' '}
              <span className="font-bold">
                {format(appointment.startDate, 'yyy-MM-dd hh:mm:ss')}
              </span>
            </p>
          </div>
          <div className="flex flex-row justify-start">
            <Link href={`/user/patients/${patientId}`} className="mr-2">
              <ArrowUturnLeftIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/user/patients/${patientId}/${appointment._id}/edit-appointment`}
              className="mr-2"
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/user/patients/${patientId}/${appointment._id}/print-appointment`}
              className="mr-2 opacity-50 pointer-events-none"
            >
              <PrinterIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Vitals grid — matches AppointmentPageComponent */}
        <div className="grid gap-x-8 gap-y-4 grid-cols-3 mt-4 mb-4">
          {service && (
            <p className="font-semibold">
              Service Type: <span className="font-normal">{service.name}</span>
            </p>
          )}
          {appointment.cost != null && appointment.cost !== 0 && (
            <p className="font-semibold">
              Cost:{' '}
              <span className="font-normal">
                {Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: service?.currency || 'HTG',
                }).format(appointment.cost)}
              </span>
            </p>
          )}
          <p className="font-semibold">
            Height: <span className="font-normal">{appointment.height} cm</span>
          </p>
          <p className="font-semibold">
            Weight: <span className="font-normal">{appointment.weight} kg</span>
          </p>
          <p className="font-semibold">
            Head Circumference: <span className="font-normal">{appointment.head} cm</span>
          </p>
          <p className="font-semibold">
            Arm Circumference: <span className="font-normal">{appointment.arm} cm</span>
          </p>
          <p className="font-semibold">
            SaO2: <span className="font-normal">{appointment.sao2} %</span>
          </p>
          <p className="font-semibold">
            Temperature: <span className="font-normal">{appointment.temperature} °C</span>
          </p>
          <p className="font-semibold">
            Pulse: <span className="font-normal">{appointment.pulse} bpm</span>
          </p>
          <p className="font-semibold">
            Respiratory Rate:{' '}
            <span className="font-normal">{appointment.respiratory} rpm</span>
          </p>
          <p className="font-semibold">
            Systolic Blood Pressure:{' '}
            <span className="font-normal">{appointment.systolic} mmHg</span>
          </p>
          <p className="font-semibold">
            Diastolic Blood Pressure:{' '}
            <span className="font-normal">{appointment.diastolic} mmHg</span>
          </p>
        </div>

        {/* Clinical notes grid — matches AppointmentPageComponent */}
        <div className="grid gap-x-8 gap-y-4 grid-cols-2 mt-8">
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Signs and Symptoms</p>
            <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">
              {appointment.motif}
            </p>
          </div>
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Diagnostic</p>
            <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">
              {appointment.findings}
            </p>
          </div>
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Other remarks</p>
            <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">
              {appointment.otherRemarks}
            </p>
          </div>
          {appointment.internalNotes && (
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-semibold">Internal Notes</p>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <EyeOff className="h-3 w-3" />
                  Private
                </span>
              </div>
              <p className="w-full h-40 bg-amber-50 border border-dashed border-amber-300 rounded-md p-2 mt-1 overflow-scroll">
                {appointment.internalNotes}
              </p>
            </div>
          )}
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Prescription</p>
            <div className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">
              {medications?.map((medication, index) => (
                <div key={index}>
                  <p className="font-semibold">
                    -{medication.drug},{' '}
                    <span className="italic font-normal">
                      {medication.count} {medication.unit ? medication.unit : 'flacon'}
                    </span>
                  </p>
                  <p>{medication.posology}</p>
                </div>
              ))}
            </div>
            <div className="mt-1 flex flex-row justify-between">
              <Link
                href={`/user/patients/${patientId}/${appointment._id}/add-prescription`}
                className="self-end mt-2 shadow bg-slate-200 rounded-full py-1 px-4 text-primary opacity-50 pointer-events-none"
              >
                Add or edit
              </Link>
              <Link
                href={`/user/patients/${patientId}/${appointment._id}/print-prescription`}
                className="self-end mt-2 shadow bg-primary rounded-full py-1 px-4 text-primary-foreground opacity-50 pointer-events-none"
              >
                Print
              </Link>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Lab exams</p>
            <ul className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">
              {exams?.map((exam, index) => (
                <li key={index}>-{exam.examName}</li>
              ))}
            </ul>
            <div className="mt-1 flex flex-row justify-between">
              <Link
                href={`/user/patients/${patientId}/${appointment._id}/add-exams`}
                className="self-end mt-2 shadow text-primary rounded-full py-1 px-4 bg-slate-200 opacity-50 pointer-events-none"
              >
                Add or edit
              </Link>
              <Link
                href={`/user/patients/${patientId}/${appointment._id}/print-exams`}
                className="self-end mt-2 shadow text-primary-foreground rounded-full py-1 px-4 bg-primary opacity-50 pointer-events-none"
              >
                Print
              </Link>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="font-semibold mb-2">Recommendations</p>
            <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">
              {appointment.recommendation}
            </p>
            <div className="mt-1 flex flex-row justify-between">
              <Link
                href={`/user/patients/${patientId}/${appointment._id}/add-recommendation`}
                className="self-end mt-2 shadow text-primary rounded-full py-1 px-4 bg-slate-200 opacity-50 pointer-events-none"
              >
                Add or edit
              </Link>
            </div>
          </div>
        </div>

        {/* Uploaded files */}
        <div className="mt-8">
          <div className="flex flex-row items-center justify-between">
            <p className="font-semibold">Uploaded files</p>
          </div>
          <div className="flex flex-row w-full h-auto items-end gap-4 mt-2">
            {files.length > 0 ? (
              files.map((file) => (
                <div
                  key={file._id}
                  className="flex flex-col items-center gap-1 p-2 border rounded-md"
                >
                  <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{file.fileType}</p>
                </div>
              ))
            ) : (
              <p className="italic text-muted-foreground">
                No files uploaded yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
