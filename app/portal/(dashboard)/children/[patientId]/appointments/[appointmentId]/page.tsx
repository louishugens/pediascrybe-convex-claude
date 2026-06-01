"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Spinner } from "@/components/ui/spinner"
import { VitalsSummary } from "@/components/portal/vitals-summary"
import { format } from "date-fns"
import { Calendar, FileText, Image as ImageIcon, FileDown, Printer, Pill, FlaskConical } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AIExplainerCard } from "@/components/portal/ai-explainer-card"

export default function AppointmentDetailPage() {
  const params = useParams()
  const patientId = params.patientId as Id<"patients">
  const appointmentId = params.appointmentId as Id<"appointments">

  const appointment = useQuery(api.portal.getAppointmentDetail, {
    patientId,
    appointmentId,
  })
  const patient = useQuery(api.portal.getPatientDetails, { patientId })
  const doctor = useQuery(api.portal.getPatientDoctor, { patientId })

  if (appointment === undefined || patient === undefined || doctor === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!appointment) {
    return <div className="text-center py-20 text-muted-foreground">Appointment not found</div>
  }

  const medications = Array.isArray(appointment.prescriptions) ? appointment.prescriptions : []
  const exams = Array.isArray(appointment.labOrders) ? appointment.labOrders : []

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-xl font-bold">
            {format(new Date(appointment.startDate), "EEEE, MMMM d, yyyy")}
          </h2>
          {appointment.motif && (
            <p className="text-muted-foreground">{appointment.motif}</p>
          )}
        </div>
      </div>

      {/* Vitals */}
      {(appointment.height || appointment.weight || appointment.temperature) && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Vitals
          </h3>
          <VitalsSummary
            height={appointment.height}
            weight={appointment.weight}
            head={appointment.head}
            temperature={appointment.temperature}
            pulse={appointment.pulse}
            respiratory={appointment.respiratory}
            systolic={appointment.systolic}
            diastolic={appointment.diastolic}
            sao2={appointment.sao2}
          />
        </div>
      )}

      {/* Findings */}
      {appointment.findings && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Findings
          </h3>
          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
            <p className="text-sm whitespace-pre-wrap">{appointment.findings}</p>
          </div>
        </div>
      )}

      {/* AI Diagnostic Explainer */}
      {(appointment.findings || appointment.recommendation) && (
        <AIExplainerCard
          type="diagnostic"
          context={{
            findings: appointment.findings,
            recommendation: appointment.recommendation,
            motif: appointment.motif,
          }}
          patientId={patientId}
          appointmentId={appointmentId}
        />
      )}

      {/* Recommendations */}
      {appointment.recommendation && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Recommendations
          </h3>
          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
            <p className="text-sm whitespace-pre-wrap">{appointment.recommendation}</p>
          </div>
        </div>
      )}

      {/* Other Remarks */}
      {appointment.otherRemarks && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Other Remarks
          </h3>
          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
            <p className="text-sm whitespace-pre-wrap">{appointment.otherRemarks}</p>
          </div>
        </div>
      )}

      {/* Prescription */}
      {medications.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Prescription
            </h3>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/portal/children/${patientId}/appointments/${appointmentId}/print-prescription` as any}>
                <Printer className="h-4 w-4" />
                Print
              </Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
            {medications.map((med: any, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <Pill className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    {med.drug}{med.count ? `, ${med.count} ${med.unit || 'flacon'}` : ''}
                  </p>
                  {med.posology && (
                    <p className="text-sm text-muted-foreground">{med.posology}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Medication Explainer */}
      {medications.length > 0 && (
        <AIExplainerCard
          type="medication"
          context={{
            medications: medications.map((m: any) => ({
              drug: m.drug,
              count: m.count,
              unit: m.unit,
              posology: m.posology,
            })),
            patientAge: patient
              ? `${Math.floor((Date.now() - patient.birthdate) / (365.25 * 24 * 60 * 60 * 1000))} years`
              : undefined,
          }}
          patientId={patientId}
          appointmentId={appointmentId}
        />
      )}

      {/* Lab Exams */}
      {exams.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Lab Exams
            </h3>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/portal/children/${patientId}/appointments/${appointmentId}/print-exams` as any}>
                <Printer className="h-4 w-4" />
                Print
              </Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-2">
            {exams.map((exam: any, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <FlaskConical className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-medium">{exam.examName || exam.exam || String(exam)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Lab Exam Explainer */}
      {exams.length > 0 && (
        <AIExplainerCard
          type="lab_exam"
          context={{
            exams: exams.map((e: any) => (typeof e === "string" ? e : e.examName ?? e.exam)),
          }}
          patientId={patientId}
          appointmentId={appointmentId}
        />
      )}

      {/* Attached Files */}
      {appointment.files && appointment.files.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Attached Files
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {appointment.files.map((file: any) => (
              <Link
                key={file._id}
                href={file.url as any}
                target="_blank"
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 hover:border-primary/20 transition-colors"
              >
                {file.fileType === "IMAGE" ? (
                  <ImageIcon className="h-5 w-5 text-primary" />
                ) : (
                  <FileText className="h-5 w-5 text-primary" />
                )}
                <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                <FileDown className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
