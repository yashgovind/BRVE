import copy from "@/content/source.json";
import founders from "@/content/founders.json";
import Image from "next/image";

function SectionTop({ label, title, index }: { label: string; title?: string; index: string }) {
  return <div className="section-top"><div><span className="eyebrow">{label}</span>{title && <h2 className="section-heading" data-reveal>{title}</h2>}</div><span className="section-index" aria-hidden="true">{index} / BRVE</span></div>;
}

function NumberedRows({ rows }: { rows: { title: string; description: string }[] }) {
  return <ol className="numbered-rows">{rows.map((row, i) => <li key={row.title}>
    <span className="row-number" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3>{row.title}</h3><p>{row.description}</p><span className="row-arrow" aria-hidden="true">↗</span>
  </li>)}</ol>;
}

export function Process() {
  const text = copy.Process;
  return <section className="section process" id="capabilities" aria-labelledby="process-label"><div id="process-label"><SectionTop label={text[0]} title={text[1]} index="01" /></div>
    <NumberedRows rows={Array.from({ length: 5 }, (_, i) => ({ title: text[3 + i * 3], description: text[4 + i * 3] }))} />
  </section>;
}

export function Manifesto() {
  const b = copy["Manifesto B"];
  return <>
    <section className="section manifesto-opening" id="manifesto"><span className="section-index manifesto-index" aria-hidden="true">02 / BRVE</span><h2 className="big-statement" data-reveal>{copy["Manifesto A"][0]}<span className="red block">{copy["Manifesto A"][1]}</span></h2></section>
    <section className="section manifesto-context" aria-label="Manifesto continued"><div className="manifesto-tags">{b.slice(0, 4).map(t => <span key={t}>{t}</span>)}</div><p className="manifesto-carousel-copy">{b[4]} <span className="red">{b[5]}</span></p><p className="body-copy">{b[6]}</p></section>
    <section className="section panic"><div className="panic-media" aria-hidden="true" /><div className="panic-line" aria-hidden="true" /><h2 className="big-statement panic-statement" data-reveal>{copy["Manifesto C"][0]}<span className="block">{copy["Manifesto C"][1]}</span></h2></section>
    <section className="section services" id="services"><SectionTop label={copy["Manifesto D"][0]} index="03" /><h2 className="sr-only">{copy["Manifesto D"][0]}</h2><ul>{copy["Manifesto D"].slice(1).map((t, i) => <li key={t}><span className="service-number" aria-hidden="true">0{i + 1}</span><span className="display">{t}</span><span className="service-arrow" aria-hidden="true">↗</span></li>)}</ul></section>
    <section className="section ai-statement"><h2 className="section-heading" data-reveal>{copy["Manifesto E"][0]}</h2><ol>{[2, 4, 6].map((n, i) => <li key={n}><span className="eyebrow" aria-hidden="true">0{i + 1}</span><p>{copy["Manifesto E"][n]}</p></li>)}</ol></section>
  </>;
}

export function BrveTest() {
  const text = copy["BRVE test"];
  return <section className="section brve-test"><SectionTop label={text[0]} title={text[1]} index="04" /><NumberedRows rows={Array.from({ length: 4 }, (_, i) => ({ title: text[3 + i * 3], description: text[4 + i * 3] }))} /></section>;
}

export function BrandFit() {
  const text = copy.Fit;
  return <section className="section fit"><div><h2>{text[0]}</h2><ul>{[2, 4, 6, 8, 10].map(n => <li key={n}>{text[n]}</li>)}</ul></div><div><h2 className="red">{text[11]}</h2><ul>{[13, 15, 17, 19, 21].map(n => <li key={n}>{text[n]}</li>)}</ul></div></section>;
}

export function PointOfView() {
  const p = copy.POV;
  return <><section className="section pov"><span className="eyebrow">{p[0]}</span><h2 className="big-statement" data-reveal>{p[1]}</h2><p className="body-copy">{p[2]} <em>{p[3]}</em> {p[4]}</p></section>
    <div className="word-beat" aria-hidden="true"><span className="display">{copy["Word beat"][0]}</span><span className="word-strike" /></div>
    <section className="section closing"><h2 className="big-statement" data-reveal>{copy.Closing[0]}<span className="red block">{copy.Closing[1]}</span></h2><p className="eyebrow">{copy.Closing[2]}</p></section></>;
}

export function Founders() {
  const portraits = ["/founders/rajni.webp", "/founders/yash.webp", "/founders/yash-new.webp"];
  return <section className="section founders" id="founders"><SectionTop label={copy.Founders[0]} title={copy.Founders[1]} index="05" /><p className="body-copy founders-intro">{copy.Founders[2]}</p><div className="founders-grid">{founders.map((f, i) => <article className="founder" key={f.name}>
    <div className={`portrait-placeholder portrait-${i}`}><Image src={portraits[i]} alt={`${f.name}, ${f.role}`} fill sizes="(max-width: 640px) 90vw, (max-width: 900px) 45vw, 30vw" /><span className="eyebrow founder-role">{f.role}</span></div>
    <div className="founder-copy"><h3>{f.name}</h3><p>{f.bio}</p></div>
  </article>)}</div></section>;
}
