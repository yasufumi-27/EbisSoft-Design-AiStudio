import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { blogJsonLd, breadcrumbJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { columnsByDate, formatDate } from "@/lib/columns";
import { siteConfig } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/Studio";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { AuthorBox } from "@/components/columns/AuthorBox";
import { RelatedPages } from "@/components/sections/RelatedPages";
import { ja } from "@/lib/typography";

const title = "コラム｜AI活用のWeb制作を実測で解説";
const description =
  "AIでWeb制作はどこまでできるのか、期間と費用はどれだけ変わるのか、AI検索（AEO / LLMO）に引用されるには何が必要か。エビスソフトが自社の制作で計測した数値をもとに解説します。";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "AI Web制作",
    "Web制作 AI",
    "AI ホームページ制作",
    "AI検索 対策",
    "AEO",
    "LLMO",
    "Web制作 費用 期間",
  ],
  alternates: { canonical: "/columns" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/columns`,
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
  { name: "コラム", path: "/columns" },
];

export default function ColumnsIndexPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/columns",
            name: `${title}｜${siteConfig.name}`,
            description,
            type: "CollectionPage",
          }),
          breadcrumbJsonLd(crumbs),
          blogJsonLd(columnsByDate),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHero
        kicker="Columns"
        figure="columns-hero"
        title={
          <>
            一般論ではなく、
            <br />
            <em>実測</em>で書く。
          </>
        }
        lead="自分たちの制作で計測した数値と、このサイトに実装した内容だけを書いています。"
        actions={[
          { href: "/contact", label: "記事の内容を相談する", primary: true },
          { href: "/demo", label: "動くデモを見る" },
        ]}
        note="できないこと・向かないケースも同じだけ書いています"
      />

      <Section>
        {/* カードを積まず、罫線で区切った索引にする。記事本文の見出しと同じ組み */}
        <div className="ai-index">
          {columnsByDate.map((c, i) => (
            <article key={c.slug} data-reveal>
              <p className="ai-index-meta">
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>{ja(c.category)}</span>
                <time dateTime={c.updated}>{ja(`${formatDate(c.updated)} 更新`)}</time>
                <span>{ja(`約${c.readMinutes}分`)}</span>
              </p>
              <h2>
                <Link prefetch={false} href={`/columns/${c.slug}`}>
                  {ja(c.title)}
                </Link>
              </h2>
              {/* 質問と結論は一覧にも出す（AEO：この単位でそのまま引用される） */}
              <p className="speakable ai-index-answer">{ja(c.answer)}</p>
              <Link prefetch={false} href={`/columns/${c.slug}`} className="ai-flight-more">
                続きを読む <span aria-hidden>↗</span>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <AuthorBox />
        </div>
      </Section>

      <RelatedPages hrefs={["/ai", "/web", "/demo", "/request"]} />
    </>
  );
}
