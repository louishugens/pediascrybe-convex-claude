"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Clock, User, Calendar } from "lucide-react"
import { TelehealthStatusBadge } from "./TelehealthStatusBadge"
import { PaymentStatusBadge } from "./PaymentStatusBadge"

interface WaitingRoomProps {
  appointment: {
    _id: string
    date: string
    startTime: string
    endTime: string
    status: string
    paymentStatus: string
    patientName: string
    doctorName: string
    motif?: string
    role: "doctor" | "patient"
  }
  onJoin: () => void
  canJoin: boolean
  joining: boolean
}

export function WaitingRoom({ appointment, onJoin, canJoin, joining }: WaitingRoomProps) {
  const [timeUntil, setTimeUntil] = useState("")

  useEffect(() => {
    const update = () => {
      const appointmentTime = new Date(`${appointment.date}T${appointment.startTime}:00`).getTime()
      const diff = appointmentTime - Date.now()

      if (diff <= 0) {
        setTimeUntil("Starting now")
      } else {
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        if (hours > 0) {
          setTimeUntil(`In ${hours}h ${minutes % 60}m`)
        } else {
          setTimeUntil(`In ${minutes}m`)
        }
      }
    }

    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [appointment.date, appointment.startTime])

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Video className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Waiting Room</h1>
        <p className="text-muted-foreground">{timeUntil}</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {appointment.role === "doctor"
                  ? appointment.patientName
                  : appointment.doctorName}
              </span>
            </div>
            <TelehealthStatusBadge status={appointment.status as any} />
          </div>

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
            <p className="text-sm">
              <strong>Reason:</strong> {appointment.motif}
            </p>
          )}

          <div className="flex items-center gap-2">
            <PaymentStatusBadge status={appointment.paymentStatus as any} />
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={onJoin}
        disabled={!canJoin || joining}
      >
        {joining ? "Connecting..." : canJoin ? "Join Video Call" : "Not yet available"}
      </Button>

      {!canJoin && (
        <p className="text-center text-sm text-muted-foreground">
          {appointment.status !== "confirmed"
            ? "Appointment must be confirmed to join."
            : appointment.paymentStatus === "pending"
              ? "Payment must be completed before joining."
              : "You can join 10 minutes before the scheduled start time."}
        </p>
      )}
    </div>
  )
}
