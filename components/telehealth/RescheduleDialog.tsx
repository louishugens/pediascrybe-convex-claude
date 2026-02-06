"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"
import { SlotPicker } from "./SlotPicker"

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: Id<"telehealthAppointments">
  doctorId: Id<"doctors">
}

export function RescheduleDialog({
  open,
  onOpenChange,
  appointmentId,
  doctorId,
}: RescheduleDialogProps) {
  const proposeReschedule = useMutation(api.telehealth.proposeReschedule)
  const [date, setDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!date || !selectedSlot) return
    setSubmitting(true)
    try {
      await proposeReschedule({
        id: appointmentId,
        proposedDate: date,
        proposedStartTime: selectedSlot.startTime,
        proposedEndTime: selectedSlot.endTime,
      })
      toast.success("Reschedule proposal sent")
      onOpenChange(false)
      setDate("")
      setSelectedSlot(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to propose reschedule")
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Propose New Time</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>New Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setSelectedSlot(null)
              }}
              className="mt-1"
            />
          </div>
          {date && (
            <div>
              <Label>Available Slots</Label>
              <div className="mt-2">
                <SlotPicker
                  doctorId={doctorId}
                  date={date}
                  selectedSlot={selectedSlot}
                  onSelect={setSelectedSlot}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!date || !selectedSlot || submitting}
          >
            {submitting ? "Sending..." : "Propose Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
