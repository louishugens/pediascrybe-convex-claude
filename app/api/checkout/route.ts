// checkout/route.ts
// TODO: Fix @polar-sh/nextjs compatibility with Next.js 16
// Temporarily commented out due to peer dependency conflicts
// import { Checkout } from "@polar-sh/nextjs";

// export const GET = Checkout({
//   accessToken: process.env.POLAR_ACCESS_TOKEN,
//   successUrl: process.env.POLAR_SUCCESS_URL,
//   server: "sandbox", // Use sandbox if you're testing Polar - omit the parameter or pass 'production' otherwise
// });

// Temporary placeholder until @polar-sh/nextjs is updated for Next.js 16
export const GET = async () => {
  return new Response("Checkout endpoint temporarily disabled - updating for Next.js 16 compatibility", { status: 503 });
};