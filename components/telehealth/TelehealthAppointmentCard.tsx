"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TelehealthStatusBadge } from "./TelehealthStatusBadge"
import { PaymentStatusBadge } from "./PaymentStatusBadge"
import { Calendar, Clock, User, Stethoscope } from "lucide-react"

interface TelehealthAppointmentCardProps {
  appointment: {
    _id: string
    date: string
    startTime: string
    endTime: string
    status: "requested" | "confirmed" | "rescheduled" | "completed" | "cancelled" | "no_show"
    paymentStatus: "pending" | "paid" | "waived"
    motif?: string
    patientName?: string
    doctorName?: string
    proposedDate?: string
    proposedStartTime?: string
    proposedEndTime?: string
    notes?: string
  }
  role: "doctor" | "patient"
  actions?: React.ReactNode
}

export function TelehealthAppointmentCard({ appointment, role, actions }: TelehealthAppointmentCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {role === "doctor" ? (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {appointment.patientName}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                {appointment.doctorName}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <TelehealthStatusBadge status={appointment.status} />
            <PaymentStatusBadge status={appointment.paymentStatus} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {appointment.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {appointment.startTime} - {appointment.endTime}
          </span>
        </div>

        {appointment.motif && (
          <p className="text-sm text-muted-foreground">
            <strong>Reason:</strong> {appointment.motif}
          </p>
        )}

        {appointment.status === "rescheduled" && appointment.proposedDate && (
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            <strong>Proposed new time:</strong> {appointment.proposedDate} at {appointment.proposedStartTime} - {appointment.proposedEndTime}
          </div>
        )}

        {appointment.notes && (
          <p className="text-sm text-muted-foreground">
            <strong>Notes:</strong> {appointment.notes}
          </p>
        )}

        {actions && (
          <div className="flex items-center gap-2 pt-2">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
