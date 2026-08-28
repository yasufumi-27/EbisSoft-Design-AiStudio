import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { ja } from "@/lib/typography";

/**
 * 「組み込み系の費用は別途ご相談」の明示。
 *
 * Web制作の金額（`plans`）は**組み込み開発には適用されません**。
 * 誤解が一番起きやすい箇所なので、料金を出しているところには必ずこの注記を添えます：
 * - トップの料金ダイジェスト（`PricingTeaser`）
 * - 料金プラン表（`Pricing` ＝ /request）
 * - 組み込み開発ページ（/embedded）
 *
 * 目立たせるためにゴールドの枠＋グローを使い、見出しは太字で言い切ります。
 */
export function EmbeddedPricingNote({
  className = "",
  /** "web" … Web制作の料金の横に置く場合／"embedded" … 組み込み開発ページに置く場合 */
  variant = "web",
}: {
  className?: string;
  variant?: "web" | "embedded";
}) {
  const body =
    variant === "web"
      ? "上記はWebサイト制作の料金です。組み込みソフトウェア・IoT開発（ファームウェア、マイコン、通信、実機検証など）はこのプラン料金の対象外で、マイコンの種類・既存コードの有無・実機検証の範囲によって大きく変わるため、内容をうかがったうえで個別にお見積もりします。"
      : "組み込み開発には定額のプランを設けていません。マイコンの種類、既存コードの有無、通信や実機検証の範囲、必要な期間によって金額が大きく変わるためです。Webサイト制作の料金プランは適用されません。内容をうかがったうえで、個別にお見積もりをお出しします。";
  return (
    <div
      className={`panel panel-corners border-gold/60 bg-gold/[0.06] p-6 shadow-[0_0_50px_-15px_rgba(170,255,220,0.45)] sm:p-7 ${className}`}
      data-reveal
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="grid size-12 shrink-0 place-items-center rounded-none border border-gold/40 bg-gold/10 text-gold-light">
          <Icon name="cpu" className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold text-gold-light sm:text-xl">
            組み込み開発の費用は<span className="text-gold">別途ご相談</span>です
          </p>
          <p className="speakable mt-2 text-sm leading-relaxed text-slate-300">{ja(body)}</p>
          <p className="mt-3 text-sm text-slate-400">
            {ja("初回のご相談・お見積もりは無料です。")}
            {variant === "web" ? (
              <Link
                prefetch={false}
                href="/embedded"
                className="mx-1 font-bold text-brand-light underline underline-offset-4 hover:text-brand"
              >
                組み込み開発の対応範囲を見る
              </Link>
            ) : (
              <Link
                prefetch={false}
                href="/contact"
                className="mx-1 font-bold text-brand-light underline underline-offset-4 hover:text-brand"
              >
                費用を相談する
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
