import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "BRVE — Advertising + Technology", short_name: "BRVE", start_url: "/", display: "browser", background_color: "#0a0a0b", theme_color: "#0a0a0b", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
