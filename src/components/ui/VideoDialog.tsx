"use client";
import { useEffect, useRef } from "react";
import type { Video } from "@/types/site";

export default function VideoDialog({ video, onClose }: { video: Video; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    el?.showModal(); document.body.style.overflow = "hidden";
    return () => { el?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  const embed = video.provider === "youtube" ? `https://www.youtube-nocookie.com/embed/${video.providerId}?autoplay=1&rel=0` : `https://player.vimeo.com/video/${video.providerId}?autoplay=1`;
  return <dialog ref={dialog} className="video-dialog" aria-labelledby="video-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="video-dialog-top"><h2 id="video-title">{video.title}</h2><button className="round-button" onClick={onClose} aria-label="Close video">×</button></div><div className="video-frame">{video.provider === "hosted" ? <video src={video.videoUrl} poster={video.thumbnail} controls autoPlay playsInline preload="metadata" aria-label={video.title}><track kind="captions" /></video> : <iframe src={embed} title={video.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}</div>{video.description && <p>{video.description}</p>}</dialog>;
}
