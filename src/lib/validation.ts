import { z } from "zod";

export function isPublicHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password && !host.includes(":") && !/^\d+(\.\d+){3}$/.test(host) && host.includes(".") && !host.endsWith(".local") && !host.endsWith(".internal") && !host.endsWith(".localhost");
  } catch { return false; }
}
export const httpsUrl = z.string().max(2048).refine(isPublicHttpsUrl, "Use a public HTTPS URL.");
const mediaUrl = z.string().max(2048).refine(value => isPublicHttpsUrl(value) || /^\/media\/[a-z0-9-]+\.(mp4|webp|jpg|png)$/.test(value), "Use an HTTPS URL or a prepared /media/ asset.");
const optionalUrl = z.union([httpsUrl, z.literal("")]).optional();
const optionalMedia = z.union([mediaUrl, z.literal("")]).optional();

export const videoSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1200).optional(),
  thumbnail: mediaUrl,
  provider: z.enum(["youtube", "vimeo", "hosted"]),
  videoUrl: mediaUrl,
  providerId: z.string().max(100).optional(),
  previewUrl: optionalMedia,
  mobilePreviewUrl: optionalMedia,
  duration: z.string().max(40).optional(),
  featured: z.boolean(), order: z.number().int().min(0).max(10000), active: z.boolean(),
  heroSlide: z.number().int().min(0).max(6).optional(),
  publishedAt: z.iso.datetime().optional(),
}).strict().superRefine((video, context) => {
  if (video.provider === "youtube" && !/^[\w-]{11}$/.test(video.providerId || "")) context.addIssue({ code: "custom", path: ["providerId"], message: "Enter the 11-character YouTube video ID." });
  if (video.provider === "vimeo" && !/^\d{1,15}$/.test(video.providerId || "")) context.addIssue({ code: "custom", path: ["providerId"], message: "Enter a numeric Vimeo video ID." });
  if (video.provider !== "hosted" && video.videoUrl.startsWith("/")) context.addIssue({ code: "custom", path: ["videoUrl"], message: "YouTube and Vimeo require an HTTPS video URL." });
});

export const settingsSchema = z.object({
  contactFormUrl: optionalUrl, instagramUrl: optionalUrl, linkedinUrl: optionalUrl,
  youtubeUrl: optionalUrl, journalUrl: optionalUrl,
}).strict();

export function canUseImage(url?: string) {
  if (!url) return false;
  if (/^\/media\/[a-z0-9-]+\.(webp|jpg|png)$/.test(url)) return true;
  if (!isPublicHttpsUrl(url)) return false;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (storageBucket && new URL(url).hostname === "firebasestorage.googleapis.com") {
    return new URL(url).pathname.startsWith(`/v0/b/${storageBucket}/o/`);
  }
  const hosts = (process.env.MEDIA_IMAGE_HOSTS || "blogger.googleusercontent.com,images.unsplash.com,i.ytimg.com,i.vimeocdn.com").split(",").map(h => h.trim());
  return hosts.includes(new URL(url).hostname);
}
