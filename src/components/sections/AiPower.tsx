import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { aiWorkflow, aiImpacts } from "@/lib/content";
import { ja } from "@/lib/typography";

/**
 * 「AIをどう使って、なぜ速いのか」を開示するセクション。
 *
 * 速さの主張を根拠つきで説明し（各工程でAIが何をして、人が何を担うか）、
 * 検索エンジン・生成AIが引用しやすい一次情報にしています（E-E-A-T / AEO）。
 */
export function AiPower() {
  return (
    <Section id="ai-power" bg="deep">
      <SectionHeading
        eyebrow="AI-Driven Production"
        title={
          <>
            工程ごとの、<span className="text-gradient">AI</span>と人の分担
          </>
        }
        description="量産できる作業はAIが引き受け、人は設計と品質の判断に時間を使います。速さはこの分担から生まれています。"
      />

      {/* 何がどれだけ速くなるか（結論ファースト） */}
      <dl className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
        {aiImpacts.map((item, i) => (
          <div
            key={item.label}
            className="panel panel-hover p-5 text-center"
            style={{ "--reveal-delay": `${i * 0.08}s` } as React.CSSProperties}
          >
            <dt className="text-xs text-slate-500">{ja(item.label)}</dt>
            <dd className="mt-3">
              <span className="block text-sm text-slate-600 line-through">{item.before}</span>
              <span className="font-display mt-1 flex items-center justify-center gap-1.5 text-xl font-bold text-white">
                <Icon name="bolt" className="size-4 text-gold" />
                <span className="text-gradient">{item.after}</span>
              </span>
            </dd>
          </div>
        ))}
      </dl>

      {/* 工程ごとの分担（AI / 人） */}
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {aiWorkflow.map((step, i) => (
          <article
            key={step.phase}
            className="panel panel-hover flex flex-col p-6"
            data-reveal
            style={{ "--reveal-delay": `${(i % 3) * 0.1}s` } as React.CSSProperties}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-light">
                <Icon name={step.icon} className="size-5" />
              </span>
              <span className="font-display text-2xl font-bold text-white/15">{step.phase}</span>
            </div>

            <h3 className="mt-4 text-lg font-bold text-white">{ja(step.title)}</h3>
            <p className="speakable mt-2 flex-1 text-sm leading-relaxed text-slate-400">
              {ja(step.description)}
            </p>

            <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs">
              <div className="flex gap-2">
                <dt className="font-display shrink-0 rounded border border-brand/40 bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-brand-light">
                  AI
                </dt>
                <dd className="text-slate-400">{ja(step.ai)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-display shrink-0 rounded border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-gold-light">
                  人
                </dt>
                <dd className="text-slate-400">{ja(step.human)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <details className="demo-note mt-10" data-reveal>
        <summary>{ja("AIで作ると品質が落ちるのではないか、というご質問について")}</summary>
        <p className="speakable mt-3 text-sm leading-relaxed text-slate-400">
          {ja(
            "設計方針・ブランド表現の判断・コードレビュー・公開判断は、必ず人が行います。AIに任せるのは、判断ではなく作業です。むしろAIで浮いた時間を表示速度やアクセシビリティの作り込みに再投資できるため、仕上がりはむしろ深くなります。その証拠として、このサイト自体がAIを駆使して制作され、Lighthouse の性能スコア100点で動作しています。",
          )}
        </p>
      </details>
    </Section>
  );
}
