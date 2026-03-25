import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ==================== Queries ====================

/**
 * Get the current doctor's WhatsApp link status.
 * Used by the settings page to show linked/unlinked/pending.
 */
export const getLinkStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) return null;

    const link = await ctx.db
      .query("whatsappLinks")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    if (!link) return { status: "unlinked" as const };

    if (link.status === "active") {
      return {
        status: "active" as const,
        phoneNumber: link.phoneNumber,
        linkedAt: link.linkedAt,
      };
    }

    if (link.status === "pending") {
      const isExpired = Date.now() > link.linkTokenExpiresAt;
      if (isExpired) {
        return { status: "unlinked" as const };
      }
      return {
        status: "pending" as const,
        linkToken: link.linkToken,
        expiresAt: link.linkTokenExpiresAt,
      };
    }

    return { status: "unlinked" as const };
  },
});

// ==================== Mutations ====================

/**
 * Generate a new QR linking token.
 * Called when doctor clicks "Link WhatsApp" in settings.
 */
export const generateLinkToken = mutation({
  args: {},
  handler: async (ctx): Promise<{ token: string; expiresAt: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) throw new Error("Doctor profile not found");

    // Check if already has an active link
    const existingActive = await ctx.db
      .query("whatsappLinks")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existingActive) {
      throw new Error("WhatsApp is already linked. Unlink first to re-link.");
    }

    // Revoke any existing pending tokens
    const pendingLinks = await ctx.db
      .query("whatsappLinks")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const link of pendingLinks) {
      await ctx.db.patch(link._id, { status: "revoked" });
    }

    // Generate a cryptographically random token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    await ctx.db.insert("whatsappLinks", {
      doctorId: doctor._id,
      status: "pending",
      linkToken: token,
      linkTokenExpiresAt: expiresAt,
      createdAt: now,
    });

    return { token, expiresAt };
  },
});

/**
 * Revoke the doctor's WhatsApp link.
 * Called when doctor clicks "Unlink" in settings.
 */
export const unlinkWhatsApp = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) throw new Error("Doctor profile not found");

    const activeLink = await ctx.db
      .query("whatsappLinks")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (activeLink) {
      await ctx.db.patch(activeLink._id, { status: "revoked" });
    }
  },
});

// ==================== Internal Functions ====================

/**
 * Match a link token from incoming WhatsApp message.
 * Called by the webhook handler when a LINK_ prefixed message arrives.
 */
export const matchLinkToken = internalMutation({
  args: {
    token: v.string(),
    phoneNumber: v.string(),
    whatsappId: v.string(),
  },
  handler: async (ctx, args): Promise<{ matched: boolean; doctorId?: string }> => {
    const link = await ctx.db
      .query("whatsappLinks")
      .withIndex("by_linkToken", (q) => q.eq("linkToken", args.token))
      .first();

    if (!link) return { matched: false };
    if (link.status !== "pending") return { matched: false };
    if (Date.now() > link.linkTokenExpiresAt) return { matched: false };

    // Check if this phone number is already linked to another doctor
    const existingLink = await ctx.db
      .query("whatsappLinks")
      .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existingLink) {
      // Revoke the old link first
      await ctx.db.patch(existingLink._id, { status: "revoked" });
    }

    // Activate the link
    await ctx.db.patch(link._id, {
      status: "active",
      phoneNumber: args.phoneNumber,
      whatsappId: args.whatsappId,
      linkedAt: Date.now(),
    });

    return { matched: true, doctorId: link.doctorId };
  },
});

/**
 * Look up a doctor by WhatsApp phone number or whatsappId.
 * Used by the webhook handler to authenticate incoming messages.
 */
export const getDoctorByWhatsApp = internalQuery({
  args: {
    phoneNumber: v.optional(v.string()),
    whatsappId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try whatsappId first (more reliable)
    // Must collect all matches since revoked records may come before active ones
    if (args.whatsappId) {
      const links = await ctx.db
        .query("whatsappLinks")
        .withIndex("by_whatsappId", (q) => q.eq("whatsappId", args.whatsappId))
        .collect();

      const activeLink = links.find((l) => l.status === "active");
      if (activeLink) {
        return { doctorId: activeLink.doctorId, phoneNumber: activeLink.phoneNumber };
      }
    }

    // Fallback to phone number
    if (args.phoneNumber) {
      const links = await ctx.db
        .query("whatsappLinks")
        .withIndex("by_phoneNumber", (q) => q.eq("phoneNumber", args.phoneNumber))
        .collect();

      const activeLink = links.find((l) => l.status === "active");
      if (activeLink) {
        return { doctorId: activeLink.doctorId, phoneNumber: activeLink.phoneNumber };
      }
    }

    return null;
  },
});

/**
 * Get all active WhatsApp links (for cron jobs like daily summary).
 */
export const getAllActiveLinks = internalQuery({
  args: {},
  handler: async (ctx) => {
    const links = await ctx.db
      .query("whatsappLinks")
      .collect();

    return links
      .filter((l) => l.status === "active" && l.phoneNumber)
      .map((l) => ({
        doctorId: l.doctorId,
        phoneNumber: l.phoneNumber!,
      }));
  },
});

/**
 * Check if a message has already been processed (deduplication).
 */
export const isMessageProcessed = internalQuery({
  args: { whatsappMessageId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("whatsappMessages")
      .withIndex("by_whatsappMessageId", (q) =>
        q.eq("whatsappMessageId", args.whatsappMessageId)
      )
      .first();
    return !!existing;
  },
});
