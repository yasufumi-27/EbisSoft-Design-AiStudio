/**
 * ページ固有の抽象図形。
 *
 * トップページの ONE CONTINUOUS FLIGHT で使っている「発光する幾何学形」の語彙
 * ——放射グラデーションの光、点線の環、円錐グラデーションの金属面、直角に折れる線——
 * はそのままに、**ページごとに違う形**を描き分けるための部品です。
 *
 * 以前は4種類の形（球・星・環・核）を全ページで使い回していたため、
 * スクロールしていくとどのページを見ているのか分からなくなっていました。
 * いまは1ページにつき固有の図形を4つ（入口＋各段）持たせています。
 *
 * 実装はすべてCSS（`globals.css` の `.fig-*`）です。画像ファイルを持たないので
 * 追加のネットワーク取得がなく、拡大しても滲みません。
 * 中の `<i>` は形のパーツ（線・面・点）で、意味は figure ごとに違います。
 */

/** 図形の名前。`globals.css` の `.fig-<name>` と1対1で対応する */
export type FigureName =
  // AI活用
  | "ai-hero"
  | "ai-parallel"
  | "ai-rag"
  | "ai-cited"
  // Web制作
  | "web-hero"
  | "web-frame"
  | "web-speed"
  | "web-growth"
  // 組み込み
  | "emb-hero"
  | "emb-trace"
  | "emb-wave"
  | "emb-uplink"
  // できること
  | "demo-hero"
  // 会社概要
  | "co-hero"
  | "co-window"
  | "co-judge"
  | "co-real"
  // ご依頼
  | "req-hero"
  | "req-talk"
  | "req-shape"
  | "req-start"
  // その他の入口
  | "contact-hero"
  | "faq-hero"
  | "columns-hero"
  | "showcase-hero"
  | "privacy-hero";

export function Figure({ name, className = "" }: { name: FigureName; className?: string }) {
  return (
    <div className={`fig fig-${name} ${className}`} aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
