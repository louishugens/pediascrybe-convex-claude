"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
]

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = (i % 2) * 30
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
})

const DURATION_OPTIONS = [15, 20, 30, 45, 60]

export function WeeklyScheduleEditor() {
  const availability = useQuery(api.telehealthAvailability.getMyAvailability)
  const addSlot = useMutation(api.telehealthAvailability.addSlot)
  const updateSlot = useMutation(api.telehealthAvailability.updateSlot)
  const removeSlot = useMutation(api.telehealthAvailability.removeSlot)
  const removeDay = useMutation(api.telehealthAvailability.removeDayAvailability)
  const [saving, setSaving] = useState<string | null>(null)

  const getSlotsForDay = (dayOfWeek: number) => {
    return (availability ?? [])
      .filter((s) => s.dayOfWeek === dayOfWeek && s.isActive)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const handleToggleDay = async (dayOfWeek: number, enabled: boolean) => {
    setSaving(`day-${dayOfWeek}`)
    try {
      if (enabled) {
        await addSlot({
          dayOfWeek,
          startTime: "09:00",
          endTime: "17:00",
          slotDurationMinutes: 30,
        })
        toast.success("Slot added")
      } else {
        await removeDay({ dayOfWeek })
        toast.success("Day disabled")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update schedule")
    }
    setSaving(null)
  }

  const handleAddSlot = async (dayOfWeek: number) => {
    const existing = getSlotsForDay(dayOfWeek)
    // Find the latest endTime among existing slots and start the new slot there
    let startMinutes = 9 * 60 // default 09:00
    for (const s of existing) {
      const [h, m] = s.endTime.split(":").map(Number)
      const end = h * 60 + m
      if (end > startMinutes) startMinutes = end
    }
    const endMinutes = Math.min(startMinutes + 120, 24 * 60) // 2h block or until midnight
    if (startMinutes >= endMinutes) {
      toast.error("No more room to add a slot on this day")
      return
    }
    const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}`
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`

    setSaving(`add-${dayOfWeek}`)
    try {
      await addSlot({
        dayOfWeek,
        startTime,
        endTime,
        slotDurationMinutes: 30,
      })
      toast.success("Slot added")
    } catch (err: any) {
      toast.error(err.message || "Failed to add slot")
    }
    setSaving(null)
  }

  const handleUpdateSlot = async (
    slotId: Id<"telehealthAvailability">,
    currentSlot: { startTime: string; endTime: string; slotDurationMinutes: number },
    field: string,
    value: string | number
  ) => {
    setSaving(slotId)
    try {
      await updateSlot({
        slotId,
        startTime: field === "startTime" ? (value as string) : currentSlot.startTime,
        endTime: field === "endTime" ? (value as string) : currentSlot.endTime,
        slotDurationMinutes: field === "slotDurationMinutes" ? (value as number) : currentSlot.slotDurationMinutes,
      })
      toast.success("Slot updated")
    } catch (err: any) {
      toast.error(err.message || "Failed to update slot")
    }
    setSaving(null)
  }

  const handleRemoveSlot = async (slotId: Id<"telehealthAvailability">) => {
    setSaving(slotId)
    try {
      await removeSlot({ slotId })
      toast.success("Slot removed")
    } catch (err: any) {
      toast.error(err.message || "Failed to remove slot")
    }
    setSaving(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day) => {
          const slots = getSlotsForDay(day.value)
          const isActive = slots.length > 0

          return (
            <div key={day.value} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-24 font-medium">{day.label}</div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => handleToggleDay(day.value, checked)}
                  disabled={saving === `day-${day.value}`}
                />
                {isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto gap-1.5"
                    onClick={() => handleAddSlot(day.value)}
                    disabled={saving === `add-${day.value}`}
                  >
                    <Plus className="h-4 w-4" />
                    Add slot
                  </Button>
                )}
                {!isActive && (
                  <span className="text-sm text-muted-foreground">Not available</span>
                )}
              </div>

              {slots.map((slot) => (
                <div key={slot._id} className="flex items-center gap-3 pl-28">
                  <Select
                    value={slot.startTime}
                    onValueChange={(v) =>
                      handleUpdateSlot(slot._id, slot, "startTime", v)
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">to</span>
                  <Select
                    value={slot.endTime}
                    onValueChange={(v) =>
                      handleUpdateSlot(slot._id, slot, "endTime", v)
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">|</span>
                  <Select
                    value={String(slot.slotDurationMinutes)}
                    onValueChange={(v) =>
                      handleUpdateSlot(slot._id, slot, "slotDurationMinutes", Number(v))
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((d) => (
                        <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveSlot(slot._id)}
                    disabled={saving === slot._id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
