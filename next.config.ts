import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache Components temporarily disabled for debugging
  cacheComponents: true,
  experimental: {
    browserDebugInfoInTerminal: true,
    clientSegmentCache: true,
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
      {
        source: "/ingest/flags",
        destination: "https://us.i.posthog.com/flags",
      },
    ];
  },

  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
}

export default nextConfig
