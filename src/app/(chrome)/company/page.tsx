import type { Metadata } from "next";
import Link from "next/link";
import { ja } from "@/lib/typography";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { author } from "@/lib/author";
import { businessLines, services, techStack } from "@/lib/content";
import { Section, SectionHeading } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { BusinessLines } from "@/components/sections/BusinessLines";
import { RelatedPages } from "@/components/sections/RelatedPages";
import { ContactCta } from "@/components/sections/ContactCta";

const title = "会社概要";
const description = `${siteConfig.legalName}の会社概要です。所在地は${siteConfig.contact.address.region}${siteConfig.contact.address.locality}、京都商工会議所所属。AIを開発プロセスにも成果物にも使うソフトウェア開発事業者として、Web制作と組み込みソフトウェア開発の両方を手がけています。`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/company" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/company`,
    title: `${title}｜${siteConfig.name}`,
    description,
  },
};

const crumbs = [
  { name: "ホーム", path: "/" },
  { name: "会社概要", path: "/company" },
];

const { contact } = siteConfig;
const fullAddress = `〒${contact.address.postalCode} ${contact.address.region}${contact.address.locality}${contact.address.street}`;

/** 会社概要テーブルの項目（NAPは site.ts の単一情報源から生成し、表記ゆれを作らない） */
const profile: { label: string; value: string }[] = [
  { label: "名称", value: siteConfig.legalName },
  // 代表者名は E-E-A-T（誰が事業をしているか）の基本情報。author.ts を単一情報源にする
  { label: "代表", value: `${author.personName}（${author.personNameRomaji}）` },
  { label: "所在地", value: fullAddress },
  { label: "設立", value: "2001年4月" },
  {
    // 名刺記載の事業内容（businessLines）を正とし、表記ゆれを作らない
    label: "事業内容",
    value: businessLines.map((b) => b.title).join("／"),
  },
  { label: "所属団体", value: siteConfig.memberOf.map((m) => m.name).join("／") },
  { label: "対応エリア", value: siteConfig.areaServed },
];

/** 私たちの姿勢（E-E-A-T：Trust。約束できることを具体的に明文化） */
const principles = [
  {
    icon: "sparkles" as const,
    title: "AIに任せるのは作業、判断は人が行います",
    body: "解析・実装・テストなど量産できる作業にはAIを使い倒します。一方で設計方針、コードレビュー、納品可否の判断は必ず人が行います。Webでも組み込みでも、この線引きは変えません。",
  },
  {
    icon: "bolt" as const,
    title: "短縮できた時間は品質に回します",
    body: "AIで短縮した時間はそのまま利益にせず、品質・検証・文章の精度に再投資します。速いだけの安い納品物は作りません。",
  },
  {
    icon: "check" as const,
    title: "できないことも正直にお伝えします",
    body: "本サイトのデモにも、どこまでが実装かを明記しています。組み込みでもお引き受けできない範囲を先に開示します。受注のために「できます」と言って後から詰まる進め方はしません。",
  },
  {
    icon: "gauge" as const,
    title: "品質は計測結果でご確認いただけます",
    body: "Webは Lighthouse の計測結果を、組み込みは実機での検証結果とテストを添えてお渡しします。主観ではなく記録で確認いただけます。",
  },
];

/**
 * 私たちの定義（AI活用を軸にした事業の説明）。
 * Web制作・組み込みは「AIをどう使うか」の適用先として並列に置く。
 */
const aiIdentity = [
  {
    icon: "bolt" as const,
    label: "プロセスに使う",
    title: "つくり方そのものをAIで変える",
    body: "要件整理、コード生成、既存コードの解析、テスト生成、ドキュメント作成にAIエージェントを組み込みます。Web制作では期間が従来の約1/3になり、組み込みでは既存ファームウェアの読み解きや検証の手間を大きく減らせます。",
  },
  {
    icon: "bot" as const,
    label: "成果物に使う",
    title: "AI機能そのものを開発して納める",
    body: "自社データを知識源にするRAGチャットボット、音声AI、レコメンド、センサーデータの異常検知など、AIを組み込んだ機能を実装します。作る側の経験があるため、精度・コスト・限界を具体的にお話しできます。",
  },
  {
    icon: "search" as const,
    label: "見つけられ方に使う",
    title: "AIに引用される状態をつくる",
    body: "AI検索（AI Overviews・ChatGPTなど）から引用・推薦されるためのAEO / LLMOを、制作の最初から設計に含めます。このサイト自体がその実装例です。",
  },
];

