import "server-only";
import { unstable_cache } from "next/cache";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { adminDb, hasAdminCredentials } from "./admin";
import { canUseImage, isPublicHttpsUrl, settingsSchema, videoSchema } from "@/lib/validation";
import type { BlogPost, SiteSettings, Video } from "@/types/site";

function timestamp(value: unknown): string | undefined {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate().toISOString();
}
export function publicVideo(id: string, data: Record<string, unknown>): Video | null {
  const fields = Object.fromEntries(Object.entries(data).filter(([key]) => key !== "updatedAt"));
  const parsed = videoSchema.safeParse({ ...fields, id, publishedAt: timestamp(data.publishedAt) });
  if (!parsed.success || !canUseImage(parsed.data.thumbnail)) return null;
  return parsed.data;
}
const readVideos = unstable_cache(async () => {
  const snapshot = await adminDb().collection("videos").where("active", "==", true).orderBy("order").limit(24).get();
  return snapshot.docs.map(doc => publicVideo(doc.id, doc.data())).filter((v): v is Video => Boolean(v));
}, ["brve-videos"], { revalidate: 300, tags: ["videos"] });

const readPosts = unstable_cache(async () => {
  const snapshot = await adminDb().collection("blogPosts").where("active", "==", true).orderBy("publishedAt", "desc").limit(8).get();
  return snapshot.docs.flatMap(doc => {
    const d = doc.data(); const publishedAt = timestamp(d.publishedAt);
    if (typeof d.title !== "string" || !publishedAt || !isPublicHttpsUrl(d.bloggerUrl) || d.sourceRemoved) return [];
    const post: BlogPost = { id: doc.id, bloggerPostId: String(d.bloggerPostId), title: d.title, excerpt: typeof d.excerpt === "string" ? d.excerpt : "", coverImage: canUseImage(d.coverImage) ? d.coverImage : undefined, bloggerUrl: d.bloggerUrl, labels: Array.isArray(d.labels) ? d.labels.filter((l: unknown) => typeof l === "string") : [], author: typeof d.author === "string" ? d.author : undefined, publishedAt, featured: d.featured === true, order: Number.isFinite(d.order) ? d.order : 0, active: true };
    return [post];
  }).sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order).slice(0, 4);
}, ["brve-posts"], { revalidate: 300, tags: ["blogPosts"] });

const readSettings = unstable_cache(async (): Promise<SiteSettings> => {
  const doc = await adminDb().collection("siteSettings").doc("general").get();
  const data = doc.data() || {};
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(settingsSchema.shape)) if (key in data) result[key] = data[key];
  const parsed = settingsSchema.safeParse(result);
  return parsed.success ? parsed.data : {};
}, ["brve-settings"], { revalidate: 300, tags: ["siteSettings"] });

export async function getSiteData() {
  const preview = process.env.LOCAL_CONTENT_PREVIEW === "true" && process.env.VERCEL_ENV !== "production";
  let videos: Video[] = []; let posts: BlogPost[] = []; let settings: SiteSettings = {};
  if (hasAdminCredentials()) {
    const results = await Promise.allSettled([readVideos(), readPosts(), readSettings()]);
    if (results[0].status === "fulfilled") videos = results[0].value;
    if (results[1].status === "fulfilled") posts = results[1].value;
    if (results[2].status === "fulfilled") settings = results[2].value;
    results.forEach((r, i) => { if (r.status === "rejected") console.error(`BRVE public data source ${i} unavailable`); });
  }
  if (preview && !videos.length) {
    try { const raw = JSON.parse(await readFile(join(process.cwd(), "src/content/preview-videos.json"), "utf8")); videos = raw.map((v: Video) => videoSchema.parse(v)); }
    catch { console.error("Local media manifest unavailable"); }
  }
  return { videos, posts, settings, preview };
}
