import type { NextConfig } from 'next'
import { withBotId } from 'botid/next/config';
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  // Cache Components temporarily disabled for debugging
  cacheComponents: true,
  experimental: {
    // browserDebugInfoInTerminal: true,
    // clientSegmentCache: true, // this is a new experimental feature that is not yet supported by Next.js
  },
  reactCompiler: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        // UploadThing v7 serves files from <appId>.ufs.sh
        protocol: 'https',
        hostname: '*.ufs.sh',
      },
      // "uploadthing.com", "utfs.io"
    ],
  },
  // PostHog rewrites
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },

  async headers() {
    return [
      {
        // Global security headers
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        source: "/ingest/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://app.pediascrybe.com" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },

  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  // Required for @serwist/turbopack service worker bundling
  serverExternalPackages: ["esbuild", "esbuild-wasm"],
}

// DEV_LITE=1 skips the (beta) Vercel Workflow plugin — used by the `dev:web`
// script for a minimal, low-process frontend dev server while testing.
export default process.env.DEV_LITE
  ? withBotId(nextConfig)
  : withWorkflow(withBotId(nextConfig))
