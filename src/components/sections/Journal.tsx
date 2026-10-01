import Image from "next/image";
import source from "@/content/source.json";
import type { BlogPost, SiteSettings } from "@/types/site";
import { JournalRail } from "@/components/ui/JournalRail";

export function Journal({ posts, settings, preview, previewImages = [] }: { posts: BlogPost[]; settings: SiteSettings; preview: boolean; previewImages?: string[] }) {
  const placeholder = preview && posts.length === 0;
  const entries = placeholder ? Array.from({ length: 4 }, (_, i) => ({
    id: `source-${i}`, title: source.Blog[6 + i * 7], excerpt: source.Blog[7 + i * 7],
    labels: [source.Blog[3 + i * 7]], publishedAt: source.Blog[5 + i * 7], coverImage: previewImages[i],
    bloggerUrl: "", readTime: source.Blog[8 + i * 7],
  })) : posts.map(p => ({ ...p, readTime: "" }));
  return <section className="section journal" id="blog"><div className="section-top"><div><span className="eyebrow">from the feed</span><h2 className="section-heading" data-reveal>what we’re saying out loud.</h2></div>{settings.journalUrl ? <a className="journal-all" href={settings.journalUrl} target="_blank" rel="noopener noreferrer">{settings.journalAllPostsLabel || (placeholder ? "all posts on medium ↗" : "↗")}</a> : <span className="journal-all muted" aria-disabled="true">all posts on medium ↗</span>}</div>
    {placeholder && <p className="preview-label journal-preview">Source layout preview · sample articles, not live Blogger posts</p>}
    {entries.length ? <JournalRail count={entries.length}>{entries.map((p, i) => <article key={p.id} className={`journal-card journal-card-${i}`}>
      <div className="journal-media">{p.coverImage ? <Image src={p.coverImage} alt="" fill sizes="(max-width: 640px) 90vw, (max-width: 1000px) 45vw, 30vw" /> : <div className="journal-art" aria-hidden="true"><span className="display">{p.labels[0] || "BRVE"}</span><span className="journal-art-line" /></div>}<span className="journal-meta">{p.labels[0]}<span>—</span>{placeholder ? p.publishedAt : new Date(p.publishedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}</span></div>
      <div className="journal-copy"><h3>{p.title}</h3><p>{p.excerpt}</p>{p.readTime && <span className="eyebrow">{p.readTime}</span>}{p.bloggerUrl ? <a href={p.bloggerUrl} target="_blank" rel="noopener noreferrer" className="journal-link">{settings.journalReadMoreLabel || "↗"}<span className="sr-only">: {p.title}</span></a> : <span className="journal-link" aria-disabled="true">read more on medium →</span>}</div>
    </article>)}</JournalRail> : <p className="body-copy" role="status">Journal posts are currently unavailable.</p>}
  </section>;
}
