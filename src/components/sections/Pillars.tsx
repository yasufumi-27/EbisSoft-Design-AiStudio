import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { pillars } from "@/lib/content";
import { ja } from "@/lib/typography";

/**
 * トップページの3本柱（AI活用 / Web制作 / 組み込み開発）。
 *
 * トップは「要約と入口」に徹し、詳細は各ページへ送ります。
 * カード全体をリンクにすると読み上げ時に長くなるため、
 * 見出しのリンクを主導線にし、カードは装飾のホバーだけを担当します。
 */
export function Pillars() {
  return (
    <Section id="pillars">
      <SectionHeading
        eyebrow="What We Do"
        title={
          <>
            <span className="text-gradient">AI</span>を軸にした3つの事業
          </>
        }
        description="Web制作も組み込み開発も、AIをどう使うかという同じ軸の上にあります。気になる領域からご覧ください。"
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {pillars.map((p, i) => (
          <article
            key={p.href}
            className="group panel panel-hover panel-corners relative flex flex-col overflow-hidden p-7"
            data-reveal
            style={{ "--reveal-delay": `${i * 0.1}s` } as React.CSSProperties}
          >
            {/* 領域ごとの色（イメージ画像の代わりに軽量なグラデーションで印象づける） */}
            <span
              aria-hidden
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${p.gradient}`}
            />
            <span
              aria-hidden
              className={`pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-gradient-to-br ${p.gradient} opacity-15 blur-2xl transition-opacity duration-500 group-hover:opacity-30`}
            />

            <span className="grid size-12 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-light shadow-[0_0_20px_rgba(182, 126, 255,0.2)]">
              <Icon name={p.icon} className="size-6" />
            </span>

            <p className="eyebrow mt-5">{p.eyebrow}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              <Link prefetch={false} href={p.href} className="after:absolute after:inset-0 after:content-['']">
                {ja(p.title)}
              </Link>
            </h3>
            <p className="speakable mt-3 font-medium text-slate-200">{ja(p.lead)}</p>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-slate-400 sm:text-sm">{ja(p.description)}</p>

            <ul className="mt-5 flex-1 space-y-2 border-t border-white/10 pt-5">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                  <Icon name="check" className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span className="min-w-0">{ja(b)}</span>
                </li>
              ))}
            </ul>

            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-light transition-colors group-hover:text-white">
              {ja(p.cta)}
              <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </article>
        ))}
      </div>
    </Section>
  );
}
