import Link from "next/link";
export default function NotFound() {
  return <main className="section min-h-screen flex flex-col justify-center gap-8"><span className="eyebrow">404</span><h1 className="section-heading">Page not found.</h1><Link href="/" className="cta self-start">Back to BRVE →</Link></main>;
}
