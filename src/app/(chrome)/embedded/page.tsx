import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, servicesJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import {
  embeddedDomains,
  embeddedOptions,
  embeddedSteps,
  embeddedStrengths,
  faqs,
  pageSummaries,
} from "@/lib/content";
import Link from "next/link";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageNav } from "@/components/site/PageNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { PageSummary } from "@/components/sections/PageSummary";
import { EmbeddedPricingNote } from "@/components/sections/EmbeddedPricingNote";
import { BusinessLines } from "@/components/sections/BusinessLines";
import { Faq } from "@/components/sections/Faq";
import { RelatedPages } from "@/components/sections/RelatedPages";
import { ContactCta } from "@/components/sections/ContactCta";
import { ja } from "@/lib/typography";

const title = "組み込み開発｜ファームウェア・IoTの受託";
const description =
  "京都市伏見区のエビスソフトの組み込みソフトウェア開発。ルネサス RH850・RX・RL78、ARM Cortex-M・STM32・ESP32などのマイコン向けファームウェアをC / C++で受託開発します。新規開発から既存コードの改修・移植、通信の実装、実機検証まで対応。ご希望に応じてAIを活用した開発プロセスやクラウド連携にも広げられます。技術調査のみのご相談も歓迎です。組み込み開発の費用は別途ご相談で、Web制作の料金プランは適用されません。";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "組み込み開発 受託",
    "組み込みソフトウェア開発 京都",
    "ファームウェア開発 委託",
    "マイコン 開発 外注",
    "組み込み 業務委託",
    "ファームウェア 改修",
    "ルネサス マイコン 開発",
    "RH850 開発",
    "RX マイコン 開発",
    "RL78 開発",
    "STM32 開発",
    "ESP32 開発",
    "BLE 開発",
    "RTOS 開発",
    "IoT 開発 京都",
    "組み込み開発 費用",
    "ファームウェア開発 見積もり",
  ],
  alternates: { canonical: "/embedded" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/embedded`,
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
  { name: "組み込み開発", path: "/embedded" },
];

const embeddedFaqs = faqs.filter((f) => f.category === "embedded");

/** ページ内メニュー（ヘッダー直下に貼り付く）。 */
const SECTIONS = [
  { id: "business", label: "事業内容" },
  { id: "domains", label: "対応領域" },
  { id: "options", label: "任意で追加" },
  { id: "entry-points", label: "相談の例" },
  { id: "strengths", label: "強み" },
  { id: "pricing", label: "費用" },
  { id: "process", label: "進め方" },
  { id: "faq", label: "よくある質問" },
  { id: "contact", label: "お問い合わせ" },
];

/** 「こんな相談から始められます」の具体例。依頼のハードルを下げるための一次情報。 */
const entryPoints = [
  "前任者が辞めてしまい、既存ファームウェアの改修ができず困っている",
  "既存の装置にBLEを追加して、スマホから操作できるようにしたい",
  "廃番になったマイコンから、別のマイコンへ移植したい",
  "試作品を動かすところまで（PoC）を、まず短期間で確かめたい",
  "手が足りないので、機能単位でファームウェアの実装を任せたい",
  "センサーの測定値をクラウドに上げて、ブラウザでグラフにしたい（任意のオプション）",
];

export default function EmbeddedPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/embedded",
            name: `${title}｜${siteConfig.name}`,
            description,
          }),
          breadcrumbJsonLd(crumbs),
          servicesJsonLd("embedded"),
          faqJsonLd(embeddedFaqs),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        eyebrow="Embedded Systems"
        title={
          <>
            マイコンの
            <br />
            <span className="text-gradient">組み込みソフトウェア</span>開発
          </>
        }
        lead="マイコンのファームウェア開発を受託します。C / C++での新規開発、既存コードの改修・移植、センサー制御、省電力設計、BLE・Wi-Fi などの通信実装、実機での検証まで。組み込み単体のご依頼が中心で、技術調査だけのご相談も歓迎です。費用は内容によって大きく変わるため、別途ご相談とさせていただいています。"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/contact" withArrow>
            組み込み開発を相談する
          </ButtonLink>
          <ButtonLink href="/embedded#options" variant="ghost">
            AI活用・Web連携もできます
          </ButtonLink>
        </div>
      </PageHeader>

      <PageNav items={SECTIONS} />

      <PageSummary items={pageSummaries.embedded} />

      {/* 主な事業内容（名刺記載のうち組み込み分野） */}
      <BusinessLines
        category="embedded"
        description="組み込み分野でお引き受けしている事業です。開発だけでなく、技術者向けの講習もお受けしています。"
      />

      {/* 対応領域 */}
      <Section id="domains" bg="deep">
        <SectionHeading
          eyebrow="Scope"
          title="お引き受けできる領域"
          description="「どこまで頼めるのか」が分かるよう、具体的な作業単位で挙げています。"
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {embeddedDomains.map((d, i) => (
            <article
              key={d.title}
              className="panel panel-hover panel-corners flex flex-col p-7"
              data-reveal
              style={{ "--reveal-delay": `${(i % 2) * 0.1}s` } as React.CSSProperties}
            >
              <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-brand/80 to-accent/80 text-ink shadow-[0_0_22px_rgba(182, 126, 255,0.35)]">
                <Icon name={d.icon} className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-bold text-white">{ja(d.title)}</h3>
              <p className="speakable mt-3 text-sm leading-relaxed text-slate-400">
                {ja(d.description)}
              </p>
              <ul className="mt-5 space-y-2 border-t border-white/10 pt-5">
                {d.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span className="min-w-0">{ja(item)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      {/* 必要なときだけ広げられる範囲（AI活用・Web連携はあくまで任意） */}
      <Section id="options">
        <SectionHeading
          eyebrow="Optional"
          title="任意で追加できる範囲"
          description="以下はすべて任意です。組み込み単体で完結するご依頼が基本で、要らない場合は含めません。"
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {embeddedOptions.map((o, i) => (
            <article
              key={o.title}
              className="panel panel-hover flex flex-col p-6"
              data-reveal
              style={{ "--reveal-delay": `${(i % 3) * 0.1}s` } as React.CSSProperties}
            >
              <span className="grid size-11 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold-light">
                <Icon name={o.icon} className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">{ja(o.title)}</h3>
              <p className="speakable mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                {ja(o.description)}
              </p>
              <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                {o.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span className="min-w-0">{ja(item)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500" data-reveal>
          AI活用の詳細は
          <Link prefetch={false} href="/ai" className="mx-1 text-brand-light underline-offset-4 hover:underline">
            AI活用のページ
          </Link>
          {ja("をご覧ください。")}
        </p>
      </Section>

      {/* 依頼のきっかけ（相談のハードルを下げる） */}
      <Section id="entry-points" bg="deep">
        <SectionHeading
          eyebrow="Where To Start"
          title="こんな相談から始められます"
          description="仕様書がなくても、途中まで作ったものがあっても構いません。"
        />
        <ul className="mx-auto mt-12 max-w-3xl space-y-3">
          {entryPoints.map((e, i) => (
            <li
              key={e}
              className="panel flex items-start gap-3 p-5 text-slate-200"
              data-reveal
              style={{ "--reveal-delay": `${i * 0.06}s` } as React.CSSProperties}
            >
              <Icon name="chat" className="mt-0.5 size-5 shrink-0 text-brand-light" />
              <span className="speakable text-sm leading-relaxed">{ja(e)}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 選ばれる理由 */}
      <Section id="strengths">
        <SectionHeading
          eyebrow="Why Us"
          title="組み込み開発の強み"
          description="機器の中で完結する開発をきちんとやり切ったうえで、必要になれば外側まで伸ばせます。"
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {embeddedStrengths.map((s, i) => (
            <div
              key={s.title}
              className="panel panel-hover panel-corners p-6"
              data-reveal
              style={{ "--reveal-delay": `${i * 0.1}s` } as React.CSSProperties}
            >
              <span className="grid size-12 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-light shadow-[0_0_20px_rgba(182, 126, 255,0.2)]">
                <Icon name={s.icon} className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-white">{ja(s.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{ja(s.description)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 費用（定額プランは設けず、別途相談であることを強く明示する） */}
      <Section id="pricing" bg="deep">
        <SectionHeading
          eyebrow="Pricing"
          title="費用について"
          description="組み込み開発の費用は別途ご相談です。金額の決まり方は先に開示します。"
        />
        <div className="mx-auto mt-12 max-w-3xl">
          <EmbeddedPricingNote variant="embedded" />
          <div className="panel mt-6 p-6" data-reveal>
            <h3 className="text-base font-bold text-white">お見積もりで見る主な要素</h3>
            <ul className="mt-4 space-y-2">
              {[
                "マイコン・開発環境（ルネサス RH850 / RX / RL78、ARM Cortex-M / STM32 / ESP32 など）",
                "新規開発か、既存ファームウェアの改修・移植か",
                "通信の有無と種類（BLE / Wi-Fi / MQTT / UART / I2C / SPI）",
                "実機検証の範囲（評価ボードのみ／実機／長時間試験）",
                "納品物（ソースコード、設計資料、試験結果報告）",
                "AI活用・クラウド／Web連携を追加するかどうか（任意）",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <Icon name="check" className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span className="min-w-0">{ja(f)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-slate-500">
              {ja(
                "作業単位（機能ごと・工程ごと）での切り出しにも対応します。まず調査だけ、まずPoCだけ、という小さな範囲からのお見積もりも可能です。",
              )}
            </p>
          </div>
        </div>
      </Section>

      {/* 進め方 */}
      <Section id="process">
        <SectionHeading
          eyebrow="Process"
          title="ご相談から納品までの流れ"
          description="実現性の確認を先に行い、難しい点は着手前にお伝えします。"
        />
        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {embeddedSteps.map((step, i) => (
            <li
              key={step.title}
              className="panel panel-hover relative p-6"
              data-reveal
              style={{ "--reveal-delay": `${(i % 3) * 0.1}s` } as React.CSSProperties}
            >
              <div className="flex items-center gap-4">
                <span className="font-display grid size-11 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/10 text-base font-bold text-brand-light shadow-[0_0_18px_rgba(182, 126, 255,0.25)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-bold text-white">{ja(step.title)}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{ja(step.description)}</p>
            </li>
          ))}
        </ol>

        {/* 対応範囲の限界を明示（誠実さ＝E-E-A-T の Trust） */}
        <details className="demo-note mt-10" data-reveal>
          <summary>お引き受けできない範囲について</summary>
          <p className="speakable mt-3 text-sm leading-relaxed text-slate-400">
            {ja(
              "電気回路・基板の設計、筐体の機構設計、量産管理、電波法・安全規格などの認証取得代行は行っていません。ソフトウェア（ファームウェア・通信・クラウド・Web）に専念し、ハードウェア側は貴社または専門の協力先と分担する形をご提案します。対応できない場合は、その旨を最初にお伝えします。",
            )}
          </p>
        </details>
      </Section>

      <Faq
        items={embeddedFaqs}
        title="組み込み開発についてのよくある質問"
        description="受託範囲や進め方について、いただくことの多い質問です。"
        moreHref="/faq"
        bg="deep"
      />

      <RelatedPages hrefs={["/request", "/ai", "/web"]} />
      <ContactCta />
    </>
  );
}
