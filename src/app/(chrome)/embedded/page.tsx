import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, servicesJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { faqs } from "@/lib/content";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero, FlightList, ModuleBoard, StatRow, ClosingCta } from "@/components/ui/Studio";
import { EmbeddedPricingNote } from "@/components/sections/EmbeddedPricingNote";
import { Faq } from "@/components/sections/Faq";

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

/** 受託の範囲を3段で。層（機器 → 通信 → クラウド）の順に上がっていく。 */
const scope = [
  {
    figure: "emb-trace" as const,
    en: "FIRMWARE",
    title: "実機で動くところまで。",
    body: "C / C++での新規開発と、既存コードの改修・移植。ベアメタルからRTOS構成まで、実機での検証まで担当します。",
  },
  {
    figure: "emb-wave" as const,
    en: "PROTOCOL",
    title: "機器を、つなぐ。",
    body: "UART・I2C・SPI・CAN・BLE・Wi-Fi。周辺デバイスのドライバを、回路図とデータシートから起こします。",
  },
  {
    figure: "emb-uplink" as const,
    en: "CLOUD LINK",
    title: "現場の値を、ブラウザで見る。",
    body: "センサーの値をクラウドへ送り、Web管理画面で可視化するところまで。Web側も同じ体制で作れます。",
    href: "/web",
    more: "Web制作を見る",
  },
];

const stats = [
  { value: "20+", label: "年の開発実績" },
  { value: "05", label: "対応マイコン系列" },
  { value: "06", label: "対応する通信規格" },
  { value: "KYOTO", label: "京都市伏見区" },
];

const modules = [
  { title: "ファームウェア新規開発", note: "C / C++" },
  { title: "既存コードの改修・移植", note: "引き継ぎ可" },
  { title: "RTOSポーティング", note: "BSW / 起動処理" },
  { title: "I/Oドライバ開発", note: "UART / I2C / SPI" },
  { title: "通信の実装", note: "BLE / Wi-Fi / CAN" },
  { title: "実機検証・技術調査", note: "PoCのみも可" },
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

      <PageHero
        kicker="Embedded Systems"
        figure="emb-hero"
        title={
          <>
            機器の中から、
            <br />
            <em>クラウド</em>の先へ。
          </>
        }
        lead="マイコンのファームウェア開発から、IoT機器のWeb連携まで。組み込み単体のご依頼が中心です。"
        actions={[
          { href: "/contact", label: "組み込み開発を相談する", primary: true },
          { href: "/ai", label: "AI活用を見る" },
        ]}
        note="費用は内容によって大きく変わるため、個別にお見積もりします"
      />

      <StatRow items={stats} />

      <FlightList label="WHAT WE TAKE ON" items={scope} />

      <ModuleBoard
        label="SUPPORTED"
        title={
          <>
            受けられる仕事。
            <br />
            部分的な依頼も。
          </>
        }
        lead="既存ファームウェアの改修だけ、技術調査だけ、といったご相談も歓迎です。"
        items={modules}
        prefix="SVC"
      />

      <Faq
        items={embeddedFaqs}
        title="組み込み開発のよくある質問"
        description="対応マイコン・受託範囲・費用について、いただくことの多い質問です。"
        moreHref="/faq"
      />

      <section className="mx-auto w-full max-w-6xl gutter-x py-16">
        <EmbeddedPricingNote />
      </section>

      <ClosingCta
        title={
          <>
            前任者がいなくても、
            <br />
            引き継げます。
          </>
        }
        lead="既存コードの調査から着手できます。初回のご相談・お見積もりは無料です。"
        action={{ href: "/contact", label: "無料で相談する", primary: true }}
        secondary={{ href: "/company", label: "会社概要を見る" }}
      />
    </>
  );
}
