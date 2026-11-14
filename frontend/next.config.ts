import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '');

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
