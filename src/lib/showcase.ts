/**
 * デモサイト（`/showcase`）の職種データ。
 *
 * 【何のためのページか】
 * `/demo` は「機能ごとに実物を見せる」ページで、機能名から入る人には強い一方、
 * 「うちの業種だと何に使えるのか」には答えていませんでした。
 * このデモサイトは**職種を入口**にして、「この職種ならこの機能をこう使えます」を
 * シナリオと実際に動くデモの両方で見せます。
 *
 * 【表示速度の約束（重要）】
 * - このファイルは `"use client"` の部品からも読むため、**`content.ts` を import しない**こと
 *   （1800行ぶんが初期JSに載る。詳細は `docs/引き継ぎ.md` の「表示速度を守るための鉄則」）。
 * - デモ本体は**リンク（起動ボタン）を押すまで読み込まない**（`components/showcase/LazyDemo.tsx`）。
 *   職種ページを開いただけでは、どのデモのJSも取得しません。
 * - デモサイトでは、本サイトの装飾（Three.js の3D背景・カーソル光・常駐アシスタント）を
 *   読み込みません（`components/fx/SiteChrome.tsx`）。デモの描画にCPUとGPUを回すためです。
 *
 * 【ファイル分割の理由（表示速度）】
 * 18職種ぶんのデータ（`industries`）は `src/lib/showcaseData.ts` に分けています。
 * このファイルには**型と小さな定数だけ**を置くこと。
 * `ShowcaseBody` などのクライアント部品がここを import するため、
 * データを同居させると18職種ぶんが全部の職種ページの初期JSに載ります（実測で約17KB）。
 *
 * 【正直さのルール】
 * ここに書く数値は「一般的にこのくらいを狙う」という**目標値**であって実績ではありません。
 * 表示側でも必ずその旨を出すこと（`OUTCOME_NOTE`）。実績として見せてはいけません。
 */

import type { IconKey } from "@/components/ui/icons";
import type { IndustryModelKey } from "@/components/demos/industryModels";

/**
 * 料金シミュレーターデモの中身。
 *
 * 計算式は全職種で共通（基本料金 ＋ 数量 × 単価）×グレード倍率 ＋ オプション で、
 * **言葉と数字だけを職種ごとに差し替え**ます。
 * 工務店ならリフォーム費用、自動車整備なら車検費用、士業なら顧問料、という具合に、
 * その職種のサイトに本当に置かれる試算になります。
 */
export type SimulatorConfig = {
  /** 何を試算するか（見出し） */
  title: string;
  /** 結果に添える注記（概算であることの明示） */
  note: string;
  /** 1つめの選択（基本メニュー） */
  kindLabel: string;
  kinds: { key: string; label: string; base: number; days: number; note: string }[];
  /** 数量のスライダー（面積・人数・台数など） */
  quantity: {
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    init: number;
    /** 1単位あたりの追加費用 */
    perUnit: number;
    /** 1単位あたりの追加日数 */
    perUnitDays: number;
  };
  /** グレード（基本料金への倍率） */
  gradeLabel: string;
  grades: { key: string; label: string; rate: number; note: string }[];
  /** 追加オプション */
  optionLabel: string;
  options: { key: string; label: string; price: number; days: number; hint: string }[];
  /** 期間の単位（「日」「週間」など） */
  durationUnit: string;
};

/** `/demo/<slug>` と対応するデモの識別子 */
export type DemoSlug =
  | "3dcg"
  | "configurator"
  | "simulator"
  | "recommend"
  | "insight"
  | "ar"
  | "animation"
  | "ai-chatbot"
  | "voice"
  | "multilingual"
  | "ai-agent"
  | "personalize"
  | "sns"
  | "integration"
  | "pwa";

/**
 * デモの短い説明（職種ページで使う）。
 * `content.ts` の `capabilities` と同じ機能を指しますが、
 * クライアント側に content.ts を持ち込まないため、ここに要約だけを置いています。
 */
