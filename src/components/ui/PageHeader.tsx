import type { ReactNode } from "react";
import { jaNode } from "@/lib/typography";

/**
 * スラッグから、右に置くオブジェクトの形を決める。
 *
 * 動的ルート（できること・職種別ページ）は数が多いので、一つずつ割り当てず
 * 文字列から決めます。ランダムではないので、同じページは常に同じ形になります
 * （ビルドのたびに絵が変わると、リンクを共有したときに別ページに見える）。
 */
export function artFor(slug: string): 0 | 1 | 2 | 3 {
  let sum = 0;
  for (let i = 0; i < slug.length; i++) sum += slug.charCodeAt(i);
  return (sum % 4) as 0 | 1 | 2 | 3;
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
 * `art` でオブジェクトの形を選びます。トップの 01〜04 と同じ4形状なので、
 * ページごとに違う形を割り当てると「同じラボの別セクション」に見えます。
 *   0 … 球（既定）  1 … 星形  2 … 寝かせた点線の環  3 … ミントの核
 *
 * ファーストビューなので reveal は使いません（JSを待たずに描画してLCPを早める）。
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  art = 0,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /** 右に置く発光オブジェクトの形（0〜3）。トップの 01〜04 と同じ */
  art?: 0 | 1 | 2 | 3;
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
        <div className={`ai-flight-object ai-flight-${art} ai-page-head-art`} aria-hidden />
      </div>
    </section>
  );
}
