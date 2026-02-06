"use client"

import Link from "next/link"
import { format, isThisYear } from "date-fns"
import { Calendar, FileText, Pill, FlaskConical, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Appointment {
  _id: string
  startDate: number
  motif?: string
  findings?: string
  medication?: any
  exams?: any
}

interface AppointmentTimelineProps {
  appointments: Appointment[]
  patientId: string
}

export function AppointmentTimeline({ appointments, patientId }: AppointmentTimelineProps) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>No appointments recorded yet.</p>
      </div>
    )
  }

  // Group by year-month
  const grouped = appointments.reduce<Record<string, Appointment[]>>((acc, apt) => {
    const date = new Date(apt.startDate)
    const key = format(date, "MMMM yyyy")
    if (!acc[key]) acc[key] = []
    acc[key].push(apt)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, apts]) => (
        <div key={month}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{month}</h3>
          <div className="space-y-2">
            {apts.map((apt) => (
              <Link
                key={apt._id}
                href={`/portal/children/${patientId}/appointments/${apt._id}` as any}
              >
                <div className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4 hover:border-primary/20 hover:shadow-sm transition-all">
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-lg font-bold text-foreground">
                      {format(new Date(apt.startDate), "d")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.startDate), "EEE")}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {apt.motif || "General Visit"}
                    </p>
                    {apt.findings && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {apt.findings.slice(0, 100)}
                      </p>
                    )}
                    <div className="flex gap-2 mt-1.5">
                      {apt.medication && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Pill className="h-3 w-3" />
                          Prescription
                        </Badge>
                      )}
                      {apt.exams && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <FlaskConical className="h-3 w-3" />
                          Lab Exams
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
