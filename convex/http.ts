import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// ==================== LiveKit Webhook ====================

http.route({
  path: "/livekit/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return new Response("Missing authorization", { status: 401 });
    }

    try {
      // Delegate to Node action for verification (livekit-server-sdk needs Node runtime)
      await ctx.runAction(internal.livekit.handleWebhook, {
        body,
        authHeader,
      });
    } catch (err) {
      console.error("LiveKit webhook error:", err);
      return new Response("Webhook processing failed", { status: 400 });
    }

    return new Response("OK", { status: 200 });
  }),
});

// ==================== WhatsApp Webhook (Kapso) ====================

http.route({
  path: "/whatsapp/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    // Kapso uses x-webhook-signature
    const signature = request.headers.get("x-webhook-signature") ||
      request.headers.get("x-hub-signature-256") ||
      request.headers.get("x-hub-signature");

    try {
      await ctx.runAction(internal.whatsapp.handleIncomingWebhook, {
        body,
        signature: signature || undefined,
      });
    } catch (err) {
      console.error("WhatsApp webhook error:", err);
      return new Response("Webhook processing failed", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  }),
});

// WhatsApp webhook verification (GET — required by Meta Cloud API, optional for Kapso)
http.route({
  path: "/whatsapp/webhook",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge || "", { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }),
});

// ==================== Public API Endpoints ====================

// Allowed origins for CORS
const allowedOrigins = [
  "https://pediascrybe.com",
  "https://www.pediascrybe.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

// Helper to get CORS origin
const getCorsOrigin = (request: Request): string => {
  const origin = request.headers.get("Origin") || "";
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
};

// Public API endpoint for pricing tiers (for public marketing site)
http.route({
  path: "/api/pricing",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const tiers = await ctx.runQuery(api.stripe.getSubscriptionTiers);
    return new Response(JSON.stringify({ tiers }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": getCorsOrigin(request),
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  }),
});

// Handle CORS preflight for the pricing endpoint
http.route({
  path: "/api/pricing",
  method: "OPTIONS",
  handler: httpAction(async (ctx, request) => {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": getCorsOrigin(request),
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

authComponent.registerRoutes(http, createAuth);

export default http;