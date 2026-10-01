"use client";
import { useEffect } from "react";

export function ScrollExperience() {
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(min-width: 821px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.to(".hero-art", { yPercent: 22, scale: 1.12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".hero-copy", { y: -70, opacity: .15, ease: "none", scrollTrigger: { trigger: ".hero", start: "45% top", end: "bottom top", scrub: true } });
        gsap.fromTo(".panic-media", { scale: 1.35, clipPath: "inset(15% 18% 15% 18%)" }, { scale: 1, clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".panic", start: "top 90%", end: "center center", scrub: 1 } });
        gsap.fromTo(".panic h2", { y: 80 }, { y: -35, ease: "none", scrollTrigger: { trigger: ".panic", start: "top bottom", end: "bottom top", scrub: 1 } });
        gsap.fromTo(".word-beat>.display", { xPercent: 12, rotateY: -20 }, { xPercent: -12, rotateY: 20, ease: "none", scrollTrigger: { trigger: ".word-beat", start: "top bottom", end: "bottom top", scrub: .8 } });
        gsap.fromTo(".word-strike", { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", ease: "power2.out", scrollTrigger: { trigger: ".word-beat", start: "top 70%", end: "center center", scrub: .5 } });
        gsap.utils.toArray<HTMLElement>(".services li").forEach((row, i) => {
          gsap.fromTo(row.querySelector(".display"), { x: i % 2 ? 80 : -35, opacity: .25 }, { x: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: row, start: "top 95%", end: "top 65%", scrub: .4 } });
        });
        gsap.fromTo(".signature", { rotation: -6, x: -30 }, { rotation: -2, x: 0, scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "top 60%", scrub: .5 } });
      });
      dispose = () => media.revert();
      void document.fonts.ready.then(() => { if (!cancelled) ScrollTrigger.refresh(); });
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);
  return null;
}
