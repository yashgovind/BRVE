"use client";

import { useEffect, useId, useRef, useState } from "react";

function embeddedFormUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "docs.google.com" && url.pathname.includes("/forms/")) {
      url.searchParams.set("embedded", "true");
    }
    return url.toString();
  } catch {
    return value;
  }
}

export function ContactLink({ url, outline = false }: { url?: string; outline?: boolean }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const className = `cta ${outline ? "cta-outline" : ""}`;

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  return <>
    <button className={className} type="button" onClick={() => setOpen(true)}>bring the brief →</button>
    {open && <dialog ref={dialog} className="contact-form-dialog" aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={event => {
      if (event.target === dialog.current) setOpen(false);
    }}>
      <div className="contact-form-top">
        <h2 id={titleId}>bring us the problem</h2>
        <button type="button" className="round-button" aria-label="Close contact form" onClick={() => setOpen(false)}>×</button>
      </div>
      {url ? <>
        <iframe title="BRVE contact form" src={embeddedFormUrl(url)} allow="clipboard-write" referrerPolicy="strict-origin-when-cross-origin" />
        <a className="contact-form-fallback" href={url} target="_blank" rel="noopener noreferrer">Open form in a new tab ↗</a>
      </> : <div className="contact-form-missing">
        <p>The Google Form link has not been added to site settings yet.</p>
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=support%40brveai.com" target="_blank" rel="noopener noreferrer">support@brveai.com ↗</a>
      </div>}
    </dialog>}
  </>;
}
