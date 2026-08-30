import type { ReactNode } from "react";

import { Figure, type FigureName } from "@/components/ui/Figure";
import { jaNode } from "@/lib/typography";

/**
 * 動的ルート（できること15種・職種18種）で使う図形の候補。
 * 数が多いので一つずつ割り当てず、スラッグから決めます。
 * 4形状を使い回していた頃と違い、ここから選べば隣の記事と同じ絵になりにくい。
 */
const POOL: FigureName[] = [
  "ai-parallel",
  "ai-rag",
  "ai-cited",
  "web-frame",
  "web-speed",
  "web-growth",
  "emb-trace",
  "emb-wave",
  "emb-uplink",
  "co-window",
  "co-judge",
  "co-real",
  "req-talk",
  "req-shape",
  "req-start",
  "contact-hero",
  "faq-hero",
  "columns-hero",
];

/**
 * スラッグから、右に置くオブジェクトの形を決める。
 *
 * 動的ルート（できること・職種別ページ）は数が多いので、一つずつ割り当てず
 * 文字列から決めます。ランダムではないので、同じページは常に同じ形になります
 * （ビルドのたびに絵が変わると、リンクを共有したときに別ページに見える）。
 */
export function artFor(slug: string): FigureName {
  let sum = 0;
  for (let i = 0; i < slug.length; i++) sum += slug.charCodeAt(i) * (i + 1);
  return POOL[sum % POOL.length];
}

/**
 * 下層ページ共通のページヘッダー。
 *
 * デザイン案 03「AI STUDIO」に合わせ、トップページのヒーロー（.ai-hero）を
 * そのまま縮めた構成にしています。
 *
 *   星の散った紫のグラデーション面
 *   ── 左：英字ラベル（display）→ 詰まった大見出し → リード文 → CTA
 *   ── 右：発光するオブジェクト（トップの ONE CONTINUOUS FLIGHT と同じ4種）
 *
 * `art` に図形の名前を渡します（`Figure.tsx`）。動的ルートで使うので、
 * 呼び出し側は `artFor(slug)` で決めるのが基本です。
 *
 * ファーストビューなので reveal は使いません（JSを待たずに描画してLCPを早める）。
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  art = "ai-hero",
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /** 右に置く図形の名前。動的ルートでは artFor(slug) を渡す */
  art?: FigureName;
  children?: ReactNode;
}) {
  return (
    <section className="ai-page-head">
      <div className="ai-stars" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <i key={i} />
        ))}
      </div>

      <div className="ai-page-head-inner">
        <div className="ai-page-head-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{jaNode(title)}</h1>
          {lead ? <p className="speakable ai-page-head-lead">{jaNode(lead)}</p> : null}
          {children}
        </div>
        <Figure name={art} className="ai-page-head-art" />
      </div>
    </section>
  );
}
