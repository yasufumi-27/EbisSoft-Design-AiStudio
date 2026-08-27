/**
 * 職種を入力すると、その場でデモサイトの構成を組み立てる仕組み。
 *
 * 【何をしているか（誇張しないための説明）】
 * 生成AI（大規模言語モデル）をサーバーで呼んでいるわけではありません。
 * 本サイトは完全な静的配信なので、**ブラウザの中だけで完結する**次の3段で作っています。
 *
 *   1. 入力を文字 bi-gram に分解する（日本語は単語の切れ目が無いため。`kb.ts` と同じ考え方）
 *   2. 18職種のテンプレートが持つ「特徴語」との**コサイン類似度**で、いちばん近いものを選ぶ
 *   3. 選んだテンプレートの語彙を、入力から取り出した中核語で置き換える
 *      （3Dで表示する対象・取扱商品・拠点名などが職種に合わせて変わる）
 *
 * 実案件で生成AIを使う場合も、土台はこれと同じです。
 * 「テンプレート＋確からしい素材の差し替え」を先に用意しておき、
 * 文章の生成だけをLLMに任せると、破綻せず・速く・安く動きます。
 *
 * この仕組み自体が、AIに何を任せて何を任せないかの実例になっています。
 */

import type { CatalogItem, Industry } from "@/lib/showcase";
// ⚠️ このファイルはクライアントから読まれる。全テンプレートとの照合が目的なので、
//    18職種ぶんのデータを持ち込むのは /showcase/generate に限った意図的な例外。
import { industries } from "@/lib/showcaseData";

/* ------------------------------------------------------------------
 * 1. テンプレートの特徴語
 *    slug ごとに「この職種を指す言い方」を並べる。ここが検索のキー。
 * ---------------------------------------------------------------- */

const SIGNALS: Record<string, string[]> = {
  retail: ["小売", "EC", "通販", "ネットショップ", "物販", "販売店", "雑貨", "商店", "オンラインストア", "直販", "書店", "本屋", "花屋", "酒屋", "精肉店", "青果", "文具店", "土産", "ギフト", "家電", "ホームセンター", "リサイクルショップ", "古着"],
  restaurant: ["飲食", "レストラン", "カフェ", "居酒屋", "食堂", "ラーメン", "寿司", "焼肉", "バー", "パン屋", "ベーカリー", "料理", "焼き菓子", "コーヒー", "焙煎", "喫茶", "弁当", "デリバリー", "ケータリング", "菓子", "和菓子", "洋菓子", "ピザ", "そば", "うどん"],
  clinic: ["クリニック", "医院", "病院", "歯科", "内科", "整形外科", "皮膚科", "眼科", "動物病院", "薬局", "鍼灸", "接骨院", "医療", "診療所", "クリニック", "歯医者", "整骨院", "カイロ", "助産", "訪問看護", "デンタル"],
  manufacturing: ["製造", "メーカー", "工場", "加工", "部品", "機械", "金属", "板金", "樹脂", "電子機器", "装置", "OEM", "町工場", "製作所", "鉄工", "製缶", "鋳造", "溶接", "印刷", "製本", "木工", "工房", "ものづくり"],
  realestate: ["不動産", "賃貸", "売買", "仲介", "物件", "マンション", "土地", "管理会社", "住宅販売", "不動産屋", "駐車場", "空き家", "リロケーション", "宅建", "貸家"],
  construction: ["建設", "工務店", "リフォーム", "内装", "外構", "塗装", "設備工事", "電気工事", "解体", "住宅建築", "大工", "造園", "植木", "庭", "水道", "管工事", "足場", "土木", "左官", "内装工事", "リノベーション", "エクステリア", "防水"],
  school: ["塾", "学習塾", "予備校", "スクール", "教室", "習い事", "英会話", "音楽教室", "プログラミング教室", "資格", "教育", "教習所", "ダンス", "書道", "そろばん", "絵画教室", "料理教室", "家庭教師", "セミナー", "研修"],
  legal: ["税理士", "行政書士", "司法書士", "社会保険労務士", "弁護士", "会計事務所", "コンサルタント", "士業", "特許", "労務", "事務所", "翻訳", "通訳", "デザイン事務所", "設計事務所", "建築士", "コンサル", "占い", "カウンセリング"],
  beauty: ["美容室", "ヘアサロン", "理容", "ネイル", "まつげ", "エステ", "サロン", "整体", "リラクゼーション", "スパ", "床屋", "バーバー", "脱毛", "アイラッシュ", "マッサージ", "もみほぐし", "鍼灸院"],
  fitness: ["ジム", "フィットネス", "パーソナルトレーニング", "ヨガ", "ピラティス", "スポーツクラブ", "トレーニング", "ダイエット", "体操", "スイミング", "武道", "道場", "空手", "格闘技", "テニススクール", "ゴルフ"],
  hotel: ["ホテル", "旅館", "宿", "民宿", "ゲストハウス", "観光", "旅行", "民泊", "温泉", "宿泊", "レジャー", "ペットホテル", "キャンプ場", "グランピング", "貸別荘", "観光農園", "体験ツアー", "ガイド"],
  logistics: ["運送", "物流", "配送", "倉庫", "引越", "宅配", "トラック", "輸送", "運輸", "配達", "廃棄物", "産廃", "回収", "便利屋", "代行", "ポスティング", "引越し"],
  auto: ["自動車", "中古車", "カーディーラー", "整備", "車検", "板金塗装", "バイク", "カー用品", "レンタカー", "自転車", "ガソリンスタンド", "タイヤ", "ロードサービス", "船", "農機", "建機", "修理"],
  agriculture: ["農業", "農家", "農園", "生産者", "野菜", "果物", "米", "酪農", "漁業", "水産", "食品加工", "直売", "養鶏", "養蜂", "きのこ", "花き", "園芸", "牧場", "醸造", "酒蔵", "味噌", "醤油"],
  bridal: ["ブライダル", "結婚式", "ウェディング", "式場", "写真スタジオ", "フォト", "イベント", "貸しスペース", "レンタルスペース", "撮影", "ドローン", "空撮", "写真館", "映像制作", "動画制作", "司会", "貸しスタジオ", "葬儀", "記念日"],
  care: ["介護", "デイサービス", "訪問介護", "福祉", "障がい", "老人ホーム", "ケア", "看護", "保育", "託児", "放課後", "児童", "幼稚園", "こども園", "送迎", "就労支援", "相談支援"],
  saas: ["SaaS", "IT", "ソフトウェア", "システム開発", "受託開発", "アプリ", "Web", "クラウド", "スタートアップ", "サービス開発", "ホームページ制作", "デザイン", "マーケティング", "広告", "制作会社", "エンジニア", "セキュリティ", "通信", "電気通信"],
  apparel: ["アパレル", "ファッション", "服", "衣料", "セレクトショップ", "オーダーメイド", "靴", "バッグ", "アクセサリー", "ブランド", "呉服", "着物", "洋裁", "リフォーム衣類", "クリーニング", "眼鏡", "時計", "宝飾", "ジュエリー"],
};

