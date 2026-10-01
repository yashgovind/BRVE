"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Video } from "@/types/site";
import { heroCopy } from "@/content/hero";

const FilmSpace = dynamic(() => import("@/components/three/FilmSpace"), { ssr: false });
const VideoDialog = dynamic(() => import("@/components/ui/VideoDialog"), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function FilmGallery({ videos }: { videos: Video[] }) {
  const section = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sceneEnabled, setSceneEnabled] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [playing, setPlaying] = useState<Video | null>(null);
  const scrollToIndex = useRef<((index: number) => void) | null>(null);
  const onReady = useCallback(() => setSceneReady(true), []);
  const onError = useCallback(() => { setSceneReady(false); setSceneEnabled(false); }, []);

  useEffect(() => {
    const root = section.current;
    if (!root || !videos.length) return;
    const media = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    let dispose: (() => void) | undefined;
    let cancelled = false;
    const initialize = async () => {
      if (!media.matches) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        const trigger = ScrollTrigger.create({ trigger: root, start: "top 74px", end: () => `+=${Math.max(1200, videos.length * 260)}`, pin: ".film-stage", pinSpacing: true, scrub: .8, invalidateOnRefresh: true, onUpdate: self => { setProgress(self.progress); setIndex(Math.round(self.progress * (videos.length - 1))); } });
        scrollToIndex.current = i => window.scrollTo({ top: trigger.start + i / Math.max(1, videos.length - 1) * (trigger.end - trigger.start), behavior: "smooth" });
      }, root);
      dispose = () => { context.revert(); scrollToIndex.current = null; };
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      if (gl) { gl.getExtension("WEBGL_lose_context")?.loseContext(); setSceneEnabled(true); }
    };
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { observer.disconnect(); void initialize(); } }, { rootMargin: "-5% 0px" });
    observer.observe(root);
    const update = () => { dispose?.(); dispose = undefined; setSceneEnabled(false); setSceneReady(false); if (media.matches) void initialize(); };
    media.addEventListener("change", update);
    return () => { cancelled = true; observer.disconnect(); media.removeEventListener("change", update); dispose?.(); document.body.style.cursor = ""; };
  }, [videos]);

  if (!videos.length) return null;
  const select = (i: number) => { setIndex(i); setProgress(i / Math.max(1, videos.length - 1)); scrollToIndex.current?.(i); };
  const selected = videos[index] || videos[0];
  return <section ref={section} id="videos" className="film-gallery" aria-labelledby="film-heading"><div className="film-stage"><div className="film-heading"><span className="eyebrow">ideas • ai • impact</span><h2 id="film-heading">We make that trailer.</h2><span className="section-index">{String(index + 1).padStart(2, "0")} / {String(videos.length).padStart(2, "0")}</span></div><div className={`film-space ${sceneReady ? "has-scene" : ""}`}>
    <button className="film-fallback" onClick={() => setPlaying(selected)} aria-label={`Play ${selected.title}`}><Image src={selected.thumbnail} alt="" fill sizes="(max-width: 1023px) 92vw, 70vw" /><span className="film-play" aria-hidden="true">↗</span></button>
    {sceneEnabled && <div className="film-canvas" aria-hidden="true"><SceneBoundary onError={onError}><FilmSpace images={videos.map(v => v.thumbnail)} progress={progress} onSelect={i => setPlaying(videos[i])} onReady={onReady} /></SceneBoundary></div>}
    </div><div className="film-caption"><p className="display">{heroCopy[selected.heroSlide ?? index % heroCopy.length].head}</p><button className="film-watch" onClick={() => setPlaying(selected)}>tap video to play ▸</button></div><div className="film-pagination"><button className="round-button" aria-label="Previous film" disabled={index === 0} onClick={() => select(index - 1)}>←</button><div className="film-dots" aria-label="Select film">{videos.map((v, i) => <button key={v.id} aria-label={`Film ${i + 1}: ${heroCopy[v.heroSlide ?? i % 7].head}`} aria-pressed={index === i} onClick={() => select(i)}><span /></button>)}</div><button className="round-button" aria-label="Next film" disabled={index === videos.length - 1} onClick={() => select(index + 1)}>→</button></div></div>{playing && <VideoDialog video={playing} title={heroCopy[playing.heroSlide ?? index % heroCopy.length].head} onEnded={() => { const next = (videos.findIndex(v => v.id === playing.id) + 1) % videos.length; setIndex(next); setProgress(next / Math.max(1, videos.length - 1)); setPlaying(videos[next]); }} onClose={() => setPlaying(null)} />}</section>;
}
