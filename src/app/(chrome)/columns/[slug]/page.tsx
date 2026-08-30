import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/jsonld";
import {
  columns,
  columnsByDate,
  formatDate,
  getColumn,
  tableOfContents,
} from "@/lib/columns";
import { authorDisplayName } from "@/lib/author";
import { siteConfig } from "@/lib/site";
import { pageLinks } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { artFor } from "@/components/ui/PageHeader";
import { Figure } from "@/components/ui/Figure";
import { ButtonLink } from "@/components/ui/Button";
import { ColumnBody } from "@/components/columns/ColumnBody";
import { AuthorBox } from "@/components/columns/AuthorBox";
import { ContactCta } from "@/components/sections/ContactCta";
import { ja } from "@/lib/typography";

// 静的書き出し（GitHub Pages / さくら）に対応するため、存在するスラッグのみ生成する
export const dynamicParams = false;

export function generateStaticParams() {
  return columns.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const column = getColumn(slug);
  if (!column) return {};

  return {
    title: column.metaTitle,
    description: column.description,
    keywords: [...column.keywords],
    alternates: { canonical: `/columns/${column.slug}` },
    openGraph: {
      type: "article",
      url: `${siteConfig.url}/columns/${column.slug}`,
      title: `${column.metaTitle}｜${siteConfig.name}`,
      description: column.description,
      publishedTime: column.published,
      modifiedTime: column.updated,
      authors: [authorDisplayName],
    },
    twitter: {
      card: "summary_large_image",
      title: `${column.metaTitle}｜${siteConfig.name}`,
      description: column.description,
    },
  };
}

export default async function ColumnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const column = getColumn(slug);
  if (!column) notFound();

  const toc = tableOfContents(column);
  const others = columnsByDate.filter((c) => c.slug !== column.slug);
  const related = column.related
    .map((href) => pageLinks.find((p) => p.href === href))
    .filter((p) => p !== undefined);

  const crumbs = [
    { name: "ホーム", path: "/" },
    { name: "コラム", path: "/columns" },
    { name: column.shortTitle, path: `/columns/${column.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: `/columns/${column.slug}`,
            name: `${column.metaTitle}｜${siteConfig.name}`,
            description: column.description,
            datePublished: column.published,
            dateModified: column.updated,
          }),
          breadcrumbJsonLd(crumbs),
          articleJsonLd(column),
          faqJsonLd(column.faqs),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <article>
        {/* 記事ヘッダー。日付と著者を先に出す（誰がいつ書いたか＝E-E-A-T） */}
        {/* 記事ヘッダー。ほかのページの入口（PageHero）と同じ寸法で組む。
            記事タイトルは長いので見出しの上限だけ下げ、余白と図形は共通のまま。
            日付と著者を先に出すのは E-E-A-T のため（誰がいつ書いたか）。 */}
        <header className="studio-hero article-hero">
          <div className="ai-stars" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <i key={i} />
            ))}
          </div>

          <div className="studio-hero-inner">
            <div className="studio-hero-copy">
              <p className="eyebrow">{ja(column.category)}</p>
              <h1>{ja(column.title)}</h1>

              <p className="ai-article-meta">
                <span>{ja(`公開 ${formatDate(column.published)}`)}</span>
                {column.updated !== column.published ? (
                  <time dateTime={column.updated}>{ja(`最終更新 ${formatDate(column.updated)}`)}</time>
                ) : null}
                <span>{ja(`約${column.readMinutes}分`)}</span>
                <span>{ja(`著者：${authorDisplayName}`)}</span>
              </p>

              {/* 結論ファーストの要約。AI Overviews・音声回答の抜き出し先になる部分 */}
              <div className="ai-article-summary panel panel-corners">
                <p className="eyebrow">ANSWER / 結論</p>
                <p className="ai-article-q">{ja(`Q. ${column.question}`)}</p>
                <p className="speakable ai-article-a">{ja(column.answer)}</p>
              </div>
            </div>

            {/* 記事ごとに違う図形（スラッグから決めるので、同じ記事は常に同じ絵） */}
            <Figure name={artFor(column.slug)} className="studio-hero-art" />
          </div>
        </header>

        <Container>
          <div className="grid gap-12 pb-16 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-14">
            <div className="ai-article min-w-0 max-w-3xl">
              {/* 目次（モバイルでは本文の前、PCでは右に固定表示） */}
              <nav aria-label="目次" className="ai-toc panel mb-10 p-5 lg:hidden">
                <p className="eyebrow mb-3">INDEX / 目次</p>
                <ol>
                  {toc.map((h, i) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <span className="min-w-0">{ja(h.text)}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              <ColumnBody blocks={column.body} />

              {/* 記事内FAQ（FAQPage 構造化データと同じ内容） */}
              {column.faqs.length > 0 ? (
                <section aria-labelledby="column-faq" className="mt-16">
                  <h2 id="column-faq">{ja("この記事に関するよくある質問")}</h2>
                  <div className="ai-qa mt-8">
                    {column.faqs.map((f, i) => (
                      <details key={f.question}>
                        <summary>
                          <b>{String(i + 1).padStart(2, "0")}</b>
                          <span className="min-w-0">{ja(f.question)}</span>
                        </summary>
                        <p className="speakable">{ja(f.answer)}</p>
                      </details>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="mt-12">
                <AuthorBox />
              </div>

              {/* 記事から自社ページへの内部リンク（回遊とクロールの両方に効く） */}
              {related.length > 0 ? (
                <section aria-labelledby="column-related" className="mt-12">
                  <p className="eyebrow">Related</p>
                  <h2 id="column-related" className="ai-linklist-title">
                    {ja("この記事に関連するページ")}
                  </h2>
                  <ul className="ai-linklist mt-6">
                    {related.map((p) => (
                      <li key={p.href}>
                        <Link prefetch={false} href={p.href}>
                          <b>{ja(p.title)}</b>
                          <span>{ja(p.description)}</span>
                          <i aria-hidden>↗</i>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            {/* PC用の目次。スクロールに追従させ、長い記事でも現在地を見失わないようにする */}
            <aside className="hidden lg:block">
              <nav aria-label="目次" className="ai-toc panel sticky top-24 p-5">
                <p className="eyebrow mb-3">INDEX / 目次</p>
                <ol>
                  {toc.map((h, i) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`}>
                        {/* 本文の見出しと同じ2桁ゼロ埋めにして、番号で照合できるようにする */}
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <span className="min-w-0">{ja(h.text)}</span>
                      </a>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 border-t border-[rgba(182,126,255,0.2)] pt-5">
                  <ButtonLink href="/contact" className="w-full" withArrow>
                    無料で相談する
                  </ButtonLink>
                </div>
              </nav>
            </aside>
          </div>
        </Container>
      </article>

      {/* 他の記事へ（記事同士を結んでトピックのまとまりを作る） */}
      {others.length > 0 ? (
        <Section bg="deep">
          <div className="ai-heading max-w-3xl" data-reveal>
            <p className="eyebrow">Other Columns</p>
            <h2>{ja("ほかのコラム")}</h2>
          </div>
          <ul className="ai-linklist mt-8">
            {others.map((c) => (
              <li key={c.slug}>
                <Link prefetch={false} href={`/columns/${c.slug}`}>
                  <b>{ja(c.title)}</b>
                  <span>{ja(`${c.answer.slice(0, 70)}…`)}</span>
                  <i aria-hidden>↗</i>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <ContactCta />
    </>
  );
}
