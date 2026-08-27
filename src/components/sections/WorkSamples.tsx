import Link from "next/link";

import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { industries } from "@/lib/showcaseData";
import { demoSites } from "@/lib/demoSiteData";
import type { DemoSiteTheme } from "@/lib/demoSite";
import { ja } from "@/lib/typography";

/**
 * 制作サンプル（トップ）。
 *
 * 【なぜ置くか】
 * 「実績が見たい」は検討中の方が最初に確かめたいことですが、当社は実在のお客様の
 * 制作事例・お客様の声を公開できる状態にありません（架空の事例を載せることは
 * E-E-A-T の観点でも、事実としても許されません。`docs/引き継ぎ.md` 2章の経緯を参照）。
 * その代わり、**実際に動く成果物そのもの**＝18業種ぶんのデモサイト（`/demosite/<業種>`）を
 * トップから正面に出して、仕上がりを見て判断してもらえるようにしています。
 *
 * 【正直さのルール】
 * 掲載している屋号・連絡先はすべて架空です。実績として見せてはいけないので、
 * セクション内で必ず「架空の事業者を想定して制作したサンプル」と明示すること。
 *
 * 【表示速度】
 * サーバーコンポーネントなので `demoSiteData` / `showcaseData` は初期JSに載りません。
 * デモサイトへのリンクは別タブ・prefetch なしで、押した時点で初めて読み込まれます。
 */

/** トップに出す代表6業種（業態の幅が伝わる組み合わせを選んでいる）。 */
const FEATURED = ["clinic", "construction", "restaurant", "manufacturing", "beauty", "realestate"];

/** デモサイトの配色プリセットを、カードのミニプレビューの色に対応させる。 */
const THEME_SWATCH: Record<DemoSiteTheme, string> = {
  clean: "from-sky-400 to-blue-500",
  warm: "from-amber-400 to-orange-500",
  care: "from-emerald-400 to-teal-500",
  bold: "from-orange-500 to-rose-500",
  elegant: "from-fuchsia-400 to-violet-500",
  trust: "from-cyan-400 to-indigo-500",
};

export function WorkSamples() {
  const items = FEATURED.map((slug) => {
    const industry = industries.find((i) => i.slug === slug);
    const site = demoSites.find((d) => d.industry === slug);
    return industry && site ? { industry, site } : null;
  }).filter((v): v is { industry: (typeof industries)[number]; site: (typeof demoSites)[number] } => v !== null);

  return (
    <Section id="samples">
      <SectionHeading
        eyebrow="Work Samples"
        title="実際にお渡しするサイトを、そのまま公開しています"
        description="18業種ぶんのホームページを、納品するのと同じ構成でつくって公開しました。文章・写真の見せ方から、予約チャットや3D表示といった機能まで、そのまま触って確かめられます。"
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ industry, site }, i) => (
          <article
            key={industry.slug}
            className="group panel panel-hover relative flex min-w-0 flex-col overflow-hidden"
            data-reveal
            style={{ "--reveal-delay": `${(i % 3) * 0.08}s` } as React.CSSProperties}
          >
            {/* ミニプレビュー：ブラウザ窓に見立てた飾り（画像を読まないので表示が遅くならない） */}
            <div aria-hidden className="border-b border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-white/20" />
                <span className="size-2 rounded-full bg-white/20" />
                <span className="size-2 rounded-full bg-white/20" />
                <span className="ml-2 min-w-0 flex-1 truncate rounded-md bg-white/[0.06] px-2 py-1 text-[10px] text-slate-500">
                  {`ebisusoft.example / ${industry.slug}`}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <span
                  className={`block h-2.5 w-2/3 rounded-full bg-gradient-to-r ${THEME_SWATCH[site.theme]}`}
                />
                <span className="block h-1.5 w-full rounded-full bg-white/10" />
                <span className="block h-1.5 w-4/5 rounded-full bg-white/10" />
                <span className="mt-2 flex gap-1.5">
                  <span className="h-5 w-16 rounded bg-white/15" />
                  <span className="h-5 w-12 rounded bg-white/[0.07]" />
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-brand/30 bg-brand/10 px-2 py-1 text-[11px] font-bold text-brand-light">
                <Icon name={industry.icon} aria-hidden className="size-3.5" />
                {ja(industry.name)}
              </span>

              <h3 className="mt-3 text-base font-bold text-white">
                <a
                  href={`/demosite/${industry.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="after:absolute after:inset-0 after:content-['']"
                >
                  {ja(site.brand)}
                </a>
              </h3>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-slate-400">
                {ja(site.brandNote)}
              </p>

              <span className="mt-4 inline-flex items-center gap-1.5 border-t border-white/10 pt-4 text-xs font-bold text-slate-500 transition-colors group-hover:text-brand-light">
                <Icon name="external" className="size-3.5" />
                デモサイトを別タブで開く
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* 架空であることの明示。実績と誤解されないよう、一覧リンクより先に置く。 */}
      <p className="mt-8 text-center text-sm leading-relaxed text-slate-500" data-reveal>
        {ja(
          "上記は架空の事業者を想定して制作したサンプルです（社名・住所・電話番号・お客様の声はすべて架空）。実在の事業者の制作事例ではありません。",
        )}
      </p>

      <p className="mt-6 text-center" data-reveal>
        <Link
          prefetch={false}
          href="/showcase"
          className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold-light transition-colors hover:bg-gold/20"
        >
          {ja("18業種すべてのサンプルを見る")}
          <Icon name="arrowRight" className="size-4" />
        </Link>
      </p>
    </Section>
  );
}
