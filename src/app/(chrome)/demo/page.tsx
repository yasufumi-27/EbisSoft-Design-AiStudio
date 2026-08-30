import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, capabilitiesJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { capabilities } from "@/lib/content";
import { demoProposal, proposalById } from "@/lib/designProposals";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero, StatRow, ClosingCta } from "@/components/ui/Studio";
import { ja } from "@/lib/typography";
import Link from "next/link";

const title = "できること（実際に動くデモ一覧）";
const description =
  "3DCG・WebGL、Web内アニメーション、AIチャットボット、SNS連携、業務システム連携。エビスソフトができることを、説明ではなく実際に動くデモで公開しています。発注前に実力をご確認ください。";

export const metadata: Metadata = {
  title,
  description,
  // 15本のデモページが受ける検索語を、一覧側でも束ねて持たせる
  keywords: Array.from(new Set(capabilities.flatMap((c) => c.searchTerms))),
  alternates: { canonical: "/demo" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/demo`,
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
  { name: "できること", path: "/demo" },
];

const stats = [
  { value: "15", label: "実際に動く領域" },
  { value: "18", label: "職種別のデモサイト" },
  { value: "03", label: "実装の合計時間（時間）" },
  { value: "00", label: "スライドの枚数" },
];

export default function DemoIndexPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/demo",
            name: `${title}｜${siteConfig.name}`,
            description,
          }),
          breadcrumbJsonLd(crumbs),
          capabilitiesJsonLd(),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHero
        kicker="Live Demos"
        art={3}
        title={
          <>
            言わずに、
            <br />
            <em>動かして</em>見せる。
          </>
        }
        lead="できることは15領域すべて、その場で操作できるデモとして公開しています。"
        actions={[
          { href: "#modules", label: "デモを一覧する", primary: true },
          { href: "/showcase", label: "職種別のデモサイト" },
        ]}
        note="デモはそれぞれ違うデザイン案で作っています"
      />

      <StatRow items={stats} />

      {/* 15のデモを一枚の盤に。1pxの隙間がそのまま罫線になる（トップの LIVE MODULES と同じ） */}
      <section id="modules" className="ai-console studio-board scroll-mt-20">
        <div data-reveal>
          <p className="ai-console-label">ALL MODULES</p>
          <h2>
            15の領域。
            <br />
            ぜんぶ触れます。
          </h2>
          <p>
            カードは押すとデモに移ります。デモごとに違うデザイン案で作ってあるので、見た目の幅も同時に確かめられます。
          </p>
        </div>
        <div className="ai-console-grid" data-reveal>
          {capabilities.map((c, i) => {
            const p = proposalById(demoProposal[c.slug]);
            return (
              <Link key={c.slug} href={`/demo/${c.slug}`}>
                <article>
                  <span>MOD_{String(i + 1).padStart(2, "0")}</span>
                  <i aria-hidden />
                  <b>{ja(c.title)}</b>
                  <small style={{ color: p.tokens.accent }}>
                    DESIGN {p.no} / {p.name}
                  </small>
                </article>
              </Link>
            );
          })}
        </div>
      </section>

      <ClosingCta
        title={
          <>
            これを、自分の商材で
            <br />
            見てみたい。
          </>
        }
        lead="ご相談いただければ、業種に合わせた形でお見せします。初回相談は無料です。"
        action={{ href: "/contact", label: "無料で相談する", primary: true }}
        secondary={{ href: "/web", label: "Web制作を見る" }}
      />
    </>
  );
}
