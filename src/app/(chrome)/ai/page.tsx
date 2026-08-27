import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbJsonLd,
  definedTermsJsonLd,
  faqJsonLd,
  servicesJsonLd,
  webPageJsonLd,
} from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { aiDemoSlugs, faqs, aiImpacts, pageSummaries } from "@/lib/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageNav } from "@/components/site/PageNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { PageSummary } from "@/components/sections/PageSummary";
import { AiPower } from "@/components/sections/AiPower";
import { AiSearch } from "@/components/sections/AiSearch";
import { Services } from "@/components/sections/Services";
import { DemoShowcase } from "@/components/sections/DemoShowcase";
import { Faq } from "@/components/sections/Faq";
import { RelatedPages } from "@/components/sections/RelatedPages";
import { ContactCta } from "@/components/sections/ContactCta";
import { ja } from "@/lib/typography";

const title = "AI活用｜生成AIによる開発とAI機能の受託";
const description =
  "エビスソフトのAI活用について。生成AIを制作フロー全体に組み込んで期間を約1/3に短縮し、AIチャットボット（RAG）・音声AI・AIエージェント対応などのAI機能開発も手がけます。AI検索（AEO / LLMO）最適化にも対応。京都市伏見区。";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "AI活用 Web制作",
    "生成AI 開発",
    "AIチャットボット 開発",
    "RAG 構築",
    "AI エージェント",
    "AEO",
    "LLMO",
    "AI開発 京都",
  ],
  alternates: { canonical: "/ai" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/ai`,
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
  { name: "AI活用", path: "/ai" },
];

const aiFaqs = faqs.filter((f) => f.category === "ai");

/** ページ内メニュー（ヘッダー直下に貼り付く）。 */
const SECTIONS = [
  { id: "two-sides", label: "2つの側面" },
  { id: "ai-power", label: "AIと人の分担" },
  { id: "demos", label: "AI機能のデモ" },
  { id: "ai-services", label: "サービス" },
  { id: "ai-search", label: "AI検索対策" },
  { id: "faq", label: "よくある質問" },
  { id: "contact", label: "お問い合わせ" },
];

/** AIを「使う側」と「作る側」の両面を、結論ファーストで示す要点。 */
const twoSides = [
  {
    icon: "bolt" as const,
    label: "AIを使う側",
    title: "開発プロセスにAIを組み込む",
    body: "要件整理・構成案・コピー・実装・テストの各工程にAIエージェントを入れ、作業を並列化します。人は設計判断とレビューに集中するため、期間は短くなっても品質は落ちません。",
    facts: aiImpacts.slice(0, 3).map((i) => `${i.label}：${i.before} → ${i.after}`),
  },
  {
    icon: "bot" as const,
    label: "AIを作る側",
    title: "AI機能そのものを納品する",
    body: "自社データを知識源にしたRAG構成のチャットボット、音声で応対するAI、行動から推薦するレコメンドなど、AI機能を実装して納品します。根拠を示し、分からないことは答えない設計を標準にします。",
    facts: [
      "RAG（検索拡張生成）で根拠つき回答",
      "回答できない質問は問い合わせへ誘導",
      "社内文書・FAQ・商品データを知識源に",
    ],
  },
];

export default function AiPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/ai",
            name: `${title}｜${siteConfig.name}`,
            description,
          }),
          breadcrumbJsonLd(crumbs),
          servicesJsonLd("ai"),
          definedTermsJsonLd("/ai"),
          faqJsonLd(aiFaqs),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        eyebrow="AI Utilization"
        title={
          <>
            <span className="text-gradient">AI活用</span>の
            <br />
            ソフトウェア開発
          </>
        }
        lead="生成AIを制作フローに組み込んで期間を約1/3に短縮し、納品物としてもAIチャットボットやAI機能を開発します。両方を自分たちでやっているからこそ、AIで何ができて何ができないかを具体的にお話しできます。"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/contact" withArrow>
            AI活用について相談する
          </ButtonLink>
          <ButtonLink href="/demo/ai-chatbot" variant="ghost">
            AIチャットボットのデモを見る
          </ButtonLink>
        </div>
      </PageHeader>

      <PageNav items={SECTIONS} />

      <PageSummary items={pageSummaries.ai} />

      {/* 使う側 / 作る側（このページの結論） */}
      <Section id="two-sides">
        <SectionHeading
          eyebrow="Two Sides"
          title="AI活用の2つの側面"
          description="AIで速くつくることと、AI機能そのものをつくること。エビスソフトはその両方を手がけています。"
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {twoSides.map((s, i) => (
            <article
              key={s.title}
              className="panel panel-hover panel-corners flex flex-col p-7"
              data-reveal
              style={{ "--reveal-delay": `${i * 0.1}s` } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-light shadow-[0_0_20px_rgba(182, 126, 255,0.2)]">
                  <Icon name={s.icon} className="size-6" />
                </span>
                <span className="font-display rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-bold tracking-wider text-gold-light">
                  {s.label}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">{ja(s.title)}</h3>
              <p className="speakable mt-3 flex-1 text-sm leading-relaxed text-slate-400">
                {ja(s.body)}
              </p>
              <ul className="mt-5 space-y-2 border-t border-white/10 pt-5">
                {s.facts.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span className="min-w-0">{ja(f)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* 詳しい解説記事への内部リンク（キーワードをそのままアンカーテキストにする） */}
        <p className="mt-8 text-sm text-slate-400">
          {ja("AIに任せられる工程と人が判断する工程の境界は、コラム")}
          <Link
            prefetch={false}
            href="/columns/ai-web-seisaku"
            className="mx-1 font-bold text-brand-light underline underline-offset-4 hover:text-brand"
          >
            {ja("AIでWeb制作はどこまでできるのか")}
          </Link>
          {ja("にまとめています。AI検索対策の実装内容は")}
          <Link
            prefetch={false}
            href="/columns/ai-kensaku-taisaku-aeo-llmo"
            className="mx-1 font-bold text-brand-light underline underline-offset-4 hover:text-brand"
          >
            {ja("AI検索に引用されるサイトの作り方")}
          </Link>
          {ja("をご覧ください。")}
        </p>
      </Section>

      {/* AIをどう使って速くしているか（工程ごとの分担・一次情報） */}
      <AiPower />

      {/* AI機能そのもののデモ */}
      <DemoShowcase
        slugs={aiDemoSlugs}
        eyebrow="AI Demos"
        title="AI機能のデモ"
        description="チャットボット・音声AI・AIエージェント・レコメンド・行動解析。すべてこのサイト上で実際に動きます。"
      />

      {/* AI関連サービス */}
      <Services
        category="ai"
        eyebrow="AI Services"
        title="AI関連のサービス"
        description="AI機能の開発から、AIに引用されるサイト設計まで。単体でのご依頼にも対応します。"
        id="ai-services"
        bg="deep"
      />

      {/* AI検索最適化（AEO / LLMO） */}
      <AiSearch />

      <Faq
        items={aiFaqs}
        title="AI活用についてのよくある質問"
        description="AIの品質・仕組み・AI検索対策について、いただくことの多い質問です。"
        moreHref="/faq"
      />

      <RelatedPages hrefs={["/web", "/columns", "/demo", "/request"]} />
      <ContactCta />
    </>
  );
}
