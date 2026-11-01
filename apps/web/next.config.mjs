/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      "dev.hectix.id",
      "organizer.dev.hectix.id",
      "admin.dev.hectix.id",
      "hectix.id",
      "organizer.hectix.id",
      "admin.hectix.id",
    ].map((hostname) => ({ protocol: "https", hostname, pathname: "/uploads/**" })),
  },
  async rewrites() {
    const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080";
    return {
      beforeFiles: [
        { source: "/api/:path*", destination: `${api}/api/:path*` },
        { source: "/uploads/:path*", destination: `${api}/uploads/:path*` },
      ],
    };
  },
}

export default nextConfig
