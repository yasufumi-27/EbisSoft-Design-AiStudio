import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { DEMO_META } from "@/lib/showcase";
import { industries, getIndustry } from "@/lib/showcaseData";
import { getDemoSite } from "@/lib/demoSiteData";
import { siteConfig, absoluteUrl } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { ShowcaseBody } from "@/components/showcase/ShowcaseBody";
import { ContactCta } from "@/components/sections/ContactCta";
import { ja } from "@/lib/typography";

// 静的書き出しに対応するため、存在する職種のみ生成する
export const dynamicParams = false;

export function generateStaticParams() {
  return industries.map((i) => ({ industry: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string }>;
}): Promise<Metadata> {
  const { industry } = await params;
  const data = getIndustry(industry);
  if (!data) return {};

  const title = `${data.name}のWebサイトでできること（デモつき）`;
  const description = `${data.name}のWebサイトに実装できる機能を、実際に動くデモつきで紹介します。${data.picks
    .map((p) => p.title)
    .slice(0, 3)
    .join("／")}など。${data.tagline}`.slice(0, 155);

  return {
    title,
    description,
    keywords: [`${data.name} ホームページ`, `${data.name} Web制作`, `${data.name} DX`, "業種別 デモ"],
    alternates: { canonical: `/showcase/${data.slug}` },
    openGraph: {
      type: "website",
      url: `${siteConfig.url}/showcase/${data.slug}`,
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

export default async function IndustryShowcasePage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;
  const data = getIndustry(industry);
  if (!data) notFound();

  const title = `${data.name}のWebサイトでできること`;
  const others = industries.filter((i) => i.slug !== data.slug);

  const crumbs = [
    { name: "ホーム", path: "/" },
    { name: "デモサイト", path: "/showcase" },
    { name: data.name, path: `/showcase/${data.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: `/showcase/${data.slug}`,
            name: `${title}｜${siteConfig.name}`,
            description: data.tagline,
          }),
          breadcrumbJsonLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${data.name}で使えるWebサイトの機能`,
            itemListElement: data.picks.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p.title,
              description: p.scene,
              url: absoluteUrl(`/demo/${p.demo}`),
            })),
          },
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        eyebrow={data.eyebrow}
        title={
          <>
            <span className="text-gradient">{data.name}</span>の
            <br />
            Webサイトでできること
          </>
        }
        lead={data.tagline}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {data.picks.map((p) => (
            <a
              key={p.demo}
              href={`#demo-${p.demo}`}
              className="panel px-3 py-2 text-xs text-slate-300 transition-colors hover:text-brand-light"
            >
              <Icon name={DEMO_META[p.demo].icon} className="mr-1.5 inline size-3.5 text-brand" />
              {ja(DEMO_META[p.demo].label)}
            </a>
          ))}
        </div>
        {/* デモサイト（実際のホームページの形）へ。別タブで開き、押すまで読み込まない */}
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`/demosite/${data.slug}`}
            target="_blank"
            rel="noopener"
            className="btn btn-primary h-12 px-6"
          >
            {ja(`${data.name}のデモサイトを開く`)}
            <Icon name="external" className="size-4" />
          </a>
          <ButtonLink href="/contact" variant="secondary">
            この構成について相談する
          </ButtonLink>
          <ButtonLink href="/showcase" variant="ghost">
            ほかの職種を見る
          </ButtonLink>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {ja(
            "デモサイトは、実際に納品するのと同じ形まで作り込んだ「見るための1サイト」です。別タブで開き、開いた時点で初めて読み込みます（このページは重くなりません）。",
          )}
        </p>
      </PageHeader>

      <Section>
        <ShowcaseBody industry={data} chatbotFaq={getDemoSite(data.slug)?.faq} />
      </Section>

      {/* ほかの職種へ */}
      <Section bg="deep">
          <h2 className="eyebrow" data-reveal>
            {ja("Other Industries / ほかの職種")}
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {others.map((i) => (
              <Link
                prefetch={false}
                key={i.slug}
                href={`/showcase/${i.slug}`}
                className="panel panel-hover flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300"
              >
                <Icon name={i.icon} className="size-4 shrink-0 text-brand" />
                {ja(i.name)}
              </Link>
            ))}
            <Link
              prefetch={false}
              href="/showcase/generate"
              className="panel panel-hover flex items-center gap-2 border-gold/30 px-4 py-2.5 text-sm text-gold-light"
            >
              <Icon name="sparkles" className="size-4 shrink-0" />
              {ja("ここにない職種を入力する")}
            </Link>
          </div>
      </Section>

      <ContactCta />
    </>
  );
}
