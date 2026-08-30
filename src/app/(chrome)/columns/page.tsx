import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { blogJsonLd, breadcrumbJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { columnsByDate, formatDate } from "@/lib/columns";
import { siteConfig } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/Studio";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Icon } from "@/components/ui/icons";
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
        art={0}
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
        <div className="grid gap-6">
          {columnsByDate.map((c, i) => (
            <article
              key={c.slug}
              className="panel panel-hover panel-corners p-7"
              data-reveal
              style={{ "--reveal-delay": `${i * 0.08}s` } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-none border border-brand/30 bg-brand/10 px-2.5 py-1 font-bold text-brand-light">
                  <Icon name={c.icon} className="size-3.5" />
                  {ja(c.category)}
                </span>
                <time dateTime={c.updated} className="text-slate-500">
                  {ja(`${formatDate(c.updated)} 更新`)}
                </time>
                <span className="text-slate-600">{ja(`約${c.readMinutes}分で読めます`)}</span>
              </div>

              <h2 className="mt-4 text-xl font-bold text-white sm:text-2xl">
                <Link
                  prefetch={false}
                  href={`/columns/${c.slug}`}
                  className="transition-colors hover:text-brand-light"
                >
                  {ja(c.title)}
                </Link>
              </h2>

              {/* 質問と結論を一覧にも出す（AEO：この単位でそのまま引用される） */}
              <p className="mt-4 text-sm font-bold text-slate-200">{ja(`Q. ${c.question}`)}</p>
              <p className="speakable mt-2 text-sm leading-relaxed text-slate-400">
                {ja(c.answer)}
              </p>

              <Link
                prefetch={false}
                href={`/columns/${c.slug}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-light hover:text-brand"
              >
                {ja("続きを読む")}
                <Icon name="arrowRight" className="size-4" />
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
