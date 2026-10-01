import Image from "next/image";

export function Logo({ large = false }: { large?: boolean }) {
  return <span className={`brand-logo ${large ? "brand-logo-large" : ""}`}>
    <Image src="/brand/brve-original.jpg" alt="BRVE — advertising + technology" width={1536} height={1024} sizes={large ? "(max-width: 640px) 80vw, 420px" : "240px"} />
  </span>;
}
