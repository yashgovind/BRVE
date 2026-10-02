"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { BlogPost } from "@/types/site";

type Props = { posts: BlogPost[]; bloggerUrl: string; allPostsLabel: string; readMoreLabel: string };

export function JournalStory({ posts, bloggerUrl, allPostsLabel, readMoreLabel }: Props) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const syncActive = useCallback(() => {
    const element = rail.current;
    if (!element) return;
    const railRect = element.getBoundingClientRect();
    const railCenter = railRect.left + railRect.width / 2;
    const cards = Array.from(element.children) as HTMLElement[];
    let index = 0;
    let distance = Number.POSITIVE_INFINITY;
    cards.forEach((card, i) => {
      const nextRect = card.getBoundingClientRect();
      const nextDistance = Math.abs(nextRect.left + nextRect.width / 2 - railCenter);
      if (nextDistance < distance) { distance = nextDistance; index = i; }
    });
    setActive(Math.min(index, Math.max(0, posts.length - 1)));
  }, [posts.length]);

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncActive);
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); element.removeEventListener("scroll", onScroll); };
  }, [syncActive]);

  const go = (index: number) => {
    const element = rail.current;
    const card = element?.children[index] as HTMLElement | undefined;
    if (!element || !card) return;
    const first = element.children[0] as HTMLElement | undefined;
    const target = card.offsetLeft - (first?.offsetLeft ?? 0) - (element.clientWidth - card.clientWidth) / 2;
    const left = Math.max(0, Math.min(element.scrollWidth - element.clientWidth, target));
    element.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") { event.preventDefault(); go(Math.min(posts.length - 1, active + 1)); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); go(Math.max(0, active - 1)); }
    else if (event.key === "Home") { event.preventDefault(); go(0); }
    else if (event.key === "End") { event.preventDefault(); go(posts.length - 1); }
  };

  return <section className="journal-story" id="blog" aria-labelledby="journal-heading">
    <div className="journal-stage">
      <div className="journal-stage-top">
        <div><span className="eyebrow">from the feed</span><h2 className="section-heading" id="journal-heading">what we’re saying out loud.</h2></div>
        <a className="journal-all" href={bloggerUrl} target="_blank" rel="noopener noreferrer">{allPostsLabel}</a>
      </div>
      {posts.length ? <>
        <div className="journal-viewport">
          <div ref={rail} className="journal-rail" tabIndex={0} aria-label="Blogger articles; scroll horizontally or use the article controls" onKeyDown={handleKeyDown}>
            {posts.map((post, index) => <article key={post.id} className={`journal-card journal-slide${index === active ? " is-active" : ""}`}>
              <div className="journal-media">
                {post.coverImage
                  ? <Image src={post.coverImage} alt="" fill sizes="(max-width: 1023px) 88vw, 58vw" loading="lazy" />
                  : <div className={`journal-art journal-art-${index % 3}`} aria-hidden="true"><span className="journal-art-word">{post.labels[0] || "BRVE"}</span><span className="journal-art-line" /></div>}
                <span className="journal-meta">{post.labels[0] || "BRVE.AI"}<span aria-hidden="true">—</span>{new Date(post.publishedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}</span>
              </div>
              <div className="journal-copy">
                <span className="eyebrow">{String(index + 1).padStart(2, "0")} / {String(posts.length).padStart(2, "0")}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <a href={post.bloggerUrl} target="_blank" rel="noopener noreferrer" className="journal-link">{readMoreLabel}<span className="sr-only">: {post.title}</span></a>
              </div>
            </article>)}
          </div>
          <div className="journal-navigation" aria-label="Article carousel controls">
            <span className="eyebrow" aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(posts.length).padStart(2, "0")}</span>
            <div className="journal-rule" aria-hidden="true"><span style={{ transform: `translateX(${active * 100}%)`, width: `${100 / posts.length}%` }} /></div>
            <button className="round-button" aria-label="Previous article" onClick={() => go(Math.max(0, active - 1))} disabled={active === 0}>←</button>
            <button className="round-button" aria-label="Next article" onClick={() => go(Math.min(posts.length - 1, active + 1))} disabled={active >= posts.length - 1}>→</button>
          </div>
        </div>
      </> : <p className="body-copy" role="status">No published posts on Blogger yet.</p>}
    </div>
  </section>;
}
