/**
 * 職種別デモサイト（`/demosite/<職種>`）の型とテーマ。
 *
 * 【何を作っているか】
 * `/showcase/<職種>` が「この職種ならこの機能をこう使えます」という**説明**のページなのに対し、
 * `/demosite/<職種>` は**その職種のホームページそのもの**です。
 * ヘッダー・ヒーロー・サービス紹介・事例・お客様の声・料金・FAQ・アクセス・
 * 問い合わせフォーム・フッターまで、実際に納品するのと同じ構成で作ってあります。
 * WordPressのテーマデモと同じ位置づけで、**中身を触ることはできません**（見て確かめる用）。
 *
 * 【表示速度の約束（重要）】
 * - デモサイトは `app/(chrome)` の**外**にあります。当社のヘッダー・フッター・3D背景・
 *   常駐アシスタントのJSは**配信されません**。本サイト側も、別ページなので一切重くなりません。
 * - 別タブで開きます（`target="_blank"`）。リンクは `prefetch` しないため、
 *   **開いた瞬間に初めて**デモサイトのHTMLとCSSを取得します。
 * - サイト内の機能デモ（3D・AR・チャットボット等）は、**起動ボタンを押すまで読み込みません**。
 * - 見た目は Tailwind ではなく専用の `demosite.css`（数KB）で作っています。
 *   本サイトの暗いテーマと戦わずに、職種ごとの明るい配色へ切り替えるためです。
 *
 * 【正直さのルール】
 * 掲載している会社名・住所・電話番号・お客様の声は**すべて架空**です。
 * 実在の事業者と誤認されないよう、画面上部の帯とフッターで必ずその旨を出すこと。
 * ここに実在企業の名称・ロゴ・実績を書いてはいけません。
 */

import type { DemoSlug, ShowcasePick } from "@/lib/showcase";

/** 配色と字面のプリセット。職種の「らしさ」はほぼここで決まる */
export type DemoSiteTheme = "clean" | "warm" | "care" | "bold" | "elegant" | "trust";

export type DemoSiteData = {
  /** `showcaseData.ts` の職種スラッグと対応させる（メニューやデモの中身を引くため） */
  industry: string;
  /** 架空の屋号 */
  brand: string;
  /** ロゴの下に添える英字 */
  brandEn: string;
  /** ヘッダー右の一言（キャッチ） */
  brandNote: string;
  theme: DemoSiteTheme;
  /** ヒーローの大見出し（2行に割るため配列） */
  hero: string[];
  /** ヒーローのリード文 */
  lead: string;
  /** ヒーロー下の短い訴求（3つ） */
  heroPoints: string[];
  /** 主要導線のボタン名 */
  cta: { primary: string; secondary: string };
  /** 架空の連絡先 */
  tel: string;
  /** お知らせ（3件） */
  news: { date: string; tag: string; text: string }[];
  /** 選ばれる理由（3件） */
  reasons: { title: string; body: string }[];
  /** サービス一覧の呼び名（「診療案内」「メニュー」など職種の言葉にする） */
  menuTitle: string;
  menuLead: string;
  /** 事例セクションの呼び名（「施工事例」「症例」など） */
  worksTitle: string;
  worksLead: string;
  works: { tag: string; title: string; body: string }[];
  /** お客様の声（架空） */
  voices: { name: string; body: string }[];
  /** ご利用の流れ（4件） */
  flow: { title: string; body: string }[];
  /** よくある質問（4件） */
  faq: { q: string; a: string }[];
  /** アクセス・営業情報（架空） */
  info: { address: string; access: string; hours: string; closed: string; extra: string };
  /** 埋め込む機能デモの見せ方（`showcaseData` の picks から使うものを選ぶ） */
  featureLead: string;
};

/** 職種ページの picks からデモサイトに埋め込む数（多いと重くなるので上限を決めておく） */
export const MAX_SITE_DEMOS = 4;

/**
 * デモサイトに載せてよいデモ。
 *
 * デモサイトは「そのお店のホームページ」なので、**中身まで職種のものになっている**
 * デモだけを載せます（3Dモデル・チャットボットの知識・試算の内容・扱うデータ）。
 * 当社向けの内容のままのデモ（パーソナライズの出し分け文言など）は、
 * ここに載せると「他社の宣伝が混ざったサイト」になってしまうため外しています。
 * 職種の説明ページ `/showcase/<職種>` では、引き続きすべてのデモを見られます。
 *
 * ⚠️ デモを職種対応にしたら（`lib/demoProps.ts` に設定を足したら）、ここにも追加すること。
 */
const SITE_READY: DemoSlug[] = ["3dcg", "ar", "ai-chatbot", "simulator", "integration", "recommend"];

/** 職種の picks に足りないときに補うデモと、その説明文 */
const FALLBACK: Partial<Record<DemoSlug, { title: string; scene: string; effect: string }>> = {
  "ai-chatbot": {
    title: "よくある質問に、24時間その場で答える",
    scene:
      "このサイトに書かれている内容を知識源にして、営業時間外の質問にも自動で答えます。答えられない質問は、無理に答えずお問い合わせへ案内します。",
    effect: "電話と返信の手間が減り、営業時間外の問い合わせも取りこぼしません。",
  },
  simulator: {
    title: "費用の目安を、その場で出す",
    scene:
      "条件を選ぶだけで、概算の金額と期間が出ます。計算はブラウザの中で完結するので、待ち時間がありません。",
    effect: "「いくらかかるか分からない」を理由にした離脱がなくなります。",
  },
  "3dcg": {
    title: "実物を、回して見てもらう",
    scene: "写真では伝わらない形や質感を、立体で確かめられるようにします。",
    effect: "来店・来院前の不安が減り、問い合わせの内容が具体的になります。",
  },
};

/** デモサイトに埋め込むデモを決める（職種の picks を優先し、足りなければ補う） */
export function siteDemoPicks(picks: ShowcasePick[]): ShowcasePick[] {
  const chosen = picks.filter((p) => SITE_READY.includes(p.demo));
  for (const slug of ["ai-chatbot", "simulator", "3dcg"] as DemoSlug[]) {
    if (chosen.length >= 3) break;
    if (chosen.some((c) => c.demo === slug)) continue;
    const text = FALLBACK[slug];
    if (text) chosen.push({ demo: slug, ...text });
  }
  return chosen.slice(0, MAX_SITE_DEMOS);
}

/** デモサイトのナビゲーション（全職種共通の並び。名前だけ職種語に差し替える） */
export function demoSiteNav(d: DemoSiteData): { id: string; label: string }[] {
  return [
    { id: "about", label: "特徴" },
    { id: "menu", label: d.menuTitle },
    { id: "feature", label: "できること" },
    { id: "works", label: d.worksTitle },
    { id: "faq", label: "よくある質問" },
    { id: "access", label: "アクセス" },
  ];
}

/** 機能デモの識別子（型を再輸出して、デモサイト側から showcase.ts を直接読まなくてよくする） */
export type { DemoSlug };
