"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="section min-h-screen flex flex-col justify-center gap-8"><h1 className="section-heading">The page couldn’t load.</h1><button onClick={reset} className="cta self-start">Try again</button><a href="mailto:support@brveai.com">support@brveai.com</a></main>;
}
