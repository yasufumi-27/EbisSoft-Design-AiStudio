import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  servicesJsonLd,
  webPageJsonLd,
} from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { capabilities, faqs, webDemoSlugs } from "@/lib/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero, FlightList, ModuleBoard, StatRow, ClosingCta } from "@/components/ui/Studio";
import { Faq } from "@/components/sections/Faq";

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

/** 制作の流れを3段で。工程表ではなく、何を大事にしているかを書く。 */
const how = [
  {
    en: "SCOPE",
    title: "何を解くのかを、先に決める。",
    body: "ページ数ではなく、達成したいことから構成を組み立てます。目的と読み手が決まれば、必要な機能は自然に決まります。",
    href: "/request",
    more: "相談の流れを見る",
  },
  {
    en: "BUILD",
    title: "速さは、質を削らない。",
    body: "AIで作業を並列化し、空いた時間を表示速度と原稿の精度に戻します。小規模なサイトなら最短5日で公開できます。",
    href: "/columns/ai-web-seisaku-kikan-hiyou",
    more: "期間と費用の実測",
  },
  {
    en: "GROW",
    title: "公開してからが、本番。",
    body: "アクセスと問い合わせを見ながら直します。SEO・AI検索対策・表示速度は追加オプションではなく標準です。",
    href: "/demo/insight",
    more: "行動解析のデモ",
  },
];

const stats = [
  { value: "1/3", label: "従来比の制作期間" },
  { value: "05", label: "最短の公開日数" },
  { value: "100", label: "表示速度の目標点" },
  { value: "29.8万", label: "円〜（小規模）" },
];

export default function WebPage() {
  const modules = webDemoSlugs
    .map((slug) => capabilities.find((c) => c.slug === slug))
    .filter((c): c is (typeof capabilities)[number] => Boolean(c))
    .map((c) => ({ title: c.title, note: "OPEN DEMO", href: `/demo/${c.slug}` }));

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

      <PageHero
        kicker="Web Production"
        art={1}
        title={
          <>
            事業の成果から、
            <br />
            <em>逆算</em>してつくる。
          </>
        }
        lead="コーポレートサイトからECまで。最短5日で公開し、公開後の改善まで含めて設計します。"
        actions={[
          { href: "/contact", label: "無料で見積もりを依頼する", primary: true },
          { href: "/request", label: "料金の目安を見る" },
        ]}
        note="298,000円〜／初回相談・お見積もり無料"
      />

      <StatRow items={stats} />

      <FlightList label="HOW WE BUILD" items={how} />

      <ModuleBoard
        label="WEB MODULES"
        title={
          <>
            サイトに載せられる、
            <br />
            動く機能。
          </>
        }
        lead="どれもこのサイト上で実際に動きます。触ってから決めてください。"
        items={modules}
      />

      <Faq
        items={webFaqs}
        title="Web制作のよくある質問"
        description="対応範囲・期間・費用について、いただくことの多い質問です。"
        moreHref="/faq"
      />

      <ClosingCta
        title={
          <>
            サイトで何を変えたいか、
            <br />
            そこから話しましょう。
          </>
        }
        lead="仕様書がなくても構いません。構成案とお見積もりのご提示まで無料です。"
        action={{ href: "/contact", label: "無料で相談する", primary: true }}
        secondary={{ href: "/demo", label: "できることを見る" }}
      />
    </>
  );
}
