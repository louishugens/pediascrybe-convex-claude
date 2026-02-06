"use client"

import { useState, useCallback } from "react"
import { useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react"
import "@livekit/components-styles"
import { WaitingRoom } from "./WaitingRoom"
import { toast } from "sonner"

interface VideoRoomProps {
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
    roomName?: string
    role: "doctor" | "patient"
  }
}

export function VideoRoom({ appointment }: VideoRoomProps) {
  const generateToken = useAction(api.livekit.generateToken)
  const [token, setToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  const canJoin =
    appointment.status === "confirmed" &&
    (appointment.paymentStatus === "paid" || appointment.paymentStatus === "waived")

  const handleJoin = useCallback(async () => {
    setJoining(true)
    try {
      const result = await generateToken({
        telehealthAppointmentId: appointment._id as Id<"telehealthAppointments">,
      })
      setToken(result.token)
      setServerUrl(result.serverUrl)
    } catch (err: any) {
      toast.error(err.message || "Failed to join call")
      setJoining(false)
    }
  }, [generateToken, appointment._id])

  const handleDisconnected = useCallback(() => {
    setToken(null)
    setServerUrl(null)
    setJoining(false)
  }, [])

  if (!token || !serverUrl) {
    return (
      <WaitingRoom
        appointment={appointment}
        onJoin={handleJoin}
        canJoin={canJoin}
        joining={joining}
      />
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        onDisconnected={handleDisconnected}
        data-lk-theme="default"
        style={{ height: "100%" }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}
