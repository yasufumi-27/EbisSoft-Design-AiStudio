import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { industries } from "@/lib/showcaseData";
import { siteConfig, absoluteUrl } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { RelatedPages } from "@/components/sections/RelatedPages";
import { ja } from "@/lib/typography";

const title = "デモサイト｜職種別に「この機能をこう使えます」";
const description =
  "小売・飲食・クリニック・製造・不動産など18の職種ごとに、Webサイトへ実装できる機能の使いどころを、実際に動くデモつきで紹介します。当てはまる職種がない場合は、入力するとその場でデモサイトを組み立てます。";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "業種別 Web制作",
    "ホームページ 機能 事例",
    "業種別 デモ",
    "AI Web制作 事例",
    "Webサイト 機能 活用",
  ],
  alternates: { canonical: "/showcase" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/showcase`,
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
  { name: "デモサイト", path: "/showcase" },
];

/** 職種一覧の構造化データ（どんな職種を扱っているかをAIにも伝える） */
function industryListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${siteConfig.name}の職種別デモサイト`,
    description,
    itemListElement: industries.map((i, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: `${i.name}向けのデモサイト`,
      url: absoluteUrl(`/showcase/${i.slug}`),
    })),
  };
}

export default function ShowcaseIndexPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/showcase",
            name: `${title}｜${siteConfig.name}`,
            description,
            type: "CollectionPage",
          }),
          breadcrumbJsonLd(crumbs),
          industryListJsonLd(),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        eyebrow="Industry Showcase"
        title={
          <>
            <span className="text-gradient">あなたの職種</span>なら、
            <br />
            この機能をこう使えます
          </>
        }
        lead="機能の一覧を見ても、自分の商売でどう使えるかは分かりません。ここでは職種を入口にして、使いどころと実際に動くデモを並べています。デモは起動ボタンを押したときに読み込むので、開いただけでは重くなりません。"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/showcase/generate" withArrow>
            職種を入力して自動で組み立てる
          </ButtonLink>
          <ButtonLink href="/demo" variant="ghost">
            機能ごとのデモを見る
          </ButtonLink>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((i, idx) => (
            <article
              key={i.slug}
              className="panel panel-corners flex flex-col p-6"
              data-reveal
              style={{ "--reveal-delay": `${(idx % 3) * 0.08}s` } as React.CSSProperties}
            >
              <span className="grid size-11 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-light">
                <Icon name={i.icon} className="size-5" />
              </span>
              <span className="font-display mt-4 text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                {i.eyebrow}
              </span>
              <h2 className="mt-1 text-lg font-bold text-white">{ja(i.name)}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{ja(i.tagline)}</p>

              {/* デモサイトは別タブで開く（本サイトの表示に影響させないため）。
                  prefetch しないので、押した時点で初めて読み込まれます。 */}
              <a
                href={`/demosite/${i.slug}`}
                target="_blank"
                rel="noopener"
                className="btn btn-primary mt-5 h-10 justify-center px-4 text-sm"
              >
                {ja("デモサイトを開く")}
                <Icon name="external" className="size-3.5" />
              </a>
              <Link
                prefetch={false}
                href={`/showcase/${i.slug}`}
                className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-light hover:text-white"
              >
                {ja("使える機能の説明を見る")}
                <Icon name="arrowRight" className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </Section>

      <Section bg="deep">
        <div className="panel panel-corners mx-auto max-w-3xl p-8 text-center sm:p-12" data-reveal>
          <span className="grid mx-auto size-12 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold-light">
            <Icon name="sparkles" className="size-6" />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
            {ja("当てはまる職種がない場合は、その場で組み立てます")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
            {ja(
              "職種を入力すると、いちばん近いテンプレートを選び、3Dで表示する対象・取扱データ・連携先を入力に合わせて差し替えたデモサイトをその場で作ります。ブラウザの中だけで動くので、送信も待ち時間もありません。",
            )}
          </p>
          <div className="mt-8">
            <ButtonLink href="/showcase/generate" size="lg" withArrow>
              職種を入力してみる
            </ButtonLink>
          </div>
        </div>
      </Section>

      <RelatedPages hrefs={["/demo", "/web", "/ai", "/request"]} />
    </>
  );
}
