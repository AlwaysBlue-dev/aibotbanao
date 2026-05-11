import type { NextConfig } from "next";

// Applied to every route except /chat/* and /embed.js
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

// /chat/* pages must be embeddable in external iframes — no frame restriction
const chatHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Allow any origin to embed this page in an iframe
  { key: "Content-Security-Policy", value: "frame-ancestors *" },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  allowedDevOrigins: ["192.168.18.12"],

  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      // Chat pages — embeddable by external sites
      {
        source: "/chat/:slug*",
        headers: chatHeaders,
      },
      // Everything else — deny framing
      {
        source: "/((?!chat/).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
