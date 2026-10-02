"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, signOut, type User } from "firebase/auth";
import { getFirebaseClientApp } from "@/lib/firebase/client";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ContactLink } from "@/components/ui/ContactLink";

const links = [{ label: "process", id: "capabilities" }, { label: "manifesto", id: "manifesto" }, { label: "founders", id: "founders" }, { label: "feed", id: "blog" }];
const adminEmail = "2brveai@gmail.com";

export function Header({ contactUrl }: { contactUrl?: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const menu = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const showAdmin = user?.email?.toLowerCase() === adminEmail;

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(e => e.isIntersecting);
      if (entry) setActive(entry.target.id);
    }, { rootMargin: "-15% 0px -60% 0px" });
    links.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    try {
      const auth = getAuth(getFirebaseClientApp());
      void setPersistence(auth, browserLocalPersistence).then(() => {
        if (!active) return;
        unsubscribe = onAuthStateChanged(auth, current => {
          setUser(current);
          setAuthReady(true);
        }, () => {
          setAuthReady(true);
          setAuthMessage("Google sign-in could not be initialized.");
        });
      }).catch(() => {
        if (active) { setAuthReady(true); setAuthMessage("Google sign-in could not be initialized."); }
      });
    } catch {
      queueMicrotask(() => { if (active) { setAuthReady(true); setAuthMessage("Google sign-in is unavailable. Check the Firebase web configuration."); } });
    }
    return () => { active = false; unsubscribe?.(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = menu.current;
    const toggleButton = toggle.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 821px)");
    const resize = () => { if (media.matches) setOpen(false); };
    media.addEventListener("change", resize);
    return () => { dialog?.close(); document.body.style.overflow = previous; toggleButton?.focus(); media.removeEventListener("change", resize); };
  }, [open]);

  function navigate(id: string) {
    setOpen(false);
    requestAnimationFrame(() => {
      const section = document.getElementById(id);
      if (section) { section.tabIndex = -1; section.focus({ preventScroll: true }); }
      section?.scrollIntoView({ behavior: reduce ? "instant" : "smooth" });
      history.replaceState(null, "", `#${id}`);
    });
  }

  async function handleSignOut() {
    setAuthBusy(true);
    setAuthMessage("");
    try {
      await signOut(getAuth(getFirebaseClientApp()));
    } catch {
      setAuthMessage("Sign-out could not complete. Please try again.");
    } finally { setAuthBusy(false); }
  }

  function authControl(mobile = false) {
    const firstName = user?.displayName?.trim().split(/\s+/)[0];
    return user
      ? <button type="button" className={`nav-auth${mobile ? " nav-auth-mobile" : ""}`} disabled={!authReady || authBusy} onClick={() => void handleSignOut()} aria-label={`Sign out ${user.email || user.displayName || "of BRVE"}`}><span className="nav-auth-user">{firstName || "account"}</span><span>{authBusy ? "…" : "sign out"}</span></button>
      : <Link className={`nav-auth${mobile ? " nav-auth-mobile" : ""}`} href="/sign-in" aria-label="Sign in to BRVE"><span className="google-mark" aria-hidden="true">G</span><span>sign in</span></Link>;
  }

  return <><a href="#main" className="skip-link">Skip to content</a><header className="site-header"><a href="#top" className="nav-brand" aria-label="BRVE — home"><Logo /></a><span className="nav-tag">ideas • ai • impact</span><nav aria-label="Primary" className="desktop-nav">{links.map(l => <a key={l.id} href={`#${l.id}`} aria-current={active === l.id ? "location" : undefined}>{l.label}</a>)}</nav>{showAdmin && <Link className="nav-admin" href="/admin">admin <span aria-hidden="true">↗</span></Link>}<div className="nav-auth-desktop">{authControl()}</div><div className="nav-contact"><ContactLink url={contactUrl} outline /></div><button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu"><span /><span /></button><span className="page-scroll-progress" aria-hidden="true"><span /></span></header>
    {authMessage && <span className="nav-auth-status" role="status">{authMessage}</span>}
    <AnimatePresence>{open && <motion.dialog ref={menu} id="mobile-menu" className="mobile-menu" aria-label="Navigation" onCancel={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .2 }}><div className="mobile-menu-top"><Logo /><button className="round-button" onClick={() => setOpen(false)} aria-label="Close menu">×</button></div><nav aria-label="Mobile">{links.map((l, i) => <motion.a href={`#${l.id}`} key={l.id} onClick={e => { e.preventDefault(); navigate(l.id); }} initial={{ opacity: 0, y: reduce ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : i * .045 }}><span className="eyebrow">0{i + 1}</span>{l.label}<span aria-hidden="true">↗</span></motion.a>)}</nav><div className="mobile-menu-actions">{showAdmin && <Link href="/admin" className="nav-admin nav-admin-mobile">admin <span aria-hidden="true">↗</span></Link>}{authControl(true)}<ContactLink url={contactUrl} /></div><span className="eyebrow mobile-tag">ideas • ai • impact</span></motion.dialog>}</AnimatePresence>
  </>;
}
