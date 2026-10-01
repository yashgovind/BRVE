import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: "https://brveai.com", changeFrequency: "weekly", priority: 1 }]; }
