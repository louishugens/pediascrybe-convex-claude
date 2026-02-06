"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { VitalsSummary } from "@/components/portal/vitals-summary"
import { formatDistanceToNow, format } from "date-fns"
import {
  Calendar,
  Syringe,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Droplets,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export default function ChildOverviewPage() {
  const params = useParams()
  const patientId = params.patientId as Id<"patients">

  const patient = useQuery(api.portal.getPatientDetails, { patientId })
  const doctor = useQuery(api.portal.getPatientDoctor, { patientId })
  const upcoming = useQuery(api.portal.getUpcomingAppointments, { patientId })
  const appointments = useQuery(api.portal.getPatientAppointments, { patientId })
  const compliance = useQuery(api.portal.getPatientVaccineCompliance, { patientId })

  if (patient === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!patient) {
    return <div className="text-center py-20 text-muted-foreground">Patient not found</div>
  }

  const age = formatDistanceToNow(new Date(patient.birthdate), { addSuffix: false })
  const latestAppointment = appointments?.[0]

  // Calculate vaccine compliance percentage
  let vaccinePercent = 0
  if (compliance) {
    let totalDoses = 0
    for (const vaccine of compliance.vaccines) {
      for (const dose of vaccine.doses) {
        if (dose.doseType === "regular" && dose.doseCount) {
          totalDoses += dose.doseCount
        } else {
          totalDoses += 1
        }
      }
    }
    vaccinePercent = totalDoses > 0 ? Math.min(Math.round((compliance.records.length / totalDoses) * 100), 100) : 0
  }

  return (
    <div className="space-y-6">
      {/* Patient Info Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Demographics */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Patient Info</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Age:</span> <span className="font-medium">{age}</span></p>
            <p><span className="text-muted-foreground">Sex:</span> <span className="font-medium capitalize">{patient.sex || "Not specified"}</span></p>
            {patient.bloodtype && (
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-red-500" />
                <span className="font-medium">{patient.bloodtype}</span>
              </div>
            )}
            {patient.allergies && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">{patient.allergies}</span>
              </div>
            )}
            {patient.mothername && (
              <p><span className="text-muted-foreground">Mother:</span> <span className="font-medium">{patient.mothername}</span></p>
            )}
          </div>
        </div>

        {/* Doctor Info */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Doctor</h3>
          {doctor ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {doctor.title ? `${doctor.title} ` : ""}{doctor.firstname} {doctor.lastname}
                </span>
              </div>
              {doctor.spec && (
                <p className="text-muted-foreground">{doctor.spec}</p>
              )}
              {doctor.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{doctor.phone}</span>
                </div>
              )}
              {doctor.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{doctor.email}</span>
                </div>
              )}
              {doctor.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{doctor.address}</span>
                </div>
              )}
            </div>
          ) : (
            <Spinner />
          )}
        </div>
      </div>

      {/* Latest Vitals */}
      {latestAppointment && (latestAppointment.height || latestAppointment.weight) && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Latest Vitals
            <span className="text-xs font-normal ml-2">
              ({format(new Date(latestAppointment.startDate), "MMM d, yyyy")})
            </span>
          </h3>
          <VitalsSummary
            height={latestAppointment.height}
            weight={latestAppointment.weight}
            head={latestAppointment.head}
            temperature={latestAppointment.temperature}
            pulse={latestAppointment.pulse}
            respiratory={latestAppointment.respiratory}
            systolic={latestAppointment.systolic}
            diastolic={latestAppointment.diastolic}
            sao2={latestAppointment.sao2}
          />
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcoming && upcoming.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Upcoming Appointments
            </h3>
            <Link
              href={`/portal/children/${patientId}/appointments` as any}
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.map((apt) => (
              <div
                key={apt._id}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3"
              >
                <Calendar className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {format(new Date(apt.startDate), "EEEE, MMMM d, yyyy")}
                  </p>
                  {apt.motif && (
                    <p className="text-xs text-muted-foreground">{apt.motif}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vaccine Compliance */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Vaccine Compliance
          </h3>
          <Link
            href={`/portal/children/${patientId}/vaccines` as any}
            className="text-sm text-primary hover:underline"
          >
            View Details
          </Link>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Syringe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Overall Progress</span>
            </div>
            <span className="text-sm font-semibold">{vaccinePercent}%</span>
          </div>
          <Progress value={vaccinePercent} className="h-2.5" />
        </div>
      </div>
    </div>
  )
}
