import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/images/logo.png" },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sharjeelanjum.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
