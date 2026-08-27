import { Section, SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { plans } from "@/lib/content";
import { EmbeddedPricingNote } from "@/components/sections/EmbeddedPricingNote";
import { ja } from "@/lib/typography";

/** 料金プラン。人気プランはゴールドの縁とグローで格上げ。 */
export function Pricing() {
  return (
    <Section id="pricing">
      <SectionHeading
        eyebrow="Pricing"
        title="料金プラン"
        description="目的と規模に合わせて選べる3プラン。すべて税別・初期費用の目安です。詳細はお見積もりにてご提案します。組み込み開発の費用は別途ご相談です。"
      />
      <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
        {plans.map((plan, i) => {
          const featured = plan.featured ?? false;
          return (
            <div
              key={plan.name}
              className={
                featured
                  ? "panel panel-corners relative border-gold/50 p-8 shadow-[0_0_60px_-15px_rgba(170, 255, 220,0.35)] lg:-mt-4 lg:pb-12"
                  : "panel panel-hover relative p-8"
              }
              data-reveal
              style={{ "--reveal-delay": `${i * 0.12}s` } as React.CSSProperties}
            >
              {featured ? (
                <span className="font-display absolute right-6 top-6 rounded-full bg-gradient-to-r from-gold-light to-gold px-3 py-1 text-xs font-bold tracking-wider text-ink">
                  人気No.1
                </span>
              ) : null}
              <h3 className="text-lg font-bold text-white">{ja(plan.name)}</h3>
              <p className={`mt-1 text-sm ${featured ? "text-gold-light" : "text-slate-500"}`}>
                {plan.priceNote}
              </p>
              <p className="mt-5">
                <span className="font-display text-3xl font-bold tracking-tight">
                  {featured ? (
                    <span className="text-gold">{plan.price}</span>
                  ) : (
                    <span className="text-white">{plan.price}</span>
                  )}
                </span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{ja(plan.description)}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Icon
                      name="check"
                      className={`mt-0.5 size-4 shrink-0 ${featured ? "text-gold" : "text-brand"}`}
                    />
                    <span className="min-w-0">{ja(f)}</span>
                  </li>
                ))}
              </ul>
              <ButtonLink
                href="/contact"
                variant={featured ? "primary" : "secondary"}
                className="mt-8 w-full"
                withArrow
              >
                このプランで相談する
              </ButtonLink>
            </div>
          );
        })}
      </div>

      {/* 上の3プランはWeb制作の金額。組み込み開発が対象外であることを必ず明示する */}
      <EmbeddedPricingNote className="mt-10" />
    </Section>
  );
}
