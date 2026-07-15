import type { NextConfig } from "next";

const apiTarget =
  process.env.NEXT_PUBLIC_API_TARGET ??
  "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/incidents",
        destination: `${apiTarget}/incidents`,
      },
      {
        source: "/categories",
        destination: `${apiTarget}/categories`,
      },
      {
        source: "/health",
        destination: `${apiTarget}/health`,
      },

      // NEW
      {
        source: "/neighborhoods",
        destination: `${apiTarget}/neighborhoods`,
      },
      {
        source: "/lens/:path*",
        destination: `${apiTarget}/lens/:path*`,
      },
    ];
  },
};

export default nextConfig;