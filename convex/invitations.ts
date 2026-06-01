import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Generate a cryptographically secure random token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint8Array(48);
  crypto.getRandomValues(randomValues);
  let token = "";
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(randomValues[i] % chars.length);
  }
  return token;
}

// Create a portal invitation (doctor-side)
export const createInvitation = mutation({
  args: {
    patientId: v.id("patients"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get the doctor record
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();
    if (!doctor) throw new Error("Doctor not found");

    // Verify the patient belongs to this doctor
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.doctorId !== doctor._id) {
      throw new Error("Patient not found");
    }

    // Verify doctor has patient_portal feature access
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }
    const activeStatuses = ["trialing", "active"];
    if (!activeStatuses.includes(subscription.status)) {
      throw new Error("Subscription is not active");
    }
    const tierName = subscription.tierName || subscription.metadata?.tierName || "free";
    // patient_portal requires Professional, Complete, or Institution
    if (!["professional", "complete", "institution"].includes(tierName)) {
      throw new Error("Patient portal requires a Professional or Complete subscription");
    }

    // Check for existing pending invitation for same email + patient
    const existingInvitations = await ctx.db
      .query("patientInvitations")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();

    const existingPending = existingInvitations.find(
      (inv) => inv.email === args.email && inv.status === "pending"
    );

    if (existingPending) {
      throw new Error("An invitation has already been sent to this email for this patient");
    }

    const now = Date.now();
    const token = generateToken();

    const invitationId = await ctx.db.insert("patientInvitations", {
      doctorId: doctor._id,
      patientId: args.patientId,
      email: args.email,
      token,
      status: "pending",
      expiresAt: now + SEVEN_DAYS_MS,
      createdAt: now,
    });

    // Enable portal on patient
    if (!patient.portalEnabled) {
      await ctx.db.patch(args.patientId, { portalEnabled: true });
    }

    // Schedule invitation email
    const siteUrl = process.env.SITE_URL || "https://app.pediascrybe.com";
    const inviteUrl = `${siteUrl}/portal/join?token=${token}`;
    const doctorName = `${doctor.title ? doctor.title + " " : ""}${doctor.firstname} ${doctor.lastname}`;
    const childName = `${patient.firstname} ${patient.lastname}`;

    await ctx.scheduler.runAfter(0, internal.email.sendPortalInvitationAction, {
      to: args.email,
      doctorName,
      childName,
      inviteUrl,
    });

    return invitationId;
  },
});

// Validate an invitation token (public-ish - used by join page)
export const validateInvitation = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("patientInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      return { valid: false, error: "Invitation not found" };
    }

    if (invitation.status !== "pending") {
      return { valid: false, error: `Invitation has been ${invitation.status}` };
    }

    if (invitation.expiresAt < Date.now()) {
      return { valid: false, error: "Invitation has expired" };
    }

    // Get patient and doctor names for display
    const [patient, doctor] = await Promise.all([
      ctx.db.get(invitation.patientId),
      ctx.db.get(invitation.doctorId),
    ]);

    return {
      valid: true,
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        patientName: patient ? `${patient.firstname} ${patient.lastname}` : "Unknown",
        doctorName: doctor
          ? `${doctor.title ? doctor.title + " " : ""}${doctor.firstname} ${doctor.lastname}`
          : "Unknown",
      },
    };
  },
});

// Accept an invitation (called after patient signup/login)
export const acceptInvitation = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const invitation = await ctx.db
      .query("patientInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") throw new Error(`Invitation has been ${invitation.status}`);
    if (invitation.expiresAt < Date.now()) throw new Error("Invitation has expired");

    // Verify the accepting user's email matches the invitation
    if (identity.email && invitation.email.toLowerCase() !== identity.email.toLowerCase()) {
      throw new Error("This invitation was sent to a different email address");
    }

    const now = Date.now();

    // Check if this patient account link already exists
    const existingLink = await ctx.db
      .query("patientAccounts")
      .withIndex("by_authUserId_patientId", (q) =>
        q.eq("authUserId", identity.subject).eq("patientId", invitation.patientId)
      )
      .first();

    if (!existingLink) {
      // Check if this is the first link for this patient (make it primary)
      const existingPatientLinks = await ctx.db
        .query("patientAccounts")
        .withIndex("by_patientId", (q) => q.eq("patientId", invitation.patientId))
        .collect();

      await ctx.db.insert("patientAccounts", {
        authUserId: identity.subject,
        patientId: invitation.patientId,
        relationship: "parent",
        isPrimary: existingPatientLinks.length === 0,
        createdAt: now,
      });
    }

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: now,
      acceptedByAuthUserId: identity.subject,
    });

    return { success: true, patientId: invitation.patientId };
  },
});

// List invitations by doctor
export const listByDoctor = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) return [];

    const invitations = await ctx.db
      .query("patientInvitations")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .collect();

    // Enrich with patient names
    const enriched = await Promise.all(
      invitations.map(async (inv) => {
        const patient = await ctx.db.get(inv.patientId);
        return {
          ...inv,
          patientName: patient ? `${patient.firstname} ${patient.lastname}` : "Unknown",
        };
      })
    );

    return enriched;
  },
});

// List invitations by patient
export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Verify the requesting user is the patient's doctor
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (doctor) {
      const patient = await ctx.db.get(args.patientId);
      if (!patient || patient.doctorId !== doctor._id) return [];
    } else {
      // For portal users, verify via patientAccounts
      const link = await ctx.db
        .query("patientAccounts")
        .withIndex("by_authUserId_patientId", (q) =>
          q.eq("authUserId", identity.subject).eq("patientId", args.patientId)
        )
        .first();
      if (!link) return [];
    }

    const invitations = await ctx.db
      .query("patientInvitations")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    return invitations;
  },
});

// Revoke an invitation
export const revokeInvitation = mutation({
  args: { invitationId: v.id("patientInvitations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    // Verify the doctor owns this invitation
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor || invitation.doctorId !== doctor._id) {
      throw new Error("Not authorized");
    }

    if (invitation.status !== "pending") {
      throw new Error("Can only revoke pending invitations");
    }

    await ctx.db.patch(args.invitationId, { status: "revoked" });
  },
});