/* ------------------------------------------------------------------
 * 2. 類似度（文字 bi-gram のコサイン類似度）
 * ---------------------------------------------------------------- */

/** 表記ゆれを吸収する（全角英数→半角、カタカナは残す、記号と空白は落とす） */
export function normalize(text: string): string {
  return text
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase()
    .replace(/[\s　]/g, "")
    .replace(/[・:：,、.。（）()「」【】/／\-―'"']/g, "");
}

/**
 * どの職種にも付く一般語。入力から落としてから照合する。
 * 「ドローン空撮サービス」の「サービス」のように、
 * 中身を表さない語が残っていると、無関係なテンプレートと部分一致してしまう。
 */
const GENERIC_WORDS =
  /(株式会社|有限会社|合同会社|サービス|センター|カンパニー|事業所|当社|弊社|うちの|私の|わたしの)/g;

/** 文字 bi-gram（1文字だけの語も拾えるよう uni-gram も少し混ぜる） */
function grams(text: string): string[] {
  const t = normalize(text.replace(GENERIC_WORDS, "")) || normalize(text);
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  if (t.length === 1) out.push(t);
  return out;
}

function vector(texts: string[]): Map<string, number> {
  const v = new Map<string, number>();
  for (const t of texts) for (const g of grams(t)) v.set(g, (v.get(g) ?? 0) + 1);
  return v;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [k, av] of a) dot += av * (b.get(k) ?? 0);
  if (dot === 0) return 0;
  const na = Math.sqrt([...a.values()].reduce((s, x) => s + x * x, 0));
  const nb = Math.sqrt([...b.values()].reduce((s, x) => s + x * x, 0));
  return dot / (na * nb);
}

/** テンプレートごとのベクトル（職種名も特徴語に含める） */
const TEMPLATE_VECTORS: { slug: string; vec: Map<string, number> }[] = industries.map((i) => ({
  slug: i.slug,
  vec: vector([i.name, ...(SIGNALS[i.slug] ?? [])]),
}));

/**
 * これ未満なら「近いテンプレートが見つからなかった」と表示に出す（結果は返す）。
 *
 * 実測（2026-08-03、`scripts` ではなく使い捨てスクリプトで計測）：
 * - 想定した22の入力（「ラーメン屋」「町工場」「訪問介護」「ドローン空撮サービス」など）は
 *   **22件すべて意図したテンプレートに当たった**。スコアは 0.075〜0.517。
 * - まったく無関係な語（「宇宙旅行」「占い師」「深海探査」）は 0.076 以下。
 *
 * 当たりの下限（0.075）と無関係の上限（0.076）が重なっているため、**完全な分離はできません**。
 * そこで、しきい値は「自信を持って言えるか」の目安として 0.12 に置き、
 * 下回った場合は結果を出しつつ「近い職種が見つからなかった」と正直に表示します。
 */
