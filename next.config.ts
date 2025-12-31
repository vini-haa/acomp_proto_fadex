import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://192.168.3.28:3000", "http://192.168.3.28", "192.168.3.28"],
};

export default nextConfig;
