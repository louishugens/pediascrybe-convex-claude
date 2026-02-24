import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const redis = Redis.fromEnv();

/**
 * Rate limiters for different endpoint categories.
 * Uses sliding window algorithm for smooth rate limiting.
 */

// Authenticated AI routes: 30 requests per minute per user
export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "rl:ai",
});

// Auth routes (login, signup): 10 requests per minute per IP
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:auth",
});

// Email routes: 5 requests per minute per user
export const emailRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "rl:email",
});

// General API routes: 60 requests per minute per user
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "rl:api",
});

// Public routes (contact form): 3 requests per minute per IP
export const publicRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  prefix: "rl:public",
});

/**
 * Get client IP from request headers.
 */
export async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limit and return 429 response if exceeded.
 * Returns null if within limits.
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<Response | null> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}
