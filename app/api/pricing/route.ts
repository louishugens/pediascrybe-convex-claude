import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

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
    "Cache-Control": "public, max-age=3600", // Cache for 1 hour
  };
}

export async function GET(request: Request) {
  const origin = request.headers.get("Origin");
  
  try {
    const tiers = await fetchQuery(api.stripe.getSubscriptionTiers);
    
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
