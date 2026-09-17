/* eslint-disable @next/next/no-img-element -- Prebuilt responsive assets support static hosting. */
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./CharacterGuide.module.css";

const people = {
  chroma: { name: "クロマ", role: "AI広報", en: "CHROMA", src: "chroma-official-v2.jpg", alt: "赤いボブヘアとシアンの衣装が特徴のAI広報キャラクター、クロマ" },
  ebisu: { name: "エビスさん", role: "マネージャー", en: "EBISU", src: "ebisu-original.jpg", alt: "釣り竿と赤い鯛を伴う、エビスソフトのマネージャーキャラクター、エビスさん" },
} as const;
export type Character = keyof typeof people;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Display the supplied original artwork without changing the character design. */
export function CharacterPortrait({ character, avatar = false, className = "", decorative = false }: { character: Character; avatar?: boolean; className?: string; decorative?: boolean }) {
  const person = people[character];
  return <span className={`${styles.portrait} ${avatar ? styles.avatar : ""} ${className}`} data-character={character}>
    <img src={`${basePath}/images/characters/optimized/${character}-320.webp`}
      srcSet={[160, 320, 640].map(width => `${basePath}/images/characters/optimized/${character}-${width}.webp ${width}w`).join(", ")}
      sizes={avatar ? "128px" : "(max-width: 640px) 260px, 320px"}
      width={720} height={1280} alt={decorative ? "" : person.alt} loading="lazy" decoding="async"/>
  </span>;
}

export function CharacterGuide({ character, children, title, href, linkLabel, compact = false, standalone = false }: {
  character: Character; children: ReactNode; title?: string; href?: string; linkLabel?: string; compact?: boolean; standalone?: boolean;
}) {
  const person = people[character];
  const Heading = standalone ? "h2" : "h3";
  return <aside className={`${styles.guide} ${compact ? styles.compact : ""} ${standalone ? styles.standalone : ""}`} data-character={character} data-enter aria-label={`${person.role}・${person.name}からのご案内`}>
    <div className={styles.art}>
      <CharacterPortrait character={character} avatar={compact} decorative/>
      {!compact && <span className={styles.artLabel} aria-hidden="true">{person.en}</span>}
    </div>
    <div className={styles.copy}>
      <p className={styles.byline}><span>{person.role}</span><b>{person.name}</b><i aria-hidden="true"/></p>
      {title && <Heading>{title}</Heading>}
      <div className={styles.message}>{children}</div>
      {href && linkLabel && <Link prefetch={false} href={href} className={styles.link}>{linkLabel}<span aria-hidden="true">↗</span></Link>}
    </div>
  </aside>;
}
