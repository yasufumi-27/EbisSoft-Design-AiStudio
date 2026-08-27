import type { Metadata } from "next";
import Link from "next/link";
import { ja } from "@/lib/typography";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, capabilitiesJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { capabilities, planForBand } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";

const title = "できること（実際に動くデモ一覧）";
const description =
  "3DCG・WebGL、Web内アニメーション、AIチャットボット、SNS連携、業務システム連携。エビスソフトができることを、説明ではなく実際に動くデモで公開しています。発注前に実力をご確認ください。";

export const metadata: Metadata = {
  title,
  description,
  // 15本のデモページが受ける検索語を、一覧側でも束ねて持たせる
  keywords: Array.from(new Set(capabilities.flatMap((c) => c.searchTerms))),
  alternates: { canonical: "/demo" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/demo`,
    title: `${title}｜${siteConfig.name}`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${title}｜${siteConfig.name}`,
    description,
  },
};

const crumbs = [
  { name: "ホーム", path: "/" },
  { name: "できること", path: "/demo" },
];

export default function DemoIndexPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/demo",
            name: `${title}｜${siteConfig.name}`,
            description,
            type: "CollectionPage",
          }),
          breadcrumbJsonLd(crumbs),
          capabilitiesJsonLd(),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        eyebrow="Capabilities"
        title={
          <>
            実際に動かせる
            <br />
            <span className="text-gradient">15領域のデモ</span>
          </>
        }
        lead="「できます」という説明だけでは判断できないと思うので、15領域すべてをその場で触れるデモにして公開しています。この15個は、AIを活用して合計約3時間で実装したものです。"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/contact" withArrow>
            無料で相談する
          </ButtonLink>
          <ButtonLink href="/ai" variant="ghost">
            AI活用の仕組みを見る
          </ButtonLink>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          {capabilities.map((c, i) => (
            <article
              key={c.slug}
              className="panel panel-hover panel-corners flex flex-col p-7"
              data-reveal
              style={{ "--reveal-delay": `${(i % 2) * 0.1}s` } as React.CSSProperties}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${c.gradient} text-ink shadow-[0_0_22px_rgba(182, 126, 255,0.25)]`}
                >
                  <Icon name={c.icon} className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {/* 見出しは機能名ではなく、探されている言葉を主語にする */}
                    <h2 className="text-xl leading-snug font-bold text-white">
                      {ja(c.searchTitle)}
                    </h2>
                    <span className="font-display rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-gold-light">
                      実装 {c.buildTime}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-brand-light">
                    {ja(`${c.title}／${c.tagline}`)}
                  </p>
                </div>
              </div>

              {/* 事業インパクトを先に、技術の話は後に */}
              <p className="speakable mt-5 text-base leading-relaxed font-medium text-slate-200">
                {ja(c.impact)}
              </p>

              <ul className="mt-5 space-y-2">
                {c.businessValue.map((v) => (
                  <li key={v.title} className="flex gap-2.5 text-sm text-slate-300">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span className="min-w-0">{ja(v.title)}</span>
                  </li>
                ))}
              </ul>

              {/* 費用と期間を一覧の時点で出す（「制作 費用」で来た人が開かずに判断できるように） */}
              <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>
                  費用の目安{" "}
                  <span className="font-bold text-brand-light">
                    {planForBand(c.priceBand).price}
                  </span>
                </span>
                <span>
                  期間の目安 <span className="font-bold text-slate-200">{ja(c.leadTime)}</span>
                </span>
              </p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {c.tech.slice(0, 4).map((t) => (
                  <li
                    key={t}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-400"
                  >
                    {ja(t)}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <Link
                  prefetch={false}
                  href={`/demo/${c.slug}`}
                  className="btn btn-primary inline-flex h-11 items-center px-6 text-sm"
                >
                  デモを動かす
                  <Icon name="arrowRight" className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section bg="deep">
        <div className="panel panel-corners mx-auto max-w-3xl p-8 text-center sm:p-12" data-reveal>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {ja("ここにない機能もご相談ください")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
            {ja("「こんなことはできますか？」のご相談は、実現方法・概算費用・期間まで無料でお答えします。")}
            {ja("検証用のプロトタイプを数時間〜数日でお出しすることも可能です。")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/contact" size="lg" withArrow>
              できるか相談する
            </ButtonLink>
            <ButtonLink href="/company" size="lg" variant="secondary">
              会社概要を見る
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
