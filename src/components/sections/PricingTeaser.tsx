import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { plans } from "@/lib/content";
import { EmbeddedPricingNote } from "@/components/sections/EmbeddedPricingNote";
import { ja } from "@/lib/typography";

/**
 * トップ用の料金ダイジェスト。
 * 価格の全内訳と料金の考え方は /request に置き、ここは「いくらから頼めるか」だけを示します。
 */
export function PricingTeaser() {
  return (
    <Section id="pricing-teaser" bg="deep">
      <SectionHeading
        eyebrow="Pricing"
        title="料金の目安"
        description="Webサイト制作の目安です。ページ数と機能で変わります。組み込み開発の費用は別途ご相談です。初回のご相談・お見積もりは無料です。"
      />

      <dl className="mt-14 grid gap-5 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <div
            key={plan.name}
            className={`panel panel-hover p-6 ${plan.featured ? "border-gold/50" : ""}`}
            data-reveal
            style={{ "--reveal-delay": `${i * 0.1}s` } as React.CSSProperties}
          >
            <dt className="flex items-baseline justify-between gap-3">
              <span className="text-lg font-bold text-white">{ja(plan.name)}</span>
              <span className={`text-xs ${plan.featured ? "text-gold-light" : "text-slate-500"}`}>
                {ja(plan.priceNote)}
              </span>
            </dt>
            <dd className="mt-4">
              <span
                className={`font-display text-3xl font-bold tracking-tight ${
                  plan.featured ? "text-gold" : "text-white"
                }`}
              >
                {plan.price}
              </span>
              <span className="mt-3 block text-[0.9375rem] leading-relaxed text-slate-400 sm:text-sm">
                {ja(plan.description)}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      {/* 上の金額はWeb制作のもの。組み込み開発が対象外であることを必ず明示する */}
      <EmbeddedPricingNote className="mt-8" />

      <p className="mt-10 text-center" data-reveal>
        <Link
          prefetch={false}
          href="/request#pricing"
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-light transition-colors hover:text-white"
        >
          {ja("料金の詳細とご依頼の流れを見る")}
          <Icon name="arrowRight" className="size-4" />
        </Link>
      </p>
    </Section>
  );
}
