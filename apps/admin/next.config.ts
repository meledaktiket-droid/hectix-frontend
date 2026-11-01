import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      "dev.hectix.id",
      "organizer.dev.hectix.id",
      "admin.dev.hectix.id",
      "hectix.id",
      "organizer.hectix.id",
      "admin.hectix.id",
    ].map((hostname) => ({ protocol: "https" as const, hostname, pathname: "/uploads/**" })),
  },
  transpilePackages: ["@repo/ui"],
  async rewrites() {
    const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080";
    return {
      beforeFiles: [
        { source: "/api/:path*", destination: `${api}/api/:path*` },
        { source: "/uploads/:path*", destination: `${api}/uploads/:path*` },
      ],
    };
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
