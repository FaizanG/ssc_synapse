import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async rewrites() {
    const apiHost = process.env.API_INTERNAL_HOST ?? "localhost";
    const apiPort = process.env.API_INTERNAL_PORT ?? "4000";

    return [
      {
        source: "/api/:path*",
        destination: `http://${apiHost}:${apiPort}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
