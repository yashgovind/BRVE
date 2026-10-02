import type { NextConfig } from "next";

const mediaHosts = (process.env.MEDIA_IMAGE_HOSTS || "blogger.googleusercontent.com,images.unsplash.com,i.ytimg.com,i.vimeocdn.com")
  .split(",").map((host) => host.trim()).filter(Boolean);
if (!mediaHosts.includes("firebasestorage.googleapis.com")) mediaHosts.push("firebasestorage.googleapis.com");

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: mediaHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
export default config;
