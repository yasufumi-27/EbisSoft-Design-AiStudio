import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { jaNode } from "@/lib/typography";

/** セクション見出し（英字アイ・キャッチ＋発光ライン＋H2＋リード文）。 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
}) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";
  return (
    <div className={`max-w-2xl ${alignment}`} data-reveal>
      {eyebrow ? (
        <p
          className={`eyebrow mb-4 flex items-center gap-4 ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-brand/70" />
          {eyebrow}
          <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-brand/70" />
        </p>
      ) : null}
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{jaNode(title)}</h2>
      {/* 見出し下のライン。対応ブラウザではスクロールに合わせて引かれる（JS不使用） */}
      <span
        aria-hidden
        className={`divider-glow scroll-line mt-6 block h-px w-24 ${
          align === "center" ? "scroll-line-center mx-auto" : ""
        }`}
      />
      {description ? (
        <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">{jaNode(description)}</p>
      ) : null}
    </div>
  );
}

/**
 * ページの各セクション。id でアンカーナビ対応。
 * 背景は透過が基本（3D背景を活かす）。bg="deep" でひと段階暗い面を敷く。
 */
export function Section({
  id,
  children,
  className = "",
  bg = "transparent",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  bg?: "transparent" | "deep";
}) {
  const bgClass = bg === "deep" ? "bg-ink-2/70 backdrop-blur-[2px]" : "";
  return (
    <section id={id} className={`relative scroll-mt-20 py-20 sm:py-28 ${bgClass} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}
