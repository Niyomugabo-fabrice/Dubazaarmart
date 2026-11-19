import type { NextConfig } from 'next'

const apiImageOrigin = new URL(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
)

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: apiImageOrigin.protocol === 'https:' ? 'https' : 'http',
        hostname: apiImageOrigin.hostname,
        ...(apiImageOrigin.port ? { port: apiImageOrigin.port } : {}),
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
