import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: process.env.PLAYWRIGHT_TEST === "true" ? false : undefined,
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
