"use client";

import { useState } from "react";
import { answerCommonQuestion, commonQuestions } from "@/lib/chatbot";

type Message = { from: "brve" | "you"; text: string };

export function Chatbot({ formUrl }: { formUrl?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: "brve", text: "Ask me about BRVE, our process, or the people behind the work." }]);
  const [question, setQuestion] = useState("");
  const [contacting, setContacting] = useState(false);
  const [asking, setAsking] = useState(false);
  const [chatStatus, setChatStatus] = useState("");

  async function ask(value: string) {
    const text = value.trim();
    if (!text || asking) return;
    const history = [...messages.slice(-10).map(message => ({ role: message.from === "brve" ? "assistant" as const : "user" as const, content: message.text })), { role: "user" as const, content: text }];
    setMessages(current => [...current, { from: "you", text }]);
    setQuestion("");
    if (/contact|brief|talk|quote|cost|price/i.test(text)) setContacting(true);
    setAsking(true);
    setChatStatus("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const result = await response.json().catch(() => ({})) as { reply?: string; provider?: "mistral" | "fallback"; reason?: "unconfigured" | "unavailable"; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error || "Chat is temporarily unavailable.");
      setMessages(current => [...current, { from: "brve", text: result.reply! }]);
      if (result.provider === "fallback") {
        setChatStatus(result.reason === "unconfigured" ? "Mistral isn’t configured for this deployment yet; using BRVE quick replies." : "Mistral is temporarily unavailable; using BRVE quick replies.");
      }
    } catch {
      setMessages(current => [...current, { from: "brve", text: answerCommonQuestion(text) }]);
      setChatStatus("Mistral is temporarily unavailable; using BRVE quick replies.");
    } finally {
      setAsking(false);
    }
  }

  return <div className="chatbot-root">
    {open && <section className="chatbot-panel" aria-label="BRVE chat">
      <header className="chatbot-header"><div><span className="eyebrow">BRVE.AI</span><h2>Ask us anything.</h2></div><button type="button" className="round-button" onClick={() => setOpen(false)} aria-label="Close chat">×</button></header>
      <div className="chatbot-scroll" aria-live="polite">{messages.map((message, i) => <p key={i} className={`chat-message ${message.from}`}>{message.text}</p>)}{asking && <p className="chat-message brve" role="status">thinking…</p>}
        {!contacting && <div className="chatbot-prompts" aria-label="Common questions">{commonQuestions.map(item => <button type="button" key={item} disabled={asking} onClick={() => void ask(item)}>{item}</button>)}</div>}
      </div>
      <form className="chatbot-ask" onSubmit={event => { event.preventDefault(); void ask(question); }}><label className="sr-only" htmlFor="chatbot-question">Ask a question</label><input id="chatbot-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Type a question…" maxLength={1200} disabled={asking} /><button type="submit" aria-label="Send question" disabled={asking || !question.trim()}>↗</button></form>
      {chatStatus && <p className="chatbot-notice" role="status">{chatStatus}</p>}
      {contacting && <div className="chatbot-contact-link"><a className="cta" href={formUrl || "#contact"} target={formUrl ? "_blank" : undefined} rel={formUrl ? "noopener noreferrer" : undefined}>bring the brief →</a></div>}
    </section>}
    <button type="button" className="chatbot-toggle" aria-expanded={open} aria-label={open ? "Close BRVE chat" : "Open BRVE chat"} onClick={() => setOpen(value => !value)}><span aria-hidden="true">{open ? "×" : "↗"}</span><span>{open ? "close" : "ask BRVE"}</span></button>
  </div>;
}
