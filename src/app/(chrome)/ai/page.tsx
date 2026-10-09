import { AiAssistant } from "@/components/sections/AiAssistant";
import { socialMetadata } from "@/lib/socialMetadata";
import { CharacterGuide } from "@/components/characters/CharacterGuide";
import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbJsonLd,
  definedTermsJsonLd,
  faqJsonLd,
  servicesJsonLd,
  webPageJsonLd,
} from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { aiDemoSlugs, capabilities, faqs } from "@/lib/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero, FlightList, ModuleBoard, StatRow, ClosingCta } from "@/components/ui/Studio";
import { Faq } from "@/components/sections/Faq";

const title = "AI社長秘書・AI秘書の作成｜業務に合わせたAI開発";
const description =
  "社長専属のAI秘書から、社員の業務を支えるAI秘書まで作成。朝の予定・重要メールの整理、商談準備、指示や宿題の管理を支援します。連携ツールや承認フローの設計からご相談いただけます。AIチャットボット（RAG）やAI機能の開発にも対応。京都市伏見区のエビスソフト。";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "AI活用 Web制作",
    "AI秘書 作成",
    "AI 社長秘書",
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
    ...socialMetadata.openGraph,
    type: "website",
    url: `${siteConfig.url}/ai`,
    title: `${title}｜${siteConfig.name}`,
    description,
  },
  twitter: {
    ...socialMetadata.twitter,
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

/**
 * AIとの関わり方を3段で示す。
 * 「使う側」「作る側」「引用される側」の3つで、AI活用の全体像が言い切れる。
 */
const sides = [
  {
    figure: "ai-parallel" as const,
    en: "BUILD WITH AI",
    title: "AIで、速くつくる。",
    body: "要件整理から実装・テストまでAIを入れて並列化します。人は設計とレビューに集中するので、期間が約1/3になっても質は落ちません。",
    href: "/columns/ai-web-seisaku",
    more: "任せる範囲を読む",
  },
  {
    figure: "ai-rag" as const,
    en: "BUILD THE AI",
    title: "AI機能そのものを、つくる。",
    body: "自社データで答えるチャットボット、音声で応対するAI、行動から選ぶレコメンド。根拠を示し、分からないことは答えない設計を標準にします。",
    href: "/demo/ai-chatbot",
    more: "チャットボットを試す",
  },
  {
    figure: "ai-cited" as const,
    en: "BE FOUND BY AI",
    title: "AIに、引用される。",
    body: "構造化データ、llms.txt、結論から書く本文。AI検索（AEO / LLMO）で「答え」として選ばれる形にサイトを整えます。",
    href: "/columns/ai-kensaku-taisaku-aeo-llmo",
    more: "AI検索対策を読む",
  },
];

const stats = [
  { value: "1/3", label: "従来比の制作期間" },
  { value: "02", label: "初回提案までの営業日" },
  { value: "05", label: "最短の公開日数" },
  { value: "06", label: "AI機能の実動デモ" },
];

export default function AiPage() {
  const modules = aiDemoSlugs
    .map((slug) => capabilities.find((c) => c.slug === slug))
    .filter((c): c is (typeof capabilities)[number] => Boolean(c))
    .map((c) => ({ title: c.title, note: "OPEN DEMO", href: `/demo/${c.slug}` }));

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

      <PageHero
        kicker="AI Utilization"
        figure="ai-hero"
        title={
          <>
            AIを<em>使う側</em>でも、
            <br />
            作る側でも。
          </>
        }
        lead="生成AIで制作期間を約1/3に。社長専属のAI秘書や、業務に合わせたAI機能も開発します。"
        actions={[
          { href: "/contact", label: "AI活用を相談する", primary: true },
          { href: "/demo", label: "動くデモを見る" },
        ]}
        note="初回相談・お見積もり無料／最短2営業日で構成案"
      />

      <CharacterGuide character="chroma" compact standalone>AIって、どこから使えばいい？ まずは「減らしたい手間」や「できたら便利なこと」から、一緒に見つけましょう。</CharacterGuide>

      <AiAssistant />

      <StatRow items={stats} />

      <FlightList label="THREE SIDES OF AI" items={sides} />

      <ModuleBoard
        label="LIVE MODULES"
        title={
          <>
            AI機能の一部を、
            <br />
            実際に試す。
          </>
        }
        lead="カタログではなく、その場で操作して確かめてください。"
        items={modules}
      />

      <Faq
        items={aiFaqs}
        title="AI活用のよくある質問"
        description="品質・仕組み・AI検索対策について、いただくことの多い質問です。"
        moreHref="/faq"
      />

      <ClosingCta
        title={
          <>
            できるかどうかの相談から、
            <br />
            始めてください。
          </>
        }
        lead="仕様が決まっていなくても構いません。最短2営業日で構成案をご提示します。"
        action={{ href: "/contact", label: "無料で相談する", primary: true }}
        secondary={{ href: "/web", label: "Web制作を見る" }}
      />
    </>
  );
}
