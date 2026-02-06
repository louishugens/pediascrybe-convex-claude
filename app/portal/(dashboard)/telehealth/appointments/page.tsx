"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { TelehealthAppointmentCard } from "@/components/telehealth/TelehealthAppointmentCard"
import { Video, Plus, CalendarX } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function PatientTelehealthAppointmentsPage() {
  const appointments = useQuery(api.telehealth.getPatientAppointments)
  const acceptReschedule = useMutation(api.telehealth.acceptReschedule)
  const cancelMutation = useMutation(api.telehealth.cancel)

  if (appointments === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  const active = appointments.filter((a: any) =>
    ["requested", "confirmed", "rescheduled"].includes(a.status)
  )
  const past = appointments.filter((a: any) =>
    ["completed", "cancelled", "no_show"].includes(a.status)
  )

  const handleAcceptReschedule = async (id: Id<"telehealthAppointments">) => {
    try {
      await acceptReschedule({ id })
      toast.success("Reschedule accepted")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleCancel = async (id: Id<"telehealthAppointments">) => {
    try {
      await cancelMutation({ id })
      toast.success("Appointment cancelled")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Telehealth Appointments</h1>
            <p className="text-muted-foreground">Your scheduled video consultations.</p>
          </div>
        </div>
        <Button asChild>
          <Link href={"/portal/telehealth/book" as any}>
            <Plus className="h-4 w-4 mr-1" />
            Book New
          </Link>
        </Button>
      </div>

      {/* Active Appointments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Upcoming</h2>
        {active.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <CalendarX className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No upcoming telehealth appointments.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={"/portal/telehealth/book" as any}>Book an Appointment</Link>
            </Button>
          </div>
        ) : (
          active.map((apt: any) => (
            <TelehealthAppointmentCard
              key={apt._id}
              appointment={apt}
              role="patient"
              actions={
                <>
                  {apt.status === "rescheduled" && (
                    <Button
                      size="sm"
                      onClick={() => handleAcceptReschedule(apt._id as Id<"telehealthAppointments">)}
                    >
                      Accept New Time
                    </Button>
                  )}
                  {apt.status === "confirmed" &&
                    (apt.paymentStatus === "paid" || apt.paymentStatus === "waived") && (
                      <Button size="sm" asChild>
                        <Link href={`/portal/telehealth/call/${apt._id}` as any}>
                          <Video className="h-4 w-4 mr-1" />
                          Join Call
                        </Link>
                      </Button>
                    )}
                  {!["cancelled", "completed"].includes(apt.status) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(apt._id as Id<"telehealthAppointments">)}
                    >
                      Cancel
                    </Button>
                  )}
                </>
              }
            />
          ))
        )}
      </div>

      {/* Past Appointments */}
      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Past</h2>
          {past.map((apt: any) => (
            <TelehealthAppointmentCard
              key={apt._id}
              appointment={apt}
              role="patient"
            />
          ))}
        </div>
      )}
    </div>
  )
}
