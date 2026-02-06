"use client"

import { use } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Spinner } from "@/components/ui/spinner"
import { VideoRoom } from "@/components/telehealth/VideoRoom"

export default function DoctorCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const appointment = useQuery(api.telehealth.getById, {
    id: id as Id<"telehealthAppointments">,
  })

  if (appointment === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Appointment not found</h1>
        <p className="text-muted-foreground">This appointment may have been cancelled or doesn't exist.</p>
      </div>
    )
  }

  return <VideoRoom appointment={appointment} />
}
