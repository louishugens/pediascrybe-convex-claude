import { handler } from "@/lib/auth-server";
import { checkBotId } from "botid/server";
import { NextRequest } from "next/server";

export const { GET } = handler;

// Wrap POST with BotID protection to prevent bot signups/signins
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only check BotID for signup and signin endpoints
  if (path.includes("sign-up") || path.includes("sign-in")) {
    const verification = await checkBotId();
    if (verification.isBot) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Call the original handler
  return handler.POST(request);
}