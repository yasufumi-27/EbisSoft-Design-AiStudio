import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ja } from "@/lib/typography";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, capabilityJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { capabilities, getCapability, planForBand } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section, SectionHeading } from "@/components/ui/Section";
import { PageHeader, artFor } from "@/components/ui/PageHeader";
import { demoProposal, proposalById } from "@/lib/designProposals";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { DemoLoader } from "@/components/demos/DemoLoader";

// 静的書き出し（GitHub Pages）に対応するため、存在するスラッグのみ生成する
export const dynamicParams = false;

export function generateStaticParams() {
  return capabilities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cap = getCapability(slug);
  if (!cap) return {};

  // 見出しは機能名ではなく検索語を主語にする（「AR」ではなく「WebAR制作の費用と実例」）
  const plan = planForBand(cap.priceBand);
  const title = cap.searchTitle;
  const description = `${cap.searchLead}。費用の目安は${plan.price}（${plan.name}プラン）、期間の目安は${cap.leadTime}。実際に動くデモをこのページで公開しています。京都のエビスソフトが制作します。`;

  return {
    title,
    description,
    keywords: cap.searchTerms,
    alternates: { canonical: `/demo/${cap.slug}` },
    openGraph: {
      type: "article",
      url: `${siteConfig.url}/demo/${cap.slug}`,
      title: `${title}｜${siteConfig.name}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title}｜${siteConfig.name}`,
      description,
    },
  };
}

export default async function DemoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cap = getCapability(slug);
  if (!cap) notFound();

  // このデモを作ったデザイン案（15のデモに15案を1対1で割り当てている）
  const proposal = proposalById(demoProposal[cap.slug]);

  const others = capabilities.filter((c) => c.slug !== cap.slug);
  const plan = planForBand(cap.priceBand);

  /**
   * 「◯◯ 制作 費用」で来た人への即答。
   * 金額は `plans` から引くだけで、機能ごとの独自価格は作らない（`planForBand` のコメント参照）。
   */
  const costFaq = [
    {
      question: `${cap.searchTitle.replace(/の費用と実例.*$/, "")}の費用はどれくらいですか？`,
      answer: `サイト制作に含めてご依頼いただく場合、${plan.name}プラン（${plan.price}）が目安です。金額は「${cap.costFactors[0]}」などで変わるため、条件を伺ったうえで個別にお見積もりします。初回のご相談・構成案・お見積もりのご提示までは無料です。`,
    },
    {
      question: "導入までどのくらいの期間がかかりますか？",
      answer: `目安は${cap.leadTime}です。着手前のご相談・要件整理の期間は含みません。お急ぎの場合は、先に公開する範囲を絞ってご提案します。`,
    },
    {
      question: "いま動いているサイトに、後から追加できますか？",
      answer: `追加できます。既存サイトの構成を確認したうえで、${cap.title}の部分だけを組み込む形でも対応します。他社で制作されたサイトでも構いません。表示速度への影響を測ったうえでご提案します。`,
    },
  ];

  const crumbs = [
    { name: "ホーム", path: "/" },
    { name: "できること", path: "/demo" },
    { name: cap.title, path: `/demo/${cap.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: `/demo/${cap.slug}`,
            name: `${cap.searchTitle}｜${siteConfig.name}`,
            description: cap.description,
          }),
          breadcrumbJsonLd(crumbs),
          capabilityJsonLd(cap),
          faqJsonLd(costFaq),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      {/* 見出しは機能名ではなく検索語を主語にする。機能名は eyebrow に退避 */}
      {/* できることごとに形が変わるよう、スラッグから決める */}
      <PageHeader art={artFor(cap.slug)} eyebrow={cap.title} title={cap.searchTitle} lead={cap.searchLead}>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300">{ja(cap.impact)}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <span className="font-display inline-flex items-center gap-2 rounded-none border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-bold tracking-wider text-gold-light">
            <Icon name="bolt" className="size-3.5" />
            このデモの実装時間 {cap.buildTime}
          </span>
          <span className="text-xs text-slate-500">AIを活用した制作体制で構築</span>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/contact" withArrow>
            このデモについて相談する
          </ButtonLink>
          <ButtonLink href="/demo" variant="ghost">
            ほかのデモを見る
          </ButtonLink>
        </div>
      </PageHeader>

      {/* ------------- 実際に動くデモ -------------
          デモは「できることの見本」なので、サイト本体（03 AI STUDIO）ではなく
          **デモごとに違うデザイン案**で作ってあります。どの案かは designProposals.ts
          の demoProposal が持っていて、その案の色・書体・角の丸みは
          `dp-<案ID>` クラス（proposal-themes.css）が与えます。
          どの案で作った画面なのかは、必ず上の帯で明示すること。 */}
      <section id="demo" className="scroll-mt-20 pb-4">
        <Container>
          <div className={`dp-scope dp-${proposal.id} p-4 sm:p-6`}>
            <p className="dp-credit">
              <b>
                DESIGN {proposal.no} / {proposal.name}
              </b>
              <span>{proposal.jp}｜{proposal.note}</span>
            </p>
            <DemoLoader slug={cap.slug} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="panel p-5" data-reveal>
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <Icon name="play" className="size-4 text-brand" />
                デモの使い方
              </h2>
              <ul className="mt-3 space-y-1.5">
                {cap.howToUse.map((h) => (
                  <li key={h} className="flex gap-2 text-xs text-slate-400">
                    <Icon name="arrowRight" className="mt-0.5 size-3 shrink-0 text-brand" />
                    <span className="min-w-0">{ja(h)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 前提・制約は読みたい人だけが開く（本文はDOMに残るのでSEOに影響なし） */}
            <details className="demo-note self-start" data-reveal>
              <summary>
                <span className="font-display mr-2 text-[10px] font-bold tracking-[0.2em] text-gold uppercase">
                  Note
                </span>
                {ja("どこまでが実装で、本番では何が変わるか")}
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">{ja(cap.demoNote)}</p>
            </details>
          </div>
        </Container>
      </section>

      {/* ------------- 費用と期間（「◯◯ 制作 費用」で来た人への即答） ------------- */}
      <Section id="cost">
        <SectionHeading
          eyebrow="Cost & Duration"
          title="費用と期間の目安"
          description="「いくらかかるか」を先に出します。金額はサイト制作のプラン表と同じ基準で、この機能だけの特別料金は設けていません。"
        />
        {/* カードを3枚並べず、連結した盤にする（トップの LIVE MODULES と同じ組み） */}
        <div className="ai-facts mt-12" data-reveal>
          <article>
            <span>COST</span>
            <b>{plan.price}</b>
            <p className="speakable">
              {ja(`サイト制作に含めてご依頼いただく場合の「${plan.name}」プランが目安です。`)}
            </p>
            <Link prefetch={false} href="/request#pricing" className="ai-flight-more">
              3プランの料金表 <span aria-hidden>↗</span>
            </Link>
          </article>

          <article>
            <span>DURATION</span>
            <b>{ja(cap.leadTime)}</b>
            <p className="speakable">
              {ja(`このデモ自体は${cap.buildTime}で実装しました。実案件では要件整理・原稿・検証を含めて上記が目安です。`)}
            </p>
          </article>

          <article>
            <span>VARIABLES</span>
            <b>金額が変わる要素</b>
            <ul>
              {cap.costFactors.map((f) => (
                <li key={f}>{ja(f)}</li>
              ))}
            </ul>
          </article>
        </div>
      </Section>

      {/* ------------- 導入すると何が変わるか（ここが一番読ませたい） ------------- */}
      <Section bg="deep">
        <SectionHeading
          eyebrow="Business Impact"
          title="導入すると、何が変わるか"
          description={ja(cap.description)}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cap.businessValue.map((v, i) => (
            <article
              key={v.title}
              className="panel panel-corners flex flex-col p-6"
              data-reveal
              style={{ "--reveal-delay": `${i * 0.1}s` } as React.CSSProperties}
            >
              <span className="font-display text-3xl font-bold text-white/10">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-lg leading-snug font-bold text-white">{ja(v.title)}</h3>
              <p className="speakable mt-3 text-sm leading-relaxed text-slate-400">{ja(v.body)}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ------------- できること・活用シーン・技術 ------------- */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="panel panel-corners p-7" data-reveal>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Icon name="check" className="size-5 text-brand" />
              できること
            </h2>
            <ul className="mt-5 space-y-3">
              {cap.bullets.map((b) => (
                <li key={b} className="speakable flex gap-2.5 text-sm leading-relaxed text-slate-300">
                  <Icon name="check" className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span className="min-w-0">{ja(b)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="panel p-7"
            data-reveal
            style={{ "--reveal-delay": "0.1s" } as React.CSSProperties}
          >
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Icon name="target" className="size-5 text-gold" />
              こんな企業に
            </h2>
            <ul className="mt-5 space-y-3">
              {cap.useCases.map((u) => (
                <li key={u} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
                  <Icon name="arrowRight" className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span className="min-w-0">{ja(u)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="panel p-7"
            data-reveal
            style={{ "--reveal-delay": "0.2s" } as React.CSSProperties}
          >
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Icon name="code" className="size-5 text-accent-light" />
              使用する技術
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {cap.tech.map((t) => (
                <li
                  key={t}
                  className="rounded-none border border-brand/20 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300"
                >
                  {ja(t)}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              {ja("案件の要件・既存環境に合わせて選定します。ライブラリを増やすことによる表示速度への影響も評価したうえでご提案します。")}
            </p>
          </div>
        </div>
      </Section>

      {/* ------------- ほかのデモ ------------- */}
      <Section bg="deep">
        <SectionHeading
          eyebrow="Other Demos"
          title="ほかにも、こんなことができます"
          description="すべて実際に動くデモをご用意しています。"
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((o, i) => (
            <Link
              prefetch={false}
              key={o.slug}
              href={`/demo/${o.slug}`}
              className="panel panel-hover flex flex-col p-5"
              data-reveal
              style={{ "--reveal-delay": `${i * 0.08}s` } as React.CSSProperties}
            >
              <span className="grid size-10 place-items-center rounded-none border border-brand/20 bg-white/5 text-slate-400">
                <Icon name={o.icon} className="size-5" />
              </span>
              <h3 className="mt-4 font-bold text-white">{ja(o.title)}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{ja(o.impact)}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-light">
                デモを見る
                <Icon name="arrowRight" className="size-3" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ------------- CTA ------------- */}
      <Section>
        <div className="panel panel-corners p-8 text-center sm:p-12" data-reveal>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {ja(cap.title)}
            {ja("を、自社サイトでも。")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
            {ja("「どこまでできるか」「いくらかかるか」だけでも構いません。初回のご相談・お見積もりは無料です。")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/contact" size="lg" withArrow>
              無料で相談する
            </ButtonLink>
            <ButtonLink href="/request#pricing" size="lg" variant="secondary">
              料金を見る
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
