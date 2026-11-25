import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  poweredByHeader: false,
  agentRules: false,
  experimental: { maxPostponedStateSize: "10mb" },
};

export default nextConfig;
