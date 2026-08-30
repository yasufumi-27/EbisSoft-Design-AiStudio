import { ClosingCta } from "@/components/ui/Studio";

/**
 * ページの締めのCTA。
 *
 * 以前は中央寄せの見出しに金色のぼかし光を重ねた独自の形でしたが、
 * トップページの締め（`ai-final`）と作りが違い、ここだけ旧デザインが残っていました。
 * いまは共通部品の `ClosingCta` に寄せて、全ページで同じ締め方に統一しています。
 *
 * 文言をページごとに変えたいときは、`ClosingCta` を直接置いてください
 * （このコンポーネントは、まだ個別の文言を持たないページ用の既定値です）。
 */
export function ContactCta() {
  return (
    <ClosingCta
      title={
        <>
          やりたいことだけ、
          <br />
          聞かせてください。
        </>
      }
      lead="決まっているのが方向性だけでも大丈夫です。初回相談・お見積もりは無料、入力は1〜2分で終わります。"
      action={{ href: "/contact", label: "無料で相談する", primary: true }}
      secondary={{ href: "/request", label: "料金の目安を見る" }}
    />
  );
}
