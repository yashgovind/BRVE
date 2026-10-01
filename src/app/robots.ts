import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: process.env.LOCAL_CONTENT_PREVIEW === "true" ? ["/"] : ["/admin", "/api/"] }, sitemap: "https://brveai.com/sitemap.xml" };
}
