"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { AccessToken, WebhookReceiver } from "livekit-server-sdk";

// Generate a LiveKit token for a telehealth appointment
export const generateToken = action({
  args: { telehealthAppointmentId: v.id("telehealthAppointments") },
  handler: async (ctx, args): Promise<{ token: string; serverUrl: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Fetch appointment (auth-checked by the query itself)
    const appointment: any = await ctx.runQuery(api.telehealth.getById, {
      id: args.telehealthAppointmentId,
    });

    if (!appointment) throw new Error("Appointment not found");

    // Verify status
    if (appointment.status !== "confirmed") {
      throw new Error("Appointment must be confirmed to join");
    }

    // Verify payment
    if (appointment.paymentStatus !== "paid" && appointment.paymentStatus !== "waived") {
      throw new Error("Payment must be completed before joining");
    }

    // Verify time window: within 10 min before → 60 min after scheduled start
    const appointmentTime = new Date(`${appointment.date}T${appointment.startTime}:00`).getTime();
    const now = Date.now();
    const tenMinBefore = appointmentTime - 10 * 60 * 1000;
    const sixtyMinAfter = appointmentTime + 60 * 60 * 1000;

    if (now < tenMinBefore || now > sixtyMinAfter) {
      throw new Error("You can only join within 10 minutes before or 60 minutes after the scheduled start time");
    }

    // Determine participant identity
    const participantIdentity: string = appointment.role === "doctor"
      ? `doctor-${appointment.doctorId}`
      : `patient-${identity.subject}`;

    const participantName: string = appointment.role === "doctor"
      ? appointment.doctorName
      : "Parent";

    // Generate token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error("LiveKit is not configured");
    }

    const at: AccessToken = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: 2 * 60 * 60, // 2 hours
    });

    at.addGrant({
      roomJoin: true,
      room: appointment.roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return {
      token: await at.toJwt(),
      serverUrl: wsUrl,
    };
  },
});

// Handle LiveKit webhook (called from http.ts via internal action)
export const handleWebhook = internalAction({
  args: {
    body: v.string(),
    authHeader: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error("LiveKit not configured");
    }

    const receiver = new WebhookReceiver(apiKey, apiSecret);
    const event = await receiver.receive(args.body, args.authHeader);

    const roomName = event.room?.name;
    if (!roomName) return;

    switch (event.event) {
      case "room_started":
        await ctx.runMutation(internal.telehealth.handleRoomStarted, { roomName });
        break;
      case "participant_joined":
        if (event.participant?.identity) {
          await ctx.runMutation(internal.telehealth.handleParticipantJoined, {
            roomName,
            identity: event.participant.identity,
          });
        }
        break;
      case "room_finished":
        await ctx.runMutation(internal.telehealth.handleRoomFinished, { roomName });
        break;
    }
  },
});
