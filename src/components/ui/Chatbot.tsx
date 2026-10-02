"use client";

import { useState, type FormEvent } from "react";
import { answerCommonQuestion, commonQuestions } from "@/lib/chatbot";
import { isValidEmailAddress, normalizePhoneNumber } from "@/lib/auth-validation";

type Message = { from: "brve" | "you"; text: string };

export function Chatbot({ formUrl }: { formUrl?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: "brve", text: "Ask me about BRVE, our process, or the people behind the work." }]);
  const [question, setQuestion] = useState("");
  const [contacting, setContacting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  function ask(value: string) {
    const text = value.trim();
    if (!text) return;
    setMessages(current => [...current, { from: "you", text }, { from: "brve", text: answerCommonQuestion(text) }]);
    setQuestion("");
    if (/contact|brief|talk|quote|cost|price/i.test(text)) setContacting(true);
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phoneInput = String(data.get("phone") || "").trim();
    const phone = normalizePhoneNumber(phoneInput);
    const brief = String(data.get("brief") || "").trim();
    if (name.length < 2 || name.length > 100) { setNotice("Enter your name (2–100 characters)."); return; }
    if (!isValidEmailAddress(email)) { setNotice("Enter a valid email address."); return; }
    if (!phone) { setNotice("Enter a valid phone number with its country code."); return; }
    if (brief.length < 5 || brief.length > 2000) { setNotice("Tell us a little about the brief (5–2,000 characters)."); return; }
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/chat/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, brief, website: data.get("website") || "" }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || `The request could not be sent (HTTP ${response.status}).`);
      setNotice("Your details are with the BRVE team. We’ll be in touch.");
      setMessages(current => [...current, { from: "brve", text: "Thanks. Your brief has been sent to the BRVE team." }]);
      form.reset();
    } catch (error) { setNotice((error as Error).message); }
    finally { setBusy(false); }
  }

  return <div className="chatbot-root">
    {open && <section className="chatbot-panel" aria-label="BRVE chat">
      <header className="chatbot-header"><div><span className="eyebrow">BRVE.AI</span><h2>Ask us anything.</h2></div><button type="button" className="round-button" onClick={() => setOpen(false)} aria-label="Close chat">×</button></header>
      <div className="chatbot-scroll" aria-live="polite">{messages.map((message, i) => <p key={i} className={`chat-message ${message.from}`}>{message.text}</p>)}
        {!contacting && <div className="chatbot-prompts" aria-label="Common questions">{commonQuestions.map(item => <button type="button" key={item} onClick={() => ask(item)}>{item}</button>)}</div>}
      </div>
      <form className="chatbot-ask" onSubmit={event => { event.preventDefault(); ask(question); }}><label className="sr-only" htmlFor="chatbot-question">Ask a question</label><input id="chatbot-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Type a question…" maxLength={300} /><button type="submit" aria-label="Send question">↗</button></form>
      {contacting && <form className="chatbot-lead" onSubmit={submitLead}>
        <p className="eyebrow">Leave a brief</p>
        <label>Name<input name="name" autoComplete="name" maxLength={100} required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="+1 415 555 2671" maxLength={32} required /></label>
        <label>What are you working on?<textarea name="brief" rows={3} maxLength={2000} required /></label>
        <label className="chatbot-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        {notice && <p className="chatbot-notice" role="status">{notice}{!busy && formUrl && notice.includes("Google Form") && <> <a href={formUrl} target="_blank" rel="noreferrer">Open the Google Form ↗</a></>}</p>}
        <button className="cta" type="submit" disabled={busy}>{busy ? "sending…" : "send brief →"}</button>
      </form>}
      {!contacting && notice && <p className="chatbot-notice" role="status">{notice}</p>}
    </section>}
    <button type="button" className="chatbot-toggle" aria-expanded={open} aria-label={open ? "Close BRVE chat" : "Open BRVE chat"} onClick={() => setOpen(value => !value)}><span aria-hidden="true">{open ? "×" : "↗"}</span><span>{open ? "close" : "ask BRVE"}</span></button>
  </div>;
}
