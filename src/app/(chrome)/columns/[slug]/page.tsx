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
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
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
        <header className="ai-article-head">
          <div className="ai-stars" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <i key={i} />
            ))}
          </div>
          <Container>
            <div className="max-w-3xl">
              <div className="ai-article-meta">
                <span className="ai-article-cat">
                  <Icon name={column.icon} className="size-3.5" />
                  {ja(column.category)}
                </span>
                <span>{ja(`公開 ${formatDate(column.published)}`)}</span>
                {column.updated !== column.published ? (
                  <time dateTime={column.updated}>{ja(`最終更新 ${formatDate(column.updated)}`)}</time>
                ) : null}
                <span>{ja(`約${column.readMinutes}分`)}</span>
                <span>{ja(`著者：${authorDisplayName}`)}</span>
              </div>

              <h1>{ja(column.title)}</h1>

              {/* 結論ファーストの要約。AI Overviews・音声回答の抜き出し先になる部分 */}
              <div className="ai-article-summary panel panel-corners mt-8 p-6">
                <p className="eyebrow">ANSWER / 結論</p>
                <p className="ai-article-q">{ja(`Q. ${column.question}`)}</p>
                <p className="speakable ai-article-a">{ja(column.answer)}</p>
              </div>
            </div>
          </Container>
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
                  <div className="mt-6 space-y-4">
                    {column.faqs.map((f) => (
                      <details key={f.question} className="panel group p-5">
                        <summary className="flex cursor-pointer items-start gap-3 font-bold text-white marker:content-none">
                          <Icon
                            name="chat"
                            className="mt-0.5 size-4 shrink-0 text-brand group-open:text-gold"
                          />
                          <span className="min-w-0">{ja(f.question)}</span>
                        </summary>
                        <p className="speakable mt-3 pl-7 text-sm leading-relaxed text-slate-400">
                          {ja(f.answer)}
                        </p>
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
                  <h2 id="column-related" className="eyebrow">
                    {ja("この記事に関連するページ")}
                  </h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {related.map((p) => (
                      <Link
                        prefetch={false}
                        key={p.href}
                        href={p.href}
                        className="panel panel-hover flex items-start gap-3 p-5"
                      >
                        <Icon name={p.icon} className="mt-0.5 size-5 shrink-0 text-brand" />
                        <span className="min-w-0">
                          <span className="block font-bold text-white">{ja(p.title)}</span>
                          <span className="mt-1 block text-sm text-slate-400">
                            {ja(p.description)}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {others.map((c) => (
              <Link
                prefetch={false}
                key={c.slug}
                href={`/columns/${c.slug}`}
                className="panel panel-hover p-6"
                data-reveal
              >
                <span className="text-xs text-brand-light">{ja(c.category)}</span>
                <span className="mt-2 block font-bold text-white">{ja(c.title)}</span>
                <span className="mt-2 block text-sm leading-relaxed text-slate-400">
                  {ja(c.answer.slice(0, 80))}…
                </span>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      <ContactCta />
    </>
  );
}
