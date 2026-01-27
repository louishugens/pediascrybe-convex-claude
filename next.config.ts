import type { NextConfig } from 'next'
import { withBotId } from 'botid/next/config';

const nextConfig: NextConfig = {
  // Cache Components temporarily disabled for debugging
  cacheComponents: true,
  experimental: {
    browserDebugInfoInTerminal: true,
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
        source: "/ingest/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },

  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
}

export default withBotId(nextConfig)
