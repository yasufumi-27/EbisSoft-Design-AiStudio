import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { GenerateStudio } from "@/components/showcase/GenerateStudio";
import { ContactCta } from "@/components/sections/ContactCta";
import { ja } from "@/lib/typography";

const title = "職種を入力してデモサイトを自動で組み立てる";
const description =
  "職種を入力すると、いちばん近いテンプレートを選び、3Dで表示する対象・取扱データ・連携先を入力に合わせて差し替えたデモサイトをその場で組み立てます。ブラウザの中だけで動くため、送信も待ち時間もありません。";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["業種別 Web制作", "デモサイト 自動生成", "AI サイト生成", "業種 テンプレート"],
  alternates: { canonical: "/showcase/generate" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/showcase/generate`,
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
  { name: "デモサイト", path: "/showcase" },
  { name: "職種を入力して組み立てる", path: "/showcase/generate" },
];

export default function GeneratePage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/showcase/generate",
            name: `${title}｜${siteConfig.name}`,
            description,
          }),
          breadcrumbJsonLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "職種別デモサイトの自動組み立て",
            description,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web Browser",
            browserRequirements: "モダンブラウザ（JavaScript有効）",
            offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
            url: `${siteConfig.url}/showcase/generate`,
          },
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        eyebrow="Generate"
        title={
          <>
            職種を入力すると、
            <br />
            <span className="text-gradient">その場で組み立てます</span>
          </>
        }
        lead="用意した18職種に当てはまらない場合はこちらへ。入力からいちばん近い構成を選び、3Dで表示する対象・取扱データ・連携先を差し替えたデモサイトをその場で作ります。"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/showcase" variant="ghost">
            用意済みの18職種を見る
          </ButtonLink>
        </div>
      </PageHeader>

      <Section>
        <GenerateStudio />
      </Section>

      {/* 仕組みの開示（何をAIに任せて、何を任せていないか） */}
      <Section bg="deep">
        <div className="panel mx-auto max-w-3xl p-7">
          <p className="eyebrow mb-4">How it works</p>
          <h2 className="text-xl font-bold text-white">{ja("裏側で何をしているか")}</h2>
          <div className="mt-5 space-y-3 text-sm leading-relaxed text-slate-400">
            <p>
              {ja(
                "このサイトは完全な静的配信なので、サーバーで大規模言語モデルを呼んではいません。入力を文字N-gramに分解し、18職種の特徴語とのコサイン類似度でいちばん近いテンプレートを選び、語彙を差し替えています（サイト内AIチャットボットの検索と同じ考え方です）。",
              )}
            </p>
            <p>
              {ja(
                "実案件で生成AIを使う場合も、土台はこれと同じです。壊れない構造をテンプレートとして先に用意し、文章の生成だけをAIに任せると、速く・安く・破綻せずに作れます。何をAIに任せて何を任せないかの、そのままの実例です。",
              )}
            </p>
          </div>
        </div>
      </Section>

      <ContactCta />
    </>
  );
}
