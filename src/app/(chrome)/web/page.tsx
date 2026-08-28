import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  servicesJsonLd,
  webPageJsonLd,
} from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { faqs, webDemoSlugs, pageSummaries } from "@/lib/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageNav } from "@/components/site/PageNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { PageSummary } from "@/components/sections/PageSummary";
import { BusinessLines } from "@/components/sections/BusinessLines";
import { Services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";
import { DemoShowcase } from "@/components/sections/DemoShowcase";
import { Faq } from "@/components/sections/Faq";
import { RelatedPages } from "@/components/sections/RelatedPages";
import { ContactCta } from "@/components/sections/ContactCta";
import { ja } from "@/lib/typography";

const title = "Web制作｜AI開発プロセスでつくるホームページ";
const description =
  "京都市伏見区のエビスソフトのWeb制作。コーポレートサイト・LP・EC・Webアプリまで、生成AIを組み込んだ開発プロセスで従来の約1/3の期間で構築します。SEO・AEO・LLMO、表示速度、公開後の運用まで標準対応。料金は298,000円〜（Web制作の料金。組み込み開発の費用は別途ご相談）。";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "ホームページ制作 京都",
    "Web制作 京都",
    "ホームページ制作 伏見区",
    "AI ホームページ制作",
    "コーポレートサイト制作",
    "LP制作",
    "サイトリニューアル",
    "Web制作 料金",
  ],
  alternates: { canonical: "/web" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/web`,
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
  { name: "Web制作", path: "/web" },
];

const webFaqs = faqs.filter((f) => f.category === "web");

/** ページ内メニュー（ヘッダー直下に貼り付く）。 */
const SECTIONS = [
  { id: "business", label: "事業内容" },
  { id: "ai-process", label: "進め方" },
  { id: "services", label: "サービス" },
  { id: "demos", label: "実装できる機能" },
  { id: "process", label: "制作の流れ" },
  { id: "faq", label: "よくある質問" },
  { id: "contact", label: "お問い合わせ" },
];

/** 「AI開発プロセスで進める」とは具体的に何か（一次情報として明記）。 */
const processPoints = [
  {
    icon: "sparkles" as const,
    title: "構成案は複数を同時に作って比べる",
    body: "ヒアリング内容をその場で構造化し、サイト構成とキーワード設計を複数パターン生成します。1案を練るのではなく、比較して決めるため、初回提案までが最短2営業日です。",
  },
  {
    icon: "code" as const,
    title: "実装はAIエージェントで並列化する",
    body: "ページ単位・機能単位で実装を並行して進め、人がレビューして統合します。この進め方で、コーポレートサイトの制作期間は2〜3か月から3〜4週間になります。",
  },
  {
    icon: "gauge" as const,
    title: "短縮できた時間は品質に戻す",
    body: "短縮した時間は値引きではなく、表示速度・アクセシビリティ・文章の精度に再投資します。当サイト自身がその実装例で、Lighthouse 性能スコア100点で動いています。",
  },
  {
    icon: "shield" as const,
    title: "判断はAIに任せない",
    body: "設計方針、ブランド表現、コードレビュー、公開判断は必ず人が行います。AIに任せるのは作業であって、決定ではありません。",
  },
];

export default function WebPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/web",
            name: `${title}｜${siteConfig.name}`,
            description,
          }),
          breadcrumbJsonLd(crumbs),
          servicesJsonLd("web"),
          howToJsonLd(),
          faqJsonLd(webFaqs),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        art={1}
        eyebrow="Web Production"
        title={
          <>
            <span className="text-gradient">AI活用</span>の
            <br />
            Webサイト制作
          </>
        }
        lead="コーポレートサイト・LP・EC・Webアプリまで対応します。制作期間は従来の約1/3、小規模サイトなら最短5日で公開。SEO・AI検索対策・表示速度は追加オプションではなく、標準で作り込みます。"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/contact" withArrow>
            無料で見積もりを依頼する
          </ButtonLink>
          <ButtonLink href="/request#pricing" variant="ghost">
            料金の目安を見る
          </ButtonLink>
        </div>
      </PageHeader>

      <PageNav items={SECTIONS} />

      <PageSummary items={pageSummaries.web} />

      {/* 主な事業内容（名刺記載のうちWeb・アプリケーション分野） */}
      <BusinessLines
        category="web"
        bg="deep"
        description="Web・業務アプリケーションの分野でお引き受けしている事業です。"
      />

      {/* AI開発プロセスの中身 */}
      <Section id="ai-process">
        <SectionHeading
          eyebrow="How We Build"
          title="速くても品質が落ちない理由"
          description="「AIを使っています」だけでは分からないので、具体的な進め方を開示します。"
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {processPoints.map((p, i) => (
            <article
              key={p.title}
              className="panel panel-hover p-6"
              data-reveal
              style={{ "--reveal-delay": `${(i % 2) * 0.1}s` } as React.CSSProperties}
            >
              <span className="grid size-11 place-items-center rounded-none border border-brand/30 bg-brand/10 text-brand-light">
                <Icon name={p.icon} className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">{ja(p.title)}</h3>
              <p className="speakable mt-2 text-sm leading-relaxed text-slate-400">{ja(p.body)}</p>
            </article>
          ))}
        </div>

        {/* 詳しい解説記事への内部リンク（キーワードをそのままアンカーテキストにする） */}
        <p className="mt-8 text-sm text-slate-400">
          {ja("工程ごとの分担と実測値は、コラム")}
          <Link
            prefetch={false}
            href="/columns/ai-web-seisaku"
            className="mx-1 font-bold text-brand-light underline underline-offset-4 hover:text-brand"
          >
            {ja("AIでWeb制作はどこまでできるのか")}
          </Link>
          {ja("と")}
          <Link
            prefetch={false}
            href="/columns/ai-web-seisaku-kikan-hiyou"
            className="mx-1 font-bold text-brand-light underline underline-offset-4 hover:text-brand"
          >
            {ja("期間と費用はどれだけ変わるか")}
          </Link>
          {ja("で詳しく書いています。")}
        </p>
      </Section>

      {/* 対応できるサービス */}
      <Services
        category="web"
        eyebrow="Service"
        title="Web制作のサービス"
        description="事業の課題に合わせて必要なものだけを選べます。ご相談の段階で不要な機能はお伝えします。"
        bg="deep"
      />

      {/* 実装できる表現・機能のデモ */}
      <DemoShowcase
        slugs={webDemoSlugs}
        eyebrow="Live Demos"
        title="サイトに載せられる機能のデモ"
        description="3DCG・アニメーション・商品カスタマイズ・料金シミュレーター・SNS連携・システム連携。"
      />

      {/* 制作の流れ */}
      <Process />

      <Faq
        items={webFaqs}
        title="Web制作についてのよくある質問"
        description="料金・期間・対応範囲について、いただくことの多い質問です。"
        moreHref="/faq"
      />

      <RelatedPages hrefs={["/request", "/ai", "/columns", "/demo"]} />
      <ContactCta />
    </>
  );
}
