import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { consultCases, consultTopics, faqs, pageSummaries, pricingNotes, requestSteps } from "@/lib/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageNav } from "@/components/site/PageNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { PageSummary } from "@/components/sections/PageSummary";
import { Pricing } from "@/components/sections/Pricing";
import { Faq } from "@/components/sections/Faq";
import { RelatedPages } from "@/components/sections/RelatedPages";
import { ContactCta } from "@/components/sections/ContactCta";
import { ja } from "@/lib/typography";

const title = "ご依頼・ご相談｜相談できることと料金の目安";
const description =
  "エビスソフトへのご依頼・ご相談のページ。Webサイト制作、AI機能の開発、組み込みソフトウェア開発、AI検索対策、公開後の運用まで、相談できる範囲と料金の目安（Web制作は298,000円〜／組み込み開発の費用は別途ご相談）、ご相談から着手までの流れをまとめています。初回のご相談・お見積もりは無料です。";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Web制作 料金",
    "ホームページ制作 費用 京都",
    "ホームページ 見積もり",
    "組み込み開発 依頼",
    "AI開発 相談",
    "無料相談",
  ],
  alternates: { canonical: "/request" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/request`,
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
  { name: "ご依頼・ご相談", path: "/request" },
];

/** 料金は「ご依頼」の判断材料なので、このページの FAQ は price カテゴリを見せる。 */
const requestFaqs = faqs.filter((f) => f.category === "price");

/** ページ内メニュー（スクロールしても上部に残る）。 */
const SECTIONS = [
  { id: "topics", label: "相談できること" },
  { id: "pricing", label: "料金の目安" },
  { id: "flow", label: "相談の流れ" },
  { id: "faq", label: "よくある質問" },
  { id: "contact", label: "お問い合わせ" },
];

export default function RequestPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({ path: "/request", name: `${title}｜${siteConfig.name}`, description }),
          breadcrumbJsonLd(crumbs),
          faqJsonLd(requestFaqs),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        art={1}
        eyebrow="Request"
        title={
          <>
            ご依頼・
            <br className="sm:hidden" />
            <span className="text-gradient">ご相談</span>
          </>
        }
        lead="何をどこまで頼めるのか、いくらかかるのか、どう進むのか。判断に必要な情報をこのページにまとめました。初回のご相談・お見積もりは無料です。"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/contact" withArrow>
            無料で相談する
          </ButtonLink>
          <ButtonLink href="#pricing" variant="ghost">
            料金の目安を見る
          </ButtonLink>
        </div>
      </PageHeader>

      {/* ページ内メニュー：ここから下はスクロールしても常に上部に残る */}
      <PageNav items={SECTIONS} />

      <PageSummary items={pageSummaries.request} title="このページの要点" />

      {/* ------------- 相談できること ------------- */}
      <Section id="topics">
        <SectionHeading
          eyebrow="What You Can Ask"
          title="相談できること"
          description="サイト一式のご依頼から、対策だけ・調査だけの部分的なご依頼まで受けています。"
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {consultTopics.map((t, i) => (
            <article
              key={t.title}
              className="panel panel-hover panel-corners flex flex-col p-7"
              data-reveal
              style={{ "--reveal-delay": `${(i % 3) * 0.1}s` } as React.CSSProperties}
            >
              <span className="grid size-12 place-items-center rounded-none bg-gradient-to-br from-brand/80 to-accent/80 text-ink shadow-[0_0_22px_rgba(182,126,255,0.35)]">
                <Icon name={t.icon} className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-bold text-white">{ja(t.title)}</h3>
              <p className="speakable mt-3 text-sm leading-relaxed text-slate-400">{ja(t.body)}</p>
              <ul className="mt-5 flex-1 space-y-2 border-t border-brand/20 pt-5">
                {t.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-gold" />
                    <span className="min-w-0">{ja(item)}</span>
                  </li>
                ))}
              </ul>
              {t.href ? (
                <Link
                  prefetch={false}
                  href={t.href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-light transition-colors hover:text-white"
                >
                  {ja(t.hrefLabel ?? "詳しく見る")}
                  <Icon name="arrowRight" className="size-4" />
                </Link>
              ) : null}
            </article>
          ))}
        </div>

        {/* 相談のハードルを下げる例示 */}
        <div className="panel panel-corners mt-12 p-7 sm:p-9" data-reveal>
          <h3 className="text-lg font-bold text-white">こんな状態でも大丈夫です</h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {consultCases.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-sm text-slate-300">
                <Icon name="chat" className="mt-0.5 size-4 shrink-0 text-brand-light" />
                <span className="speakable min-w-0 leading-relaxed">{ja(c)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-slate-500">
            {ja(
              "決まっていないことは、こちらから質問しながら一緒に整理します。まとめてからご連絡いただく必要はありません。",
            )}
          </p>
        </div>
      </Section>

      {/* ------------- 料金（Web制作ページから集約） ------------- */}
      <Pricing />

      <Section id="pricing-notes" bg="deep">
        <SectionHeading
          eyebrow="About Pricing"
          title="料金の考え方"
          description="金額そのものより、何にいくらかかるのかが分かることが大事だと考えています。"
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {pricingNotes.map((n, i) => (
            <div
              key={n.title}
              className="panel p-6"
              data-reveal
              style={{ "--reveal-delay": `${(i % 2) * 0.1}s` } as React.CSSProperties}
            >
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                <Icon name="check" className="size-4 text-gold" />
                {ja(n.title)}
              </h3>
              <p className="speakable mt-2 text-sm leading-relaxed text-slate-400">{ja(n.body)}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500" data-reveal>
          {ja("料金シミュレーターで、その場で概算を出すこともできます。")}
          <Link
            prefetch={false}
            href="/demo/simulator"
            className="mx-1 text-brand-light underline-offset-4 hover:underline"
          >
            概算を出してみる
          </Link>
        </p>
      </Section>

      {/* ------------- ご相談から着手までの流れ ------------- */}
      <Section id="flow">
        <SectionHeading
          eyebrow="How It Starts"
          title="ご相談から着手までの流れ"
          description="お見積もりのご提示までは無料です。ここで判断していただいて構いません。"
        />
        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {requestSteps.map((step, i) => (
            <li
              key={step.title}
              className="panel panel-hover relative p-6"
              data-reveal
              style={{ "--reveal-delay": `${(i % 4) * 0.1}s` } as React.CSSProperties}
            >
              <div className="flex items-center gap-4">
                <span className="font-display grid size-11 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/10 text-base font-bold text-brand-light shadow-[0_0_18px_rgba(182,126,255,0.25)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-bold text-white">{ja(step.title)}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{ja(step.description)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-sm text-slate-500" data-reveal>
          {ja("ご発注後の制作の進め方は、Web制作のページにまとめています。")}
          <Link
            prefetch={false}
            href="/web#process"
            className="mx-1 text-brand-light underline-offset-4 hover:underline"
          >
            制作の流れを見る
          </Link>
        </p>
      </Section>

      <Faq
        items={requestFaqs}
        title="料金・ご依頼についてのよくある質問"
        description="お見積もりの前によくいただく質問です。ほかの質問は一覧ページにまとめています。"
        moreHref="/faq"
        bg="deep"
      />

      <RelatedPages hrefs={["/web", "/ai", "/embedded", "/demo", "/faq", "/company"]} />
      <ContactCta />
    </>
  );
}
