"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Logo } from "@/components/ui/Logo";
import { ContactLink } from "@/components/ui/ContactLink";

const links = [{ label: "process", id: "capabilities" }, { label: "manifesto", id: "manifesto" }, { label: "founders", id: "founders" }, { label: "feed", id: "blog" }];

export function Header({ contactUrl }: { contactUrl?: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const menu = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(e => e.isIntersecting);
      if (entry) setActive(entry.target.id);
    }, { rootMargin: "-15% 0px -60% 0px" });
    links.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = menu.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 821px)");
    const resize = () => { if (media.matches) setOpen(false); };
    media.addEventListener("change", resize);
    return () => { dialog?.close(); document.body.style.overflow = previous; toggle.current?.focus(); media.removeEventListener("change", resize); };
  }, [open]);

  function navigate(id: string) {
    setOpen(false);
    requestAnimationFrame(() => {
      const section = document.getElementById(id);
      section?.scrollIntoView({ behavior: reduce ? "instant" : "smooth" });
      history.replaceState(null, "", `#${id}`);
    });
  }

  return <><a href="#main" className="skip-link">Skip to content</a><header className="site-header"><a href="#top" className="nav-brand" aria-label="BRVE — home"><Logo /></a><span className="nav-tag">ideas • ai • impact</span><nav aria-label="Primary" className="desktop-nav">{links.map(l => <a key={l.id} href={`#${l.id}`} aria-current={active === l.id ? "location" : undefined}>{l.label}</a>)}</nav><div className="nav-contact"><ContactLink url={contactUrl} outline /></div><button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu"><span /><span /></button></header>
    <AnimatePresence>{open && <motion.dialog ref={menu} id="mobile-menu" className="mobile-menu" aria-label="Navigation" onCancel={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .2 }}><div className="mobile-menu-top"><Logo /><button className="round-button" onClick={() => setOpen(false)} aria-label="Close menu">×</button></div><nav aria-label="Mobile">{links.map((l, i) => <motion.a href={`#${l.id}`} key={l.id} onClick={e => { e.preventDefault(); navigate(l.id); }} initial={{ opacity: 0, y: reduce ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : i * .045 }}><span className="eyebrow">0{i + 1}</span>{l.label}<span aria-hidden="true">↗</span></motion.a>)}</nav><ContactLink url={contactUrl} /><span className="eyebrow mobile-tag">ideas • ai • impact</span></motion.dialog>}</AnimatePresence>
  </>;
}
