"use client"

import { Spinner } from "@/components/ui/spinner"
import { WeeklyScheduleEditor } from "@/components/telehealth/WeeklyScheduleEditor"
import { ExceptionsManager } from "@/components/telehealth/ExceptionsManager"
import { Video } from "lucide-react"

export default function TelehealthAvailabilityPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Video className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Telehealth Availability</h1>
          <p className="text-muted-foreground">Set your weekly schedule for video consultations.</p>
        </div>
      </div>

      <WeeklyScheduleEditor />
      <ExceptionsManager />
    </div>
  )
}
