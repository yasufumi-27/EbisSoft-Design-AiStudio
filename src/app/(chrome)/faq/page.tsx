import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { faqs, type FaqCategory } from "@/lib/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/ui/Studio";
import { Section, SectionHeading } from "@/components/ui/Section";
import { RelatedPages } from "@/components/sections/RelatedPages";
import { ContactCta } from "@/components/sections/ContactCta";
import { ja } from "@/lib/typography";

const title = "よくある質問";
const description =
  "エビスソフトへのご相談前によくいただく質問と回答。AI活用・Web制作の期間と料金、AIチャットボット、組み込み開発の受託範囲、対応エリアについてまとめています。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/faq`,
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
  { name: "よくある質問", path: "/faq" },
];

/** 表示順とカテゴリ見出し（AI活用 → Web制作 → 組み込み の優先度に合わせる）。 */
const GROUPS: { category: FaqCategory; eyebrow: string; title: string; description: string }[] = [
  {
    category: "ai",
    eyebrow: "AI",
    title: "AI活用について",
    description: "AIの使い方、品質、AIチャットボット、AI検索対策（AEO / LLMO）について。",
  },
  {
    category: "web",
    eyebrow: "Web",
    title: "Web制作について",
    description: "対応できる表現・機能、公開後の運用について。",
  },
  {
    category: "embedded",
    eyebrow: "Embedded",
    title: "組み込み開発について",
    description: "ファームウェア開発の受託範囲、IoTのWeb連携について。",
  },
  {
    category: "price",
    eyebrow: "Price",
    title: "料金について",
    description: "費用の目安とお見積もりの進め方。",
  },
  {
    category: "company",
    eyebrow: "Company",
    title: "会社・対応エリアについて",
    description: "所在地、対応できる地域、所属団体について。",
  },
];

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/faq",
            name: `${title}｜${siteConfig.name}`,
            description,
            type: "CollectionPage",
          }),
          breadcrumbJsonLd(crumbs),
          // 全件を1つの FAQPage として出力（各詳細ページは該当カテゴリのみ）
          faqJsonLd(),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHero
        kicker="FAQ"
        figure="faq-hero"
        title={
          <>
            聞かれることは、
            <br />
            だいたい<em>同じ</em>。
          </>
        }
        lead="料金・期間・対応範囲について、事前によくいただく質問をまとめました。"
        actions={[
          { href: "/contact", label: "ここにない質問をする", primary: true },
          { href: "/request", label: "料金の目安を見る" },
        ]}
      />

      {GROUPS.map((group, gi) => {
        const items = faqs.filter((f) => f.category === group.category);
        if (items.length === 0) return null;
        return (
          <Section
            key={group.category}
            id={`faq-${group.category}`}
            bg={gi % 2 === 1 ? "deep" : "transparent"}
          >
            <SectionHeading
              eyebrow={group.eyebrow}
              title={group.title}
              description={group.description}
              align="left"
            />
            <div
              className="panel mt-10 divide-y divide-brand/20 overflow-hidden"
              data-reveal
            >
              {items.map((faq) => (
                <details
                  key={faq.question}
                  className="group px-6 transition-colors open:bg-white/[0.03] [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-slate-100 transition-colors hover:text-brand-light">
                    <span className="min-w-0">{ja(faq.question)}</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="shrink-0 text-brand transition-transform duration-300 group-open:rotate-180"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="speakable pb-5 text-sm leading-relaxed text-slate-400">
                    {ja(faq.answer)}
                  </p>
                </details>
              ))}
            </div>
          </Section>
        );
      })}

      <RelatedPages hrefs={["/request", "/ai", "/web", "/embedded"]} />
      <ContactCta />
    </>
  );
}
