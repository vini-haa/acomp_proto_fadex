import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://192.168.3.28:3000", "http://192.168.3.28", "192.168.3.28"],
};

export default withBundleAnalyzer(nextConfig);
