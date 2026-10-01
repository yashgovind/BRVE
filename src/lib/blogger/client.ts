import "server-only";
import type { BloggerPost } from "./normalize";

export async function fetchAllBloggerPosts(): Promise<BloggerPost[]> {
  const id = process.env.BLOGGER_BLOG_ID;
  const key = process.env.BLOGGER_API_KEY;
  if (!id || !/^\d+$/.test(id) || !key) throw new Error("Set BLOGGER_BLOG_ID and BLOGGER_API_KEY first.");
  const posts: BloggerPost[] = []; const seenPages = new Set<string>();
  let nextPageToken: string | undefined;
  const timeout = AbortSignal.timeout(45000);
  for (let page = 0; page < 100; page++) {
    const url = new URL(`https://www.googleapis.com/blogger/v3/blogs/${id}/posts`);
    url.search = new URLSearchParams({ key, maxResults: "100", fetchBodies: "true", fetchImages: "true", status: "live", orderBy: "published", ...(nextPageToken ? { pageToken: nextPageToken } : {}) }).toString();
    const response = await fetch(url, { cache: "no-store", signal: timeout });
    if (!response.ok) throw new Error(`Blogger fetch failed (${response.status}); no posts were changed.`);
    const result = await response.json();
    if (!result || result.kind !== "blogger#postList" || (result.items !== undefined && !Array.isArray(result.items))) throw new Error("Invalid Blogger response; synchronization aborted.");
    posts.push(...(result.items || []));
    nextPageToken = result.nextPageToken;
    if (!nextPageToken) return posts;
    if (typeof nextPageToken !== "string" || seenPages.has(nextPageToken)) throw new Error("Invalid Blogger pagination; synchronization aborted.");
    seenPages.add(nextPageToken);
  }
  throw new Error("Blogger scan exceeded its safety limit; synchronization aborted.");
}
