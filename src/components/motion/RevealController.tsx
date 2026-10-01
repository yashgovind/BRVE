"use client";
import { useEffect } from "react";

// Progressive enhancement: server-rendered content is visible even if JS fails.
export function RevealController() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!media.matches) {
          const animation = entry.target.animate([{ opacity: .35, transform: "translateY(22px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        }
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    document.querySelectorAll("[data-reveal]").forEach(el => observer.observe(el));
    const stop = () => { if (media.matches) animations.forEach(a => a.finish()); };
    media.addEventListener("change", stop);
    return () => { observer.disconnect(); animations.forEach(a => a.cancel()); media.removeEventListener("change", stop); };
  }, []);
  return null;
}
