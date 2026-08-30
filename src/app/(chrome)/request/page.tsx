import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { faqs } from "@/lib/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero, FlightList, ModuleBoard, ClosingCta } from "@/components/ui/Studio";
import { Pricing } from "@/components/sections/Pricing";
import { Faq } from "@/components/sections/Faq";

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

const requestFaqs = faqs.filter((f) => f.category === "price");

/** 相談から着手までを3段で。心配ごとを先に消す順番で並べる。 */
const flow = [
  {
    figure: "req-talk" as const,
    en: "TALK",
    title: "決まっていなくて、大丈夫。",
    body: "仕様書も予算も未定で構いません。「問い合わせを増やしたい」だけでも、そこから実現方法を一緒に整理します。",
  },
  {
    figure: "req-shape" as const,
    en: "SHAPE",
    title: "構成案と見積もりまで、無料。",
    body: "目的を伺ったうえで、複数の構成案と概算費用をご提示します。内容にご納得いただけない場合は、お断りいただいて構いません。",
  },
  {
    figure: "req-start" as const,
    en: "START",
    title: "小さく始めて、広げる。",
    body: "対策だけ、調査だけ、といった部分的なご依頼も受けています。成果を確認しながら範囲を広げられます。",
  },
];

const asks = [
  { title: "Webサイトを作る・作り直す", note: "298,000円〜" },
  { title: "AI機能を組み込む", note: "RAG / 音声 / 推薦" },
  { title: "機器のソフトウェアを開発する", note: "別途お見積もり" },
  { title: "AI検索・SEO対策だけ頼む", note: "部分依頼可" },
  { title: "公開後の運用・改善を任せる", note: "月次で対応" },
  { title: "できるかどうかだけ調べる", note: "技術調査のみ可" },
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

      <PageHero
        kicker="Request"
        figure="req-hero"
        title={
          <>
            まだ輪郭のない
            <br />
            相談から、<em>どうぞ</em>。
          </>
        }
        lead="何をどこまで頼めるのか、いくらかかるのか。判断に必要なことだけを、このページに置きました。"
        actions={[
          { href: "/contact", label: "無料で相談する", primary: true },
          { href: "#pricing", label: "料金の目安を見る" },
        ]}
        note="初回相談・ヒアリング・構成案・お見積もりまで無料"
      />

      <FlightList label="HOW IT STARTS" items={flow} />

      <ModuleBoard
        label="WHAT YOU CAN ASK"
        title={
          <>
            相談できること。
            <br />
            一部だけでも。
          </>
        }
        lead="一式のご依頼から、対策だけ・調査だけの部分的なご依頼まで受けています。"
        items={asks}
        prefix="REQ"
      />

      <Pricing />

      <Faq
        items={requestFaqs}
        title="ご相談前のよくある質問"
        description="料金・進め方・お断りのしやすさについて、いただくことの多い質問です。"
        moreHref="/faq"
      />

      <ClosingCta
        title={
          <>
            2営業日以内に、
            <br />
            ご返信します。
          </>
        }
        lead="無理な営業はいたしません。書けるところだけ書いてお送りください。"
        action={{ href: "/contact", label: "相談フォームへ", primary: true }}
        secondary={{ href: "/demo", label: "できることを見る" }}
      />
    </>
  );
}
