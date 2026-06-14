import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,

  async headers() {
    return [
      {
        source: "/:path*.(ico|svg|png|jpg|jpeg|webp|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "sonner"],
  },

  logging: {
    fetches: { fullUrl: true },
  },
};

export default nextConfig;
