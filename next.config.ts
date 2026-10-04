import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  experimental: {
    globalNotFound: true,
  },
  serverExternalPackages: ["sharp", "music-metadata"],
};

export default nextConfig;
