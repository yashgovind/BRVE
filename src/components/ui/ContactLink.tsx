export function ContactLink({ url, outline = false }: { url?: string; outline?: boolean }) {
  const className = `cta ${outline ? "cta-outline" : ""}`;
  return url ? <a className={className} href={url} target="_blank" rel="noopener noreferrer">bring the brief →</a>
    : <span className={className} role="link" aria-disabled="true" title="Contact form is not configured yet">bring the brief →</span>;
}
