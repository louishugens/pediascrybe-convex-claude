"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Id } from "@/convex/_generated/dataModel"

interface SlotPickerProps {
  doctorId: Id<"doctors">
  date: string
  selectedSlot: { startTime: string; endTime: string } | null
  onSelect: (slot: { startTime: string; endTime: string }) => void
}

export function SlotPicker({ doctorId, date, selectedSlot, onSelect }: SlotPickerProps) {
  const slots = useQuery(api.telehealthAvailability.getAvailableSlots, {
    doctorId,
    date,
  })

  if (slots === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No available slots for this date.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.startTime === slot.startTime &&
          selectedSlot?.endTime === slot.endTime

        return (
          <Button
            key={slot.startTime}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="justify-start"
            onClick={() => onSelect(slot)}
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            {slot.startTime}
          </Button>
        )
      })}
    </div>
  )
}