const MATCH_THRESHOLD = 0.12;

export type MatchResult = {
  /** 参考にしたテンプレート */
  base: Industry;
  /** 類似度（0〜1） */
  score: number;
  /** しきい値を超えて「近い職種が見つかった」と言えるか */
  confident: boolean;
};

/**
 * 入力にいちばん近い職種テンプレートを返す。
 * どのテンプレートとも一致しない（スコア0）ときは、先頭の「小売・EC」に落ちます。
 * 商品・在庫・問い合わせという要素がいちばん多くの職種に共通するため、汎用の土台として妥当です。
 */
export function matchTemplate(input: string): MatchResult {
  const q = vector([input]);
  let best = TEMPLATE_VECTORS[0];
  let bestScore = -1;
  for (const t of TEMPLATE_VECTORS) {
    const s = cosine(q, t.vec);
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  }
  const base = industries.find((i) => i.slug === best.slug)!;
  return { base, score: bestScore, confident: bestScore >= MATCH_THRESHOLD };
}

/* ------------------------------------------------------------------
 * 3. 語彙の差し替え
 * ---------------------------------------------------------------- */

/** 職種名から中核語を取り出す（「株式会社まるまる工房」→「まるまる工房」ではなく業態語を残す） */
export function coreWord(input: string): string {
  return (
    input
      .replace(/[\s　]+/g, "")
      .replace(/^(株式会社|有限会社|合同会社|一般社団法人|NPO法人)/, "")
      .replace(/(株式会社|有限会社|合同会社)$/, "")
      // 「〜業」「〜屋さん」などの言い回しを落として、扱っているものを残す
      .replace(/(業界|業者|業$|屋さん$|さん$)/, "")
      .trim() || input.trim()
  );
}

/** 生成した職種の在庫データ（先頭3件を入力語から作り、残りはテンプレートの現実的な項目を使う） */
function buildCatalog(core: string, base: Industry): CatalogItem[] {
  const tiers = [
    { suffix: "（基本）", ratio: 1 },
    { suffix: "（標準）", ratio: 1.6 },
    { suffix: "（上位）", ratio: 2.6 },
  ];
  const basePrice = base.catalog[0]?.price || 10000;

  const generated: CatalogItem[] = tiers.map((t, i) => ({
    sku: `GN-${1001 + i}`,
    name: `${core}${t.suffix}`,
    category: core.slice(0, 6),
    price: Math.round((basePrice * t.ratio) / 100) * 100,
    stock: [12, 5, 1][i],
    location: `${core}拠点`,
  }));

  return [...generated, ...base.catalog.slice(3)];
}

/** テンプレートの文章に出てくる職種名を、入力された職種名に置き換える */
function retext(text: string, base: Industry, name: string): string {
  return text.split(base.name).join(name);
}

/**
 * 入力された職種から、デモサイトの構成を組み立てる。
 * テンプレートの構造はそのままに、**3Dで表示する対象・取扱データ・文章中の職種名**を差し替える。
 */
export function generateIndustry(input: string): { industry: Industry; match: MatchResult } {
  const name = input.trim() || "あなたの職種";
  const core = coreWord(name);
  const match = matchTemplate(name);
  const base = match.base;

  const industry: Industry = {
    ...base,
    slug: "generated",
    name,
    eyebrow: "Generated",
    tagline: retext(base.tagline, base, name),
    customer: `${name}（入力された職種）`,
    challenges: base.challenges.map((c) => retext(c, base, name)),
    product: {
      name: `${core}の主力商品・サービス`,
      note: "入力された職種から組み立てた表示対象です。実案件では、実物を計測または撮影して作った3Dモデルに置き換えます。",
    },
    catalog: buildCatalog(core, base),
    picks: base.picks.map((p) => ({
      ...p,
      title: retext(p.title, base, name),
      scene: retext(p.scene, base, name),
      effect: retext(p.effect, base, name),
    })),
    outcomes: base.outcomes.map((o) => ({ ...o, label: retext(o.label, base, name) })),
  };

  return { industry, match };
}

/** 入力例（ボタンで試せるようにする。あえてテンプレートに無い職種も混ぜてある） */
export const GENERATE_EXAMPLES = [
  "ドローン空撮サービス",
  "町の書店",
  "造園・植木屋",
  "ペットホテル",
  "電気工事",
  "翻訳事務所",
  "コーヒー焙煎所",
  "リサイクルショップ",
];
