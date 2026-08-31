import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, personJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { author, hasNamedAuthor, yearsInBusiness } from "@/lib/author";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero, FlightList, StatRow, ClosingCta } from "@/components/ui/Studio";
import { ja } from "@/lib/typography";

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

/** 約束できることを3段で。会社の説明より、依頼したときに何が起きるかを書く。 */
const promises = [
  {
    figure: "co-window" as const,
    en: "ONE WINDOW",
    title: "Webも機器も、ひとつの窓口で。",
    body: "Web制作・AI機能・組み込みソフトウェアを同じ体制で担当します。会社をまたいだ調整が要りません。",
    href: "/embedded",
    more: "組み込みの範囲を見る",
  },
  {
    figure: "co-judge" as const,
    en: "HUMAN JUDGMENT",
    title: "決めるのは、人。",
    body: "AIに任せるのは作業であって、判断ではありません。設計方針・レビュー・公開の可否は必ず人が決めます。",
    href: "/ai",
    more: "AI活用の考え方",
  },
  {
    figure: "co-real" as const,
    en: "NO FICTION",
    title: "架空の実績は、載せない。",
    body: "公開できる制作事例がないため、代わりに動くものを出しています。数値は自社の制作で計測した値だけです。",
    href: "/demo",
    more: "動くデモを見る",
  },
];

const stats = [
  { value: "20+", label: "年の開発実績" },
  { value: "03", label: "手がける領域" },
  { value: "KYOTO", label: "京都市伏見区" },
  { value: "0円", label: "初回相談・見積もり" },
];

/**
 * 会社概要の表。連絡先は site.ts が単一情報源なので、ここでは参照するだけ。
 *
 * ⚠️ ここに並べる項目は、構造化データ（Organization / Person）で申告している内容と
 *    **一致していなければならない**。以前は代表者名・電話・郵便番号・設立年が
 *    JSON-LD にだけあって画面に無く、「機械にだけ見せている情報」になっていた。
 *    E-E-A-T（とくに Trust）で見られるのは人が読める形で確認できるかどうかなので、
 *    事業者の身元にあたる項目は必ずこの表にも出す。
 */
function profileRows() {
  const { contact } = siteConfig;
  const addr = `〒${contact.address.postalCode} ${contact.address.region}${contact.address.locality}${contact.address.street}`;
  return [
    { k: "名称", v: siteConfig.legalName },
    ...(hasNamedAuthor
      ? [{ k: "代表者", v: `${author.personName}（${author.personRole}）` }]
      : []),
    {
      k: "設立",
      v: `${siteConfig.foundingDate.slice(0, 4)}年（開発実績${yearsInBusiness()}年）`,
    },
    { k: "所在地", v: addr },
    {
      k: "電話（社員窓口）",
      v: `${contact.telephoneDisplay}（${contact.openingHoursDisplay}）`,
    },
    { k: "メール（社員窓口）", v: contact.email },
    { k: "事業内容", v: "Webサイト制作、AI機能の開発、組み込みソフトウェア開発" },
    { k: "対応エリア", v: "関西一円／オンラインは全国対応" },
    { k: "所属", v: siteConfig.memberOf.map((m) => m.name).join("・") },
  ];
}

export default function CompanyPage() {
  return (
    <>
      <JsonLd
        data={[
          // 会社そのものを説明するページなので AboutPage。
          webPageJsonLd({
            path: "/company",
            name: `${title}｜${siteConfig.name}`,
            description,
            type: "AboutPage",
          }),
          breadcrumbJsonLd(crumbs),
          // 代表者。コラムの author と同じ @id を持ち、記事の書き手の身元がここに解決される
          ...(personJsonLd() ? [personJsonLd()!] : []),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHero
        kicker="About"
        figure="co-hero"
        title={
          <>
            京都の片隅で、
            <br />
            <em>越境して</em>つくる。
          </>
        }
        lead="エビスソフトは、Web・AI・組み込みを横断する京都市伏見区の開発事業者です。"
        actions={[
          { href: "/contact", label: "相談してみる", primary: true },
          { href: "/demo", label: "できることを見る" },
        ]}
      />

      <StatRow items={stats} />

      <FlightList label="WHAT WE PROMISE" items={promises} />

      {/* 会社概要そのもの。読み物ではないので、罫線だけの表で静かに置く */}
      <section className="ai-console studio-board">
        <div data-reveal>
          <p className="ai-console-label">PROFILE</p>
          <h2>会社概要</h2>
          <p>
            連絡先とアクセスは、お問い合わせページにまとめています。掲載している電話番号と
            メールアドレスは、代表者個人ではなく社員が対応する窓口です。
          </p>
        </div>
        <div data-reveal>
          <table className="ai-table panel w-full">
            <tbody>
              {profileRows().map((r) => (
                <tr key={r.k}>
                  <td>{r.k}</td>
                  <td data-head>{ja(r.v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ClosingCta
        title={
          <>
            まだ名前のない相談も、
            <br />
            歓迎します。
          </>
        }
        lead="実現できるかどうかの技術調査だけでも構いません。"
        action={{ href: "/contact", label: "無料で相談する", primary: true }}
        secondary={{ href: "/request", label: "料金の目安を見る" }}
      />
    </>
  );
}
