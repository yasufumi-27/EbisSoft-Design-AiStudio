import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { capabilities, capabilitiesBySlug } from "@/lib/content";
import { ja } from "@/lib/typography";

/**
 * 実動デモの抜粋カード（トップ・各詳細ページ用）。
 *
 * デモ本体は重いので、ここではカードとリンクだけを置き、
 * 実際に動かすのは /demo と /demo/<slug> に任せます（トップの表示速度を守るため）。
 */
export function DemoShowcase({
  slugs,
  eyebrow = "Live Demos",
  title = "その場で動かせるデモ",
  description = "主要な領域は、ブラウザでそのまま操作できるデモとして公開しています。",
  bg = "transparent",
}: {
  /** 掲載するデモ（省略時は先頭6件） */
  slugs?: string[];
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  bg?: "transparent" | "deep";
}) {
  const items = slugs ? capabilitiesBySlug(slugs) : capabilities.slice(0, 6);

  return (
    <Section id="demos" bg={bg}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c, i) => (
          <article
            key={c.slug}
            className="group panel panel-hover relative flex flex-col overflow-hidden p-6"
            data-reveal
            style={{ "--reveal-delay": `${(i % 3) * 0.08}s` } as React.CSSProperties}
          >
            <span
              aria-hidden
              className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${c.gradient} opacity-70`}
            />
            <span className="flex items-center justify-between gap-2">
              <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-light transition-colors group-hover:border-brand/50 group-hover:bg-brand/15">
                <Icon name={c.icon} className="size-5" />
              </span>
              <span className="font-display rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-[10px] font-bold tracking-wider text-gold-light">
                {c.buildTime}
              </span>
            </span>

            <h3 className="mt-4 text-base font-bold text-white">
              <Link prefetch={false} href={`/demo/${c.slug}`} className="after:absolute after:inset-0 after:content-['']">
                {ja(c.title)}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-brand-light">{ja(c.tagline)}</p>
            <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-slate-400 sm:text-sm">{ja(c.impact)}</p>

            <span className="mt-4 inline-flex items-center gap-1.5 border-t border-white/10 pt-4 text-xs font-bold text-slate-500 transition-colors group-hover:text-brand-light">
              <Icon name="play" className="size-3.5" />
              デモを開く
            </span>
          </article>
        ))}
      </div>

      <p className="mt-10 text-center" data-reveal>
        <Link
          prefetch={false}
          href="/demo"
          className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold-light transition-colors hover:bg-gold/20"
        >
          {ja("15領域すべてのデモを見る")}
          <Icon name="arrowRight" className="size-4" />
        </Link>
      </p>
    </Section>
  );
}
