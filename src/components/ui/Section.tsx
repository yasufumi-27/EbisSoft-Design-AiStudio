import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { jaNode } from "@/lib/typography";

/**
 * セクション見出し。
 *
 * デザイン案 03「AI STUDIO」の見出し（.ai-flight h2 / .ai-console h2）と同じ組みです。
 *   英字ラベル（display・小さく・字間を空ける）
 *   → 詰まった大見出し（字送り -0.045em、行間 1.14）
 *   → 左端から引く1本のヘアライン
 *   → リード文
 *
 * 以前あった「両脇に光る線を従えた中央寄せの英字ラベル」はやめました。
 * この案は装飾を足さないことで密度を出すため、線は見出しの下に1本だけ引きます。
 *
 * 既定の寄せも中央から**左**へ変えています。トップページ（.ai-flight / .ai-console）が
 * すべて左端に基準線を通した組みなので、下層だけ中央寄せだと別のサイトに見えるためです。
 * 見出しの幅も、左寄せなら本文と同じ基準で読めるので広げています。
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** 既定は左寄せ。この案は左端に基準線を通すのが原則で、中央寄せは使わない */
  align?: "center" | "left";
}) {
  const alignment = align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-3xl text-left";
  return (
    <div className={`ai-heading ${alignment}`} data-align={align} data-reveal>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{jaNode(title)}</h2>
      {/* 見出し下のライン。対応ブラウザではスクロールに合わせて引かれる（JS不使用） */}
      <span
        aria-hidden
        className={`divider-glow scroll-line mt-6 block h-px w-24 ${
          align === "center" ? "scroll-line-center mx-auto" : ""
        }`}
      />
      {description ? <p className="ai-heading-lead">{jaNode(description)}</p> : null}
    </div>
  );
}

/**
 * ページの各セクション。id でアンカーナビ対応。
 *
 * 面は3層で構成します（トップページの .ai-hero / .ai-flight / .ai-console と同じ）。
 *   transparent … 3D背景を透かす素の面。上辺に紫のヘアラインを引いて区切る
 *   deep        … ひと段沈めた面（#0c0815）。密度の高い一覧や表に使う
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
  return (
    <section
      id={id}
      data-bg={bg}
      className={`ai-section relative scroll-mt-20 py-20 sm:py-28 ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}
