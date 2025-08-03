import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Prevent TypeScript errors from failing production build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optionally, also ignore ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Enable fs and path for API routes
  experimental: {
    serverComponentsExternalPackages: ['fs', 'path'],
  },

  // Optional: Enable appDir (if not auto-detected)
  // appDir: true,
}

export default nextConfig