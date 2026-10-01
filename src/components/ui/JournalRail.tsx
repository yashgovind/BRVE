"use client";
import { useEffect, useRef, useState } from "react";

export function JournalRail({ children, count }: { children: React.ReactNode; count: number }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () => {
      const distance = element.scrollWidth - element.clientWidth;
      setActive(distance > 0 ? Math.round(element.scrollLeft / distance * (count - 1)) : 0);
    };
    element.addEventListener("scroll", update, { passive: true });
    return () => element.removeEventListener("scroll", update);
  }, [count]);
  const go = (i: number) => {
    const element = rail.current;
    if (element) element.scrollTo({ left: i / Math.max(1, count - 1) * (element.scrollWidth - element.clientWidth), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return <><div ref={rail} className="journal-rail" tabIndex={0} aria-label="Articles; scroll horizontally or use the arrow controls">{children}</div><div className="journal-navigation"><span className="eyebrow">{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span><div className="journal-rule"><span style={{ transform: `translateX(${active * 100}%)`, width: `${100 / count}%` }} /></div><button className="round-button" aria-label="Previous article" onClick={() => go(Math.max(0, active - 1))} disabled={active === 0}>←</button><button className="round-button" aria-label="Next article" onClick={() => go(Math.min(count - 1, active + 1))} disabled={active >= count - 1}>→</button></div></>;
}
