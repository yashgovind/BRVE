"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function JournalRail({ children, count }: { children: React.ReactNode; count: number }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const syncActive = useCallback(() => {
    const element = rail.current;
    if (!element) return;

    const railLeft = element.getBoundingClientRect().left;
    const cards = Array.from(element.children) as HTMLElement[];
    if (!cards.length) {
      setActive(0);
      return;
    }

    // Track the card whose leading edge is closest to the rail's leading edge.
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - railLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setActive(Math.min(nearestIndex, Math.max(0, count - 1)));
  }, [count]);

  useEffect(() => {
    const element = rail.current;
    if (!element) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncActive);
    };
    const resizeObserver = new ResizeObserver(onScroll);
    resizeObserver.observe(element);
    element.addEventListener("scroll", onScroll, { passive: true });
    syncActive();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      element.removeEventListener("scroll", onScroll);
    };
  }, [syncActive]);

  const go = (index: number) => {
    const element = rail.current;
    const card = element?.children[index] as HTMLElement | undefined;
    if (!element || !card) return;

    const firstCard = element.children[0] as HTMLElement | undefined;
    const firstCardLeft = firstCard?.offsetLeft ?? 0;
    const maxScroll = element.scrollWidth - element.clientWidth;
    const left = Math.max(0, Math.min(maxScroll, card.offsetLeft - firstCardLeft));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left, behavior: reduceMotion ? "instant" : "smooth" });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(Math.min(count - 1, active + 1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(Math.max(0, active - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      go(0);
    } else if (event.key === "End") {
      event.preventDefault();
      go(count - 1);
    }
  };

  if (!count) return <>{children}</>;

  return <>
    <div
      ref={rail}
      className="journal-rail"
      tabIndex={0}
      aria-label="Articles; scroll horizontally or use the arrow controls"
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
    <div className="journal-navigation" aria-label="Article carousel controls">
      <span className="eyebrow" aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
      <div className="journal-rule" aria-hidden="true"><span style={{ transform: `translateX(${active * 100}%)`, width: `${100 / count}%` }} /></div>
      <button className="round-button" aria-label="Previous article" onClick={() => go(Math.max(0, active - 1))} disabled={active === 0}>←</button>
      <button className="round-button" aria-label="Next article" onClick={() => go(Math.min(count - 1, active + 1))} disabled={active >= count - 1}>→</button>
    </div>
  </>;
}
