"use client";
import { useEffect, useRef, useState } from "react";

export function HeroPreview({ src, mobileSrc, paused, loop, onEnded }: { src: string; mobileSrc?: string; paused: boolean; loop: boolean; onEnded: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (motion.matches || connection?.saveData) return;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.src = window.matchMedia("(max-width: 640px)").matches && mobileSrc ? mobileSrc : src;
    let visible = true;
    const update = () => {
      if (visible && !paused && !motion.matches && document.visibilityState === "visible") void video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .05 });
    observer.observe(video);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); motion.removeEventListener("change", update); video.pause(); video.removeAttribute("src"); video.load(); };
  }, [src, mobileSrc, paused]);
  return <video ref={ref} className={`hero-background-video ${ready ? "ready" : ""}`} muted playsInline loop={loop} preload="none" aria-hidden="true" onPlaying={() => setReady(true)} onEnded={onEnded} />;
}
