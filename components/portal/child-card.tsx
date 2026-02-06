"use client"

import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Syringe, ChevronRight, Stethoscope } from "lucide-react"

interface ChildCardProps {
  patient: {
    _id: string
    firstname: string
    lastname: string
    birthdate: number
    sex?: string
    doctorName?: string
    doctorSpec?: string | null
    nextAppointment?: {
      _id: string
      startDate: number
      motif?: string
    } | null
    vaccineCompliancePercent: number
  }
}

export function ChildCard({ patient }: ChildCardProps) {
  const initials = `${patient.firstname[0]}${patient.lastname[0]}`.toUpperCase()
  const age = formatDistanceToNow(new Date(patient.birthdate), { addSuffix: false })

  return (
    <Link href={`/portal/children/${patient._id}` as any}>
      <div className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">
                {patient.firstname} {patient.lastname}
              </h3>
              <p className="text-sm text-muted-foreground">
                {age} old {patient.sex ? `· ${patient.sex}` : ""}
              </p>
              {patient.doctorName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Stethoscope className="h-3 w-3" />
                  {patient.doctorName}
                  {patient.doctorSpec && <span className="text-muted-foreground/70">— {patient.doctorSpec}</span>}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Next Appointment */}
        {patient.nextAppointment && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="h-4 w-4" />
            <span>
              Next: {format(new Date(patient.nextAppointment.startDate), "MMM d, yyyy")}
            </span>
            {patient.nextAppointment.motif && (
              <Badge variant="secondary" className="text-xs">
                {patient.nextAppointment.motif}
              </Badge>
            )}
          </div>
        )}

        {/* Vaccine Compliance */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Syringe className="h-3.5 w-3.5" />
              <span>Vaccine Compliance</span>
            </div>
            <span className="font-medium">{patient.vaccineCompliancePercent}%</span>
          </div>
          <Progress value={patient.vaccineCompliancePercent} className="h-2" />
        </div>
      </div>
    </Link>
  )
}
