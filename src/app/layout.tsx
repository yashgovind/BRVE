import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://brveai.com"),
  title: "BRVE — Advertising + Technology",
  description: "BRVE.AI is an advertising and creative agency for brands tired of looking, sounding and posting like everyone else.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: "BRVE.AI", title: "BRVE — Advertising + Technology", description: "We don’t outsource taste.", images: [{ url: "/brand/brve-original.jpg", width: 1536, height: 1024, alt: "BRVE — advertising + technology" }] },
  twitter: { card: "summary_large_image", title: "BRVE — Advertising + Technology", images: ["/brand/brve-original.jpg"] },
  robots: { index: process.env.LOCAL_CONTENT_PREVIEW !== "true", follow: process.env.LOCAL_CONTENT_PREVIEW !== "true" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /></head><body>{children}</body></html>;
}
