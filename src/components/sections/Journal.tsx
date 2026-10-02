import type { BlogPost, SiteSettings } from "@/types/site";
import { JournalStory } from "@/components/sections/JournalStory";

export function Journal({ posts, settings }: { posts: BlogPost[]; settings: SiteSettings }) {
  const bloggerUrl = settings.journalUrl || "https://2brveai.blogspot.com/";
  return <JournalStory posts={posts} bloggerUrl={bloggerUrl} allPostsLabel="all posts on Blogger ↗" readMoreLabel="read more on Blogger →" />;
}
