/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    browserDebugInfoInTerminal: true,
  },
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
}

module.exports = nextConfig
