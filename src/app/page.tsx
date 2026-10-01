import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { Process, Manifesto, BrveTest, BrandFit, PointOfView, Founders } from "@/components/sections/Editorial";
import { Journal } from "@/components/sections/Journal";
import { Contact, Footer } from "@/components/sections/Contact";
import { RevealController } from "@/components/motion/RevealController";
import { getSiteData } from "@/lib/firebase/data";
import { FilmGallery } from "@/components/sections/FilmGallery";
import { ScrollExperience } from "@/components/motion/ScrollExperience";

export const revalidate = 300;

export default async function Home() {
  const { videos, posts, settings, preview } = await getSiteData();
  const schema = { "@context": "https://schema.org", "@type": "Organization", name: "BRVE.AI", url: "https://brveai.com", logo: "https://brveai.com/brand/brve-original.jpg", email: "support@brveai.com", sameAs: [settings.instagramUrl, settings.linkedinUrl, settings.youtubeUrl].filter(Boolean) };
  return <div id="top"><Header contactUrl={settings.contactFormUrl} /><main id="main"><Hero videos={videos} /><FilmGallery videos={videos} /><Process /><Manifesto backdrop={videos.at(-1)?.thumbnail} /><BrveTest /><BrandFit /><PointOfView /><Founders /><Journal posts={posts} settings={settings} preview={preview} previewImages={[videos[5]?.thumbnail, videos[0]?.thumbnail, videos[2]?.thumbnail, videos[1]?.thumbnail].filter(Boolean)} /><Contact url={settings.contactFormUrl} /></main><Footer /><RevealController /><ScrollExperience /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />{preview && <details className="preview-note"><summary>Local design preview</summary><p>Original copy preserved. Founder portraits and final biographies are pending. Feed cards are source examples until Blogger is connected. <a href="/admin">Open admin ↗</a></p></details>}</div>;
}
