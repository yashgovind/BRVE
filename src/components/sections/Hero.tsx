"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { heroCopy } from "@/content/hero";
import type { Video } from "@/types/site";
import { HeroPreview } from "@/components/ui/HeroPreview";

const VideoDialog = dynamic(() => import("@/components/ui/VideoDialog"), { ssr: false });

export function Hero({ videos }: { videos: Video[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackCycle, setPlaybackCycle] = useState(0);
  const [auto, setAuto] = useState(false);
  const [backgroundPaused, setBackgroundPaused] = useState(false);
  const root = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const count = videos.length || heroCopy.length;
  const video = videos[index];
  const copy = heroCopy[video?.heroSlide ?? index % heroCopy.length];

  const move = (direction: number) => { setIndex(i => (i + direction + count) % count); setAuto(false); };

  return <section ref={root} className={`hero ${video ? "hero-has-media" : "hero-no-media"}`} id="hero" aria-roledescription="carousel" aria-label="BRVE films">
    <div className="hero-art" aria-hidden="true">{video?.thumbnail ? <Image key={video.thumbnail} src={video.thumbnail} alt="" fill sizes="100vw" priority={index === 0} className="hero-poster" /> : <><span className="hero-diagonal diagonal-one" /><span className="hero-diagonal diagonal-two" /><span className="hero-orbit" /><span className="hero-word display">BRVE</span></>}{video?.previewUrl && <HeroPreview key={video.id} src={video.previewUrl} mobileSrc={video.mobilePreviewUrl} paused={backgroundPaused || playing} loop={!auto} onEnded={() => { if (auto) setIndex(i => (i + 1) % count); }} />}<div className="hero-shade" /></div>
    <div className="hero-topline"><span className="eyebrow">ideas • ai • impact</span>{video?.previewUrl ? <button className="background-toggle eyebrow" aria-label={backgroundPaused ? "Play background video" : "Pause background video"} onClick={() => setBackgroundPaused(p => !p)}>{backgroundPaused ? "▷" : "Ⅱ"}</button> : <span className="eyebrow">BRVE.AI</span>}</div>
    <div className="hero-copy" aria-live={auto ? "off" : "polite"} aria-atomic="true"><AnimatePresence mode="wait" initial={false}><motion.div key={index} initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -12 }} transition={{ duration: reduce ? 0 : .38, ease: [.22, 1, .36, 1] }}><h1>{copy.head}</h1><p className="hero-response display">{copy.fix}</p></motion.div></AnimatePresence></div>
    <div className="hero-bottom"><a className="scroll-cue" href="#capabilities"><span className="scroll-line" aria-hidden="true" />scroll <span aria-hidden="true">↓</span></a><div className="hero-play">{video ? <button className="play-trigger" onClick={() => setPlaying(true)}><span className="play-circle" aria-hidden="true">▸</span><span>tap video to play ▸</span></button> : <span className="preview-label">Film preview · original media not supplied</span>}</div><div className="hero-controls"><button className="round-button" aria-label="Previous slide" onClick={() => move(-1)}>←</button><span className="slide-counter">{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span><button className="round-button" aria-label="Next slide" onClick={() => move(1)}>→</button>{<button className="auto-toggle" aria-label={auto ? "Pause slideshow" : "Start slideshow"} aria-pressed={auto} onClick={() => setAuto(a => !a)}>{auto ? "Ⅱ" : "▷"}</button>}</div></div>
    <div className="hero-track" aria-hidden="true">{Array.from({ length: count }, (_, i) => <span key={i} className={i === index ? "active" : ""} />)}</div>
    {playing && video && <VideoDialog video={video} title={copy.head} replayToken={playbackCycle} onEnded={() => { setIndex(i => (i + 1) % count); setPlaybackCycle(c => c + 1); }} onClose={() => setPlaying(false)} />}
  </section>;
}
