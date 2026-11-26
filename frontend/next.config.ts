import type { NextConfig } from 'next'

const apiImageOrigin = new URL(
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api/v1',
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
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
