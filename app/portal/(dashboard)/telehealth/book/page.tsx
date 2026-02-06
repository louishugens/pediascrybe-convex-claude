"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { SlotPicker } from "@/components/telehealth/SlotPicker"
import { Video, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function BookTelehealthPage() {
  const patients = useQuery(api.portal.getMyPatients)

  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null)
  const [motif, setMotif] = useState("")
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(false)

  const bookMutation = useMutation(api.telehealth.book)

  // Get the doctor ID from the selected patient
  const selectedPatientData = patients?.find((p) => p?._id === selectedPatient)
  const doctorId = selectedPatientData?.doctorId as Id<"doctors"> | undefined

  // Get available dates for the calendar
  const now = new Date()
  const availableDates = useQuery(
    api.telehealthAvailability.getAvailableDates,
    doctorId
      ? { doctorId, year: selectedDate?.getFullYear() || now.getFullYear(), month: (selectedDate?.getMonth() ?? now.getMonth()) + 1 }
      : "skip"
  )

  const dateString = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : null

  const handleBook = async () => {
    if (!selectedPatient || !dateString || !selectedSlot || !doctorId) return
    setBooking(true)
    try {
      await bookMutation({
        doctorId,
        patientId: selectedPatient as Id<"patients">,
        date: dateString,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        motif: motif || undefined,
      })
      setBooked(true)
      toast.success("Appointment requested!")
    } catch (err: any) {
      toast.error(err.message || "Failed to book appointment")
    }
    setBooking(false)
  }

  if (patients === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (booked) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Appointment Requested</h1>
        <p className="text-muted-foreground">
          Your telehealth appointment has been submitted. The doctor will confirm it shortly.
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <Button asChild>
            <Link href={"/portal/telehealth/appointments" as any}>View Appointments</Link>
          </Button>
          <Button variant="outline" onClick={() => {
            setBooked(false)
            setSelectedPatient(null)
            setSelectedDate(undefined)
            setSelectedSlot(null)
            setMotif("")
          }}>
            Book Another
          </Button>
        </div>
      </div>
    )
  }

  const availableDateSet = new Set(availableDates || [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Video className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Book Telehealth Appointment</h1>
          <p className="text-muted-foreground">Schedule a video consultation with your doctor.</p>
        </div>
      </div>

      {/* Step 1: Select Child */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1: Select Child</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {patients.map((patient) => {
              if (!patient) return null
              return (
                <Button
                  key={patient._id}
                  variant={selectedPatient === patient._id ? "default" : "outline"}
                  className="justify-start h-auto py-3"
                  onClick={() => {
                    setSelectedPatient(patient._id)
                    setSelectedDate(undefined)
                    setSelectedSlot(null)
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">{patient.firstname} {patient.lastname}</div>
                    <div className="text-xs opacity-70">{patient.doctorName}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Select Date */}
      {selectedPatient && doctorId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 2: Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date)
                setSelectedSlot(null)
              }}
              disabled={(date) => {
                const today = new Date()
                today.setHours(23, 59, 59, 999) // block the entire day including tonight
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                return date <= today || !availableDateSet.has(dateStr)
              }}
              modifiers={{
                available: (date) => {
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                  return availableDateSet.has(dateStr)
                },
              }}
              modifiersClassNames={{
                available: "bg-green-50 text-green-700 font-medium",
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Time Slot */}
      {selectedPatient && doctorId && dateString && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 3: Select Time</CardTitle>
          </CardHeader>
          <CardContent>
            <SlotPicker
              doctorId={doctorId}
              date={dateString}
              selectedSlot={selectedSlot}
              onSelect={setSelectedSlot}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 4: Confirm Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Reason for Visit (optional)</Label>
              <Textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Describe the reason for the consultation..."
                className="mt-1"
              />
            </div>

            <div className="rounded-md bg-muted p-4 text-sm space-y-1">
              <p><strong>Child:</strong> {selectedPatientData?.firstname} {selectedPatientData?.lastname}</p>
              <p><strong>Date:</strong> {dateString}</p>
              <p><strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
              <p><strong>Doctor:</strong> {selectedPatientData?.doctorName}</p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleBook}
              disabled={booking}
            >
              {booking ? "Booking..." : "Request Appointment"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
