import { ContactLink } from "@/components/ui/ContactLink";
import { Logo } from "@/components/ui/Logo";

export function Contact({ url }: { url?: string }) {
  return <section className="section contact" id="contact"><span className="eyebrow">bring us the problem</span><div className="contact-main"><h2 className="big-statement" data-reveal>here’s where<br />we come in.</h2><span className="contact-arrow" aria-hidden="true">↗</span></div><div className="contact-actions"><ContactLink url={url} /><a href="https://mail.google.com/mail/?view=cm&fs=1&to=support%40brveai.com" target="_blank" rel="noopener noreferrer">support@brveai.com</a></div></section>;
}
export function Footer() {
  return <footer className="site-footer"><p className="signature">Screenshot this one.</p><div className="footer-bottom"><a href="#top" aria-label="BRVE — back to top"><Logo large /></a><div className="footer-info"><a href="https://mail.google.com/mail/?view=cm&fs=1&to=support%40brveai.com" target="_blank" rel="noopener noreferrer">support@brveai.com</a><p>brve.ai — advertising <span className="red">+</span> technology</p><a href="#top">back to top ↑</a></div></div></footer>;
}
