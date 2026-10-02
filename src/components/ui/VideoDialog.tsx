"use client";
import { useEffect, useRef } from "react";
import type { Video } from "@/types/site";

export default function VideoDialog({ video, title, onClose, onEnded, replayToken = 0 }: { video: Video; title?: string; onClose: () => void; onEnded?: () => void; replayToken?: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const onEndedRef = useRef(onEnded);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => {
    const el = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    el?.showModal(); document.body.style.overflow = "hidden";
    return () => { el?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const displayTitle = title || video.title;
  const embed = video.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${video.providerId}?autoplay=1&mute=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`
    : `https://player.vimeo.com/video/${video.providerId}?autoplay=1&muted=1&api=1&player_id=brve-film-player`;
  useEffect(() => {
    if (video.provider === "hosted") return;
    const el = frame.current;
    if (!el) return;
    const playerOrigin = video.provider === "youtube" ? "https://www.youtube-nocookie.com" : "https://player.vimeo.com";
    const sendListener = () => el.contentWindow?.postMessage(
      video.provider === "youtube"
        ? JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] })
        : JSON.stringify({ method: "addEventListener", value: "ended" }),
      playerOrigin,
    );
    const receive = (event: MessageEvent) => {
      if (event.source !== el.contentWindow || event.origin !== playerOrigin) return;
      let data = event.data;
      if (typeof data === "string") { try { data = JSON.parse(data); } catch { return; } }
      if (video.provider === "youtube" && ((data?.event === "onStateChange" && data?.info === 0) || (data?.event === "infoDelivery" && data?.info?.playerState === 0))) onEndedRef.current?.();
      if (video.provider === "vimeo" && data?.event === "ended") onEndedRef.current?.();
    };
    el.addEventListener("load", sendListener);
    window.addEventListener("message", receive);
    return () => { el.removeEventListener("load", sendListener); window.removeEventListener("message", receive); };
  }, [video.id, video.provider]);
  return <dialog ref={dialog} className="video-dialog" aria-labelledby="video-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="video-dialog-top"><h2 id="video-title">{displayTitle}</h2><button className="round-button" onClick={onClose} aria-label="Close video">×</button></div><div className="video-frame">{video.provider === "hosted" ? <video key={`${video.id}-${replayToken}`} src={video.videoUrl} poster={video.thumbnail} controls autoPlay muted playsInline preload="metadata" aria-label={displayTitle} onEnded={onEnded}><track kind="captions" /></video> : <iframe key={video.id} ref={frame} src={embed} title={displayTitle} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}</div>{video.description && <p>{video.description}</p>}</dialog>;
}
