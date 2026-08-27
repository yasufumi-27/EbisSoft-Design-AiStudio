/**
 * 記事・ページの「誰が書いたか」（E-E-A-T の Experience / Expertise / Authoritativeness）。
 *
 * Google の品質評価では、情報の中身と同じくらい「誰が、どんな経験にもとづいて
 * 書いたか」が見られます。とくにコラムのような情報系ページは、著者が分からないと
 * 評価されにくいため、表示（記事下の署名欄）と構造化データ（author / publisher）の
 * 両方で同じ情報を出しています。
 *
 * ⚠️ ここに書いてよいのは**検証できる事実だけ**です。
 *    肩書き・受賞歴・実績年数を盛ると、E-E-A-T ではむしろ不利になります
 *    （虚偽の構造化データは手動対策の対象にもなります）。
 */

import { siteConfig } from "@/lib/site";

/** 設立年から数えた事業年数（記事の「経験」の根拠。毎年勝手に更新される） */
export function yearsInBusiness(): number {
  const founded = new Date(siteConfig.foundingDate);
  const now = new Date();
  let years = now.getFullYear() - founded.getFullYear();
  const beforeAnniversary =
    now.getMonth() < founded.getMonth() ||
    (now.getMonth() === founded.getMonth() && now.getDate() < founded.getDate());
  if (beforeAnniversary) years -= 1;
  return years;
}

/** 代表者の氏名（この定数を1か所直せば、表示も構造化データも切り替わる） */
const PERSON_NAME = "片山　博彦";

export const author = {
  /**
   * 代表者（個人）の氏名。
   * 空にすると、著者を個人ではなく事業者（エビスソフト）名義として扱います
   * （実在しない人物名を出すと、構造化データが誤情報になるため）。
   */
  personName: PERSON_NAME as string,
  /** ローマ字表記（構造化データの alternateName。海外・AIからの照合を助ける） */
  personNameRomaji: "Katayama Hirohiko",
  /** 代表者の肩書き */
  personRole: "代表",

  /** 署名欄のひとこと紹介（事実のみ） */
  bio: `${siteConfig.contact.address.region}${siteConfig.contact.address.locality}のエビスソフト代表。組み込みソフトウェア開発とWeb制作の両方を受託しており、現在は生成AIを制作フロー全体に組み込んで開発しています。記事の内容は、自社サイトを含む実際の制作で確かめたことだけを書いています。`,

  /**
   * 専門性の根拠。すべてサイト内の他ページで裏が取れる事実にしています
   * （＝読み手が検証できる。E-E-A-T の Trust）。
   */
  credentials: [
    {
      label: "代表",
      value: `${PERSON_NAME}（${siteConfig.legalName}）`,
      href: "/company",
    },
    {
      label: "事業年数",
      value: `${yearsInBusiness()}年以上（${siteConfig.foundingDate.slice(0, 4)}年開業）`,
      href: "/company",
    },
    {
      label: "所属",
      value: siteConfig.memberOf.map((m) => m.name).join("、"),
      href: "/company",
    },
    {
      label: "実装の裏づけ",
      value: "15領域の機能を実際に動くデモとして公開（合計約3時間で実装）",
      href: "/demo",
    },
    {
      label: "手がける領域",
      value: "Web制作・AI機能開発・組み込みソフトウェア開発",
      href: "/web",
    },
  ],
};

/** 記事の署名欄に出す表示名。個人名が未設定なら事業者名を使う。 */
export const authorDisplayName: string = author.personName || siteConfig.legalName;

/** 個人名が確定しているか（Person の構造化データを出すかどうかの判定に使う） */
export const hasNamedAuthor = author.personName.length > 0;
