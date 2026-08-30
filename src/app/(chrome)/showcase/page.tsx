import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { industries } from "@/lib/showcaseData";
import { siteConfig, absoluteUrl } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/Studio";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
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

      <PageHero
        kicker="Industry Showcase"
        figure="showcase-hero"
        title={
          <>
            自分の職種で、
            <br />
            <em>見てから</em>決める。
          </>
        }
        lead="18の職種ごとに、ホームページそのものを作って公開しています。中の機能も動きます。"
        actions={[
          { href: "#industries", label: "職種を選ぶ", primary: true },
          { href: "/demo", label: "機能から見る" },
        ]}
        note="職種ごとに違うデザイン案で作っています"
      />

      <Section>
        {/* カードを並べず、1pxの隙間で連結した盤にする（トップの LIVE MODULES と同じ） */}
        <div id="industries" className="ai-shelf scroll-mt-20">
          {industries.map((i, idx) => (
            <article key={i.slug} data-reveal>
              <p className="ai-shelf-meta">
                <b>{String(idx + 1).padStart(2, "0")}</b>
                {i.eyebrow}
              </p>
              <h2>{ja(i.name)}</h2>
              <p className="ai-shelf-lead">{ja(i.tagline)}</p>
              <div className="ai-shelf-actions">
                {/* デモサイトは別タブで開く。prefetch しないので、押した時点で初めて読み込まれる */}
                <Link
                  href={`/demosite/${i.slug}`}
                  prefetch={false}
                  target="_blank"
                  rel="noopener"
                  className="ai-btn ai-btn-solid"
                >
                  デモサイトを開く <span aria-hidden>↗</span>
                </Link>
                <Link prefetch={false} href={`/showcase/${i.slug}`} className="ai-flight-more">
                  機能の説明 <span aria-hidden>↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* 当てはまる職種がないとき。締めと同じ組みで、次の一手だけを置く */}
      <section className="ai-console studio-board">
        <div data-reveal>
          <p className="ai-console-label">Generate</p>
          <h2>
            当てはまる職種が
            <br />
            なければ、その場で。
          </h2>
          <p>
            職種を入力すると、近いテンプレートを選び、3Dの対象・取扱データ・連携先を差し替えたデモサイトをその場で組み立てます。
          </p>
        </div>
        <div data-reveal>
          <p className="ai-generate-note">
            ブラウザの中だけで動くので、送信も待ち時間もありません。
          </p>
          <Link href="/showcase/generate" className="ai-btn ai-btn-solid studio-btn-lg">
            職種を入力してみる <span aria-hidden>↗</span>
          </Link>
        </div>
      </section>

      <RelatedPages hrefs={["/demo", "/web", "/ai", "/request"]} />
    </>
  );
}
