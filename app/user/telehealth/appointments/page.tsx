"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TelehealthAppointmentCard } from "@/components/telehealth/TelehealthAppointmentCard"
import { RescheduleDialog } from "@/components/telehealth/RescheduleDialog"
import { Video, CalendarCheck, History, Clock } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Id } from "@/convex/_generated/dataModel"

export default function DoctorTelehealthAppointmentsPage() {
  const upcoming = useQuery(api.telehealth.getDoctorUpcoming)
  const history = useQuery(api.telehealth.getDoctorHistory)
  const confirmMutation = useMutation(api.telehealth.confirm)
  const cancelMutation = useMutation(api.telehealth.cancel)
  const markPaymentMutation = useMutation(api.telehealth.markPayment)
  const markNoShowMutation = useMutation(api.telehealth.markNoShow)

  const [rescheduleApt, setRescheduleApt] = useState<{ id: Id<"telehealthAppointments">; doctorId: Id<"doctors"> } | null>(null)

  if (upcoming === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  const pending = upcoming?.filter((a) => a.status === "requested") || []
  const confirmed = upcoming?.filter((a) => ["confirmed", "rescheduled"].includes(a.status)) || []

  const handleConfirm = async (id: Id<"telehealthAppointments">) => {
    try {
      await confirmMutation({ id })
      toast.success("Appointment confirmed")
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

  const handleMarkPaid = async (id: Id<"telehealthAppointments">) => {
    try {
      await markPaymentMutation({ id, paymentStatus: "paid" })
      toast.success("Marked as paid")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleWaive = async (id: Id<"telehealthAppointments">) => {
    try {
      await markPaymentMutation({ id, paymentStatus: "waived" })
      toast.success("Payment waived")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleNoShow = async (id: Id<"telehealthAppointments">) => {
    try {
      await markNoShowMutation({ id })
      toast.success("Marked as no-show")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Video className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Telehealth Appointments</h1>
          <p className="text-muted-foreground">Manage your video consultations.</p>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="h-4 w-4" />
            Pending {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-1.5">
            <CalendarCheck className="h-4 w-4" />
            Upcoming {confirmed.length > 0 && `(${confirmed.length})`}
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-1.5">
            <History className="h-4 w-4" />
            Past
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pending.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending requests.</p>
          ) : (
            pending.map((apt) => (
              <TelehealthAppointmentCard
                key={apt._id}
                appointment={apt}
                role="doctor"
                actions={
                  <>
                    <Button size="sm" onClick={() => handleConfirm(apt._id as Id<"telehealthAppointments">)}>
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRescheduleApt({ id: apt._id as Id<"telehealthAppointments">, doctorId: apt.doctorId as Id<"doctors"> })}
                    >
                      Reschedule
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleCancel(apt._id as Id<"telehealthAppointments">)}>
                      Decline
                    </Button>
                  </>
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {confirmed.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No upcoming appointments.</p>
          ) : (
            confirmed.map((apt) => (
              <TelehealthAppointmentCard
                key={apt._id}
                appointment={apt}
                role="doctor"
                actions={
                  <>
                    {apt.paymentStatus === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleMarkPaid(apt._id as Id<"telehealthAppointments">)}>
                          Mark Paid
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleWaive(apt._id as Id<"telehealthAppointments">)}>
                          Waive
                        </Button>
                      </>
                    )}
                    {apt.status === "confirmed" && (apt.paymentStatus === "paid" || apt.paymentStatus === "waived") && (
                      <Button size="sm" asChild>
                        <Link href={`/user/telehealth/call/${apt._id}` as any}>
                          <Video className="h-4 w-4 mr-1" />
                          Join Call
                        </Link>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleNoShow(apt._id as Id<"telehealthAppointments">)}>
                      No Show
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleCancel(apt._id as Id<"telehealthAppointments">)}>
                      Cancel
                    </Button>
                  </>
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-4">
          {history === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No past appointments.</p>
          ) : (
            history.map((apt) => (
              <TelehealthAppointmentCard
                key={apt._id}
                appointment={apt}
                role="doctor"
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {rescheduleApt && (
        <RescheduleDialog
          open={!!rescheduleApt}
          onOpenChange={(open) => !open && setRescheduleApt(null)}
          appointmentId={rescheduleApt.id}
          doctorId={rescheduleApt.doctorId}
        />
      )}
    </div>
  )
}
