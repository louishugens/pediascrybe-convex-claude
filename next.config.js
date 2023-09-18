/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir: true,
    swcPlugins: [["next-superjson-plugin", {}]],
    serverActions: true,
  },
  images: {
    domains: ["uploadthing.com", "utfs.io"],
  },
}

module.exports = nextConfig
