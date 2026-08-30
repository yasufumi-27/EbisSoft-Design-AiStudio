import type { Metadata } from "next";

import { ProposalIndex } from "@/components/sections/DesignProposal";

/**
 * デザイン提案（3案の比較）。**社内・提案用のページで、検索対象ではない。**
 *
 * ⚠️ ここに metadata が無いと、ルートレイアウトの metadata をそのまま継承してしまう。
 *    つまり title・description がトップページと丸ごと同じになり、さらに
 *    `alternates.canonical`（= トップのURL）まで受け継ぐため、
 *    **「/proposal はトップの複製である」と検索エンジンに申告する** ことになる。
 *    トップの正規化シグナルを汚すので、自分自身を canonical に指したうえで
 *    noindex にして、インデックスから外す。
 */
export const metadata: Metadata = {
  title: "デザイン提案（3案の比較）",
  description:
    "エビスソフトのサイトデザインを3つの方向から検討した提案ページです。検討用のため検索結果には掲載していません。",
  alternates: { canonical: "/proposal" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function ProposalPage() {
  return <ProposalIndex />;
}