export default function CompanyPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/company",
            name: `${title}｜${siteConfig.name}`,
            description,
            type: "AboutPage",
          }),
          breadcrumbJsonLd(crumbs),
          // 事業者（Organization）は layout.tsx で全ページ共通に出力済み
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        art={2}
        eyebrow="Company"
        title={
          <>
            {siteConfig.contact.address.locality}の
            <br />
            <span className="text-gradient">AI</span>ソフトウェア開発事業者
          </>
        }
        lead={`${contact.address.locality}を拠点とするソフトウェア開発事業者です（京都商工会議所所属）。AIを開発プロセスと成果物の両方に使うことを、事業の軸にしています。適用先はWebサイト制作と組み込みソフトウェア開発の2つです。分野で分けるのではなく、AIで何をどこまで速く・確かにできるかで考えます。`}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/contact" withArrow>
            お問い合わせ
          </ButtonLink>
          <ButtonLink href="/demo" variant="ghost">
            できることを見る
          </ButtonLink>
        </div>
      </PageHeader>

      {/* ------------- 会社概要 ------------- */}
      <Section id="profile">
        <SectionHeading
          eyebrow="Profile"
          title="基本情報"
          description="お取引・お問い合わせの際にご確認ください。"
          align="left"
        />
        <div className="panel panel-corners mt-10 overflow-hidden" data-reveal>
          <dl className="divide-y divide-white/5">
            {profile.map((row) => (
              <div key={row.label} className="grid gap-1 px-6 py-5 sm:grid-cols-4 sm:gap-4">
                <dt className="text-sm font-bold text-slate-400">{row.label}</dt>
                <dd className="speakable text-sm leading-relaxed text-slate-200 sm:col-span-3">
                  {ja(row.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 所在地と対応エリア（連絡先はお問い合わせ欄に集約） */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2" data-reveal>
          <address className="panel p-5 not-italic">
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Icon name="pin" className="size-4 text-gold" />
              所在地
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{fullAddress}</p>
          </address>
          <div className="panel p-5">
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Icon name="globe" className="size-4 text-gold" />
              対応エリア
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{ja(siteConfig.areaServed)}</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-slate-500" data-reveal>
          {ja("お電話・メールでのご連絡先は")}
          <Link prefetch={false} href="/contact" className="mx-1 text-brand-light underline-offset-4 hover:underline">
            {ja("お問い合わせページ")}
          </Link>
          {ja("に記載しています。")}
        </p>

      </Section>

      {/* ------------- 事業内容（名刺記載の8項目） ------------- */}
      <BusinessLines
        bg="deep"
        description="組み込みソフトウェア開発を中心に、Webの制作・業務アプリケーションまで手がけています。"
      />

      {/* ------------- 事業の軸（AI活用） ------------- */}
      <Section id="ai-identity">
        <SectionHeading
          eyebrow="Our Core"
          title="AI活用の3つの側面"
          description="Web制作も組み込み開発も、AIをどう使うかという同じ軸の上にあります。"
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {aiIdentity.map((a, i) => (
            <article
              key={a.title}
              className="panel panel-hover panel-corners flex flex-col p-7"
              data-reveal
              style={{ "--reveal-delay": `${i * 0.1}s` } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-none border border-brand/30 bg-brand/10 text-brand-light shadow-[0_0_20px_rgba(182,126,255,0.2)]">
                  <Icon name={a.icon} className="size-6" />
                </span>
                <span className="font-display rounded-none border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-bold tracking-wider text-gold-light">
                  {a.label}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">{ja(a.title)}</h3>
              <p className="speakable mt-3 flex-1 text-sm leading-relaxed text-slate-400">
                {ja(a.body)}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-slate-500" data-reveal>
          {ja("AI活用の具体的な中身は")}
          <Link prefetch={false} href="/ai" className="mx-1 text-brand-light underline-offset-4 hover:underline">
            {ja("AI活用のページ")}
          </Link>
          {ja("にまとめています。")}
        </p>
      </Section>

      {/* ------------- 姿勢 ------------- */}
      <Section bg="deep">
        <SectionHeading
          eyebrow="Our Principles"
          title="お約束していること"
          description="Web制作は形が見えにくい買い物です。だからこそ、判断の材料になる約束を先に開示します。"
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {principles.map((p, i) => (
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
      </Section>

      {/* ------------- 事業内容・技術 ------------- */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel panel-corners p-7" data-reveal>
            <h2 className="text-xl font-bold text-white">提供サービス</h2>
            <ul className="mt-5 space-y-3">
              {services.map((s) => (
                <li key={s.slug} className="flex gap-3">
                  <Icon name="check" className="mt-1 size-4 shrink-0 text-brand" />
                  <span className="text-sm text-slate-300">
                    <span className="font-bold text-white">{ja(s.title)}</span>
                    <span className="mt-0.5 block text-slate-500">{ja(s.features.join("／"))}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div className="panel p-7" data-reveal>
              <h2 className="text-xl font-bold text-white">主な技術スタック</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {techStack.map((t) => (
                  <li
                    key={t}
                    className="rounded-none border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300"
                  >
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-slate-500">
                {ja("案件ごとに最適な構成を選定します。特定のCMSやフレームワークに縛られた提案はしません。")}
              </p>
            </div>

            <div className="panel p-7" data-reveal>
              <h2 className="text-xl font-bold text-white">対応エリア</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                {ja("下記の府県は対面での打ち合わせに伺います。打ち合わせはオンライン会議でも完結できます。")}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {siteConfig.localAreas.map((a) => (
                  <li
                    key={a}
                    className="rounded-none border border-gold/25 bg-gold/[0.07] px-2.5 py-1 text-xs text-gold-light"
                  >
                    {a}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                {ja(siteConfig.localAreasNote)}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <RelatedPages hrefs={["/ai", "/web", "/embedded", "/demo", "/request", "/faq"]} />
      <ContactCta />
    </>
  );
}
