import * as cheerio from "cheerio";
import { isPublicHttpsUrl } from "@/lib/validation";

export type BloggerPost = { id: string; title: string; content?: string; url: string; published: string; updated?: string; author?: { displayName?: string }; labels?: string[]; images?: { url: string }[] };

export function normalizePost(post: BloggerPost) {
  if (!/^\d+$/.test(post.id) || !post.title || !isPublicHttpsUrl(post.url) || Number.isNaN(Date.parse(post.published))) throw new Error("Blogger returned an invalid post.");
  const $ = cheerio.load(post.content || "");
  $("script,style,iframe,noscript").remove();
  $("p,div,br,li,h1,h2,h3,h4").append(" ");
  const text = $.root().text().replace(/\s+/g, " ").trim();
  const image = post.images?.[0]?.url || $("img").first().attr("src");
  const title = cheerio.load(post.title).text();
  return {
    bloggerPostId: post.id, title,
    excerpt: text.length > 210 ? text.slice(0, 210).replace(/\s+\S*$/, "") + "…" : text,
    ...(image && isPublicHttpsUrl(image) ? { coverImage: image } : {}),
    ...(post.author?.displayName ? { author: post.author.displayName } : {}),
    bloggerUrl: post.url, publishedAt: new Date(post.published).toISOString(),
    ...(post.updated && !Number.isNaN(Date.parse(post.updated)) ? { updatedAt: new Date(post.updated).toISOString() } : {}),
    labels: (post.labels || []).filter(l => typeof l === "string").slice(0, 20),
  };
}

export function syncEditorial(existing?: { featured?: boolean; order?: number; active?: boolean }) {
  return { featured: existing?.featured === true, order: Number.isFinite(existing?.order) ? existing!.order! : 0, active: existing?.active ?? true };
}