export const DEMO_META: Record<DemoSlug, { label: string; icon: IconKey; summary: string }> = {
  "3dcg": { label: "3DCG・WebGL", icon: "cube", summary: "商品や建物をブラウザ上で回して見せる" },
  configurator: { label: "商品カスタマイズ", icon: "sliders", summary: "選ぶたびに見た目と価格が変わる" },
  simulator: { label: "料金シミュレーター", icon: "calc", summary: "その場で概算金額と期間を出す" },
  recommend: { label: "AIレコメンド", icon: "sparkles", summary: "好みと行動から次の一点を薦める" },
  insight: { label: "行動解析・A/Bテスト", icon: "chart", summary: "クリックを記録して改善点を見つける" },
  ar: { label: "AR（拡張現実）", icon: "ar", summary: "実物大でその場に置いて確かめる" },
  animation: { label: "アニメーション", icon: "film", summary: "動きで視線を導き、印象を残す" },
  "ai-chatbot": { label: "AIチャットボット", icon: "bot", summary: "根拠つきで答え、予約まで進める" },
  voice: { label: "音声AI", icon: "mic", summary: "話しかけて操作し、読み上げで返す" },
  multilingual: { label: "多言語・通貨", icon: "globe", summary: "言語・通貨・日付を自動で切り替える" },
  "ai-agent": { label: "AIエージェント対応", icon: "search", summary: "生成AIに正しく読ませ、引用させる" },
  personalize: { label: "パーソナライズ", icon: "user", summary: "訪問者ごとに見せる内容を変える" },
  sns: { label: "SNS連携", icon: "share", summary: "投稿を取り込み、共有時の見え方を整える" },
  integration: { label: "システム連携", icon: "plug", summary: "在庫・顧客・通知を裏でつなぐ" },
  pwa: { label: "PWA・通知", icon: "bell", summary: "アプリのように使え、通知を送れる" },
};

/** 職種ページで使う「この機能をこう使う」1件ぶん */
export type ShowcasePick = {
  demo: DemoSlug;
  /** その職種での使い道（見出し） */
  title: string;
  /** 具体的な場面 */
  scene: string;
  /** 何が変わるか */
  effect: string;
};

/** システム連携デモに渡す構成（職種に合わせて連携先の名前を変える） */
export type IntegrationNode = { key: string; label: string; icon: IconKey };

/** システム連携デモの在庫データ（職種に合わせて商品名を変える） */
export type CatalogItem = {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: string;
};

export type Industry = {
  slug: string;
  /** 職種名 */
  name: string;
  /** 英字ラベル */
  eyebrow: string;
  icon: IconKey;
  /** 一覧カードの1行紹介 */
  tagline: string;
  /** 想定している事業者像 */
  customer: string;
  /** よくある課題（3つ） */
  challenges: string[];
  /** 3DCGデモで「何を回して見せるか」 */
  product: { name: string; note: string };
  /**
   * 3DCG・ARデモで実際に表示する立体（`components/demos/industryModels.ts`）。
   * 「この職種ならこんな感じ」の説明ではなく、その職種の物を実際に出すための指定です。
   * 例：クリニック＝診療ユニット・診療ワゴン・待合ソファ。
   *
   * ⚠️ **必ず3つ以上**入れること。1つだけだと「たまたま作った物を1個見せている」ように
   *    見えてしまい、その職種向けに作れることが伝わらないためです。
   *    先頭が初期表示になります。汎用の基本形状（球・キューブ）や当社ロゴは、
   *    職種ページでは出しません（`Demo3dcg` は models があるとそれだけを並べます）。
   */
  models: IndustryModelKey[];
  /**
   * 料金シミュレーターデモの中身（この職種で試算するもの）。
   * 未設定のときは、当社のWeb制作費用の試算（デモ本来の内容）を表示します。
   */
  simulator?: SimulatorConfig;
  /** システム連携デモの連携先（3件。key は inventory / crm / notify 固定、表示名だけ職種に合わせる） */
  systems: IntegrationNode[];
  /** システム連携デモで動かすデータ */
  catalog: CatalogItem[];
  /** この職種での使い方（4件） */
  picks: ShowcasePick[];
  /** 併せて効く機能 */
  alsoUseful: DemoSlug[];
  /** 狙う効果（★実績ではなく目標値。表示側で必ず注記する） */
  outcomes: { label: string; value: string }[];
};

/** 効果の数値に必ず添える注記（誇張しないための約束） */
export const OUTCOME_NOTE =
  "上の数値は、この職種でよく設定される目標値の例です。実績値ではありません。実際の見込みは、現状の数字を伺ってから個別に試算します。";

/**
 * 連携先ノードの先頭2つは全職種で共通（Webサイト → APIゲートウェイ）。
 * ⚠️ 3つめ以降の `key` は **inventory / crm / notify に固定**すること。
 *    システム連携デモ（DemoIntegration）の処理ステップがこのキーで
 *    「いまどのノードを通っているか」を光らせているため、変えると光らなくなる。
 *    職種ごとに変えてよいのは **label（表示名）と icon** だけ。
 */
export const BASE_NODES: IntegrationNode[] = [
  { key: "web", label: "Webサイト", icon: "layout" },
  { key: "api", label: "APIゲートウェイ", icon: "plug" },
];

