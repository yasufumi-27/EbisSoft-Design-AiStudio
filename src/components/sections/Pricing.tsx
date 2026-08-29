import { Section, SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { plans } from "@/lib/content";
import { EmbeddedPricingNote } from "@/components/sections/EmbeddedPricingNote";
import { ja } from "@/lib/typography";

/**
 * 料金プラン。
 *
 * デザイン案 03「AI STUDIO」の LIVE MODULES（トップの .ai-console-grid）と同じ組みです。
 * 3枚の独立したカードを並べるのではなく、**1pxの隙間で連結した一枚の盤**にしています。
 * 隙間の色（紫）がそのまま罫線に見えるので、線を引かずに表の密度が出ます。
 *
 * おすすめプランはゴールドの縁と発光ではなく、上辺のミントの線と
 * `RECOMMENDED` の英字ラベルで示します（ミントはこの案の第2アクセント）。
 */
export function Pricing() {
  return (
    <Section id="pricing">
      <SectionHeading
        eyebrow="Pricing"
        title="料金プラン"
        description="目的と規模に合わせて選べる3プラン。すべて税別・初期費用の目安です。詳細はお見積もりにてご提案します。組み込み開発の費用は別途ご相談です。"
      />

      <div className="ai-plan-grid mt-14" data-reveal>
        {plans.map((plan, i) => {
          const featured = plan.featured ?? false;
          return (
            <article key={plan.name} className="ai-plan" data-featured={featured ? "" : undefined}>
              <p className="ai-plan-index">
                <span>PLAN_0{i + 1}</span>
                {featured ? <b>RECOMMENDED</b> : null}
              </p>

              <h3>{ja(plan.name)}</h3>
              <p className="ai-plan-note">{plan.priceNote}</p>
              <p className="ai-plan-price">{plan.price}</p>
              <p className="ai-plan-desc">{ja(plan.description)}</p>

              <ul className="ai-plan-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <Icon name="check" className="mt-0.5 size-3.5 shrink-0" />
                    <span className="min-w-0">{ja(f)}</span>
                  </li>
                ))}
              </ul>

              <ButtonLink
                href="/contact"
                variant={featured ? "primary" : "secondary"}
                className="ai-plan-cta w-full"
                withArrow
              >
                このプランで相談する
              </ButtonLink>
            </article>
          );
        })}
      </div>

      {/* 上の3プランはWeb制作の金額。組み込み開発が対象外であることを必ず明示する */}
      <EmbeddedPricingNote className="mt-10" />
    </Section>
  );
}
