"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"

export function ExceptionsManager() {
  const exceptions = useQuery(api.telehealthAvailability.getMyExceptions)
  const addException = useMutation(api.telehealthAvailability.addException)
  const removeException = useMutation(api.telehealthAvailability.removeException)

  const [date, setDate] = useState("")
  const [reason, setReason] = useState("")
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!date) return
    setAdding(true)
    try {
      await addException({ date, reason: reason || undefined })
      setDate("")
      setReason("")
      toast.success("Date blocked")
    } catch (err: any) {
      toast.error(err.message || "Failed to add exception")
    }
    setAdding(false)
  }

  const handleRemove = async (exceptionId: any) => {
    try {
      await removeException({ exceptionId })
      toast.success("Date unblocked")
    } catch (err: any) {
      toast.error(err.message || "Failed to remove exception")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked Dates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
          <Input
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={!date || adding} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Block
          </Button>
        </div>

        {exceptions && exceptions.length > 0 ? (
          <div className="space-y-2">
            {exceptions
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((exc) => (
                <div
                  key={exc._id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{exc.date}</span>
                    {exc.reason && (
                      <span className="text-muted-foreground">— {exc.reason}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(exc._id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No blocked dates.</p>
        )}
      </CardContent>
    </Card>
  )
}
