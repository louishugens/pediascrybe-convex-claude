import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { Redis } from "@upstash/redis";
import { api } from "@/convex/_generated/api";

const redis = Redis.fromEnv();
const CACHE_KEY = "pricing:tiers";
const CACHE_TTL = 3600; // 1 hour

// Allowed origins for CORS
const allowedOrigins = [
  "https://pediascrybe.com",
  "https://www.pediascrybe.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

function getCorsHeaders(origin: string | null) {
  const corsOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=3600",
  };
}

export async function GET(request: Request) {
  const origin = request.headers.get("Origin");

  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ tiers: cached }, { headers: getCorsHeaders(origin) });
    }

    const tiers = await fetchQuery(api.stripe.getSubscriptionTiers);
    await redis.setex(CACHE_KEY, CACHE_TTL, tiers);

    return NextResponse.json(
      { tiers },
      { headers: getCorsHeaders(origin) }
    );
  } catch (error) {
    console.error("Failed to fetch pricing tiers:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing data" },
      { status: 500, headers: getCorsHeaders(origin) }
    );
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("Origin");

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}
