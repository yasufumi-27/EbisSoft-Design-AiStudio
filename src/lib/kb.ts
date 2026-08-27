/**
 * サイト内AIチャットボットの「知識源」と「検索エンジン」。
 *
 * 本サイトは静的配信のため、デモのチャットボットはブラウザ内で完結します。
 * ここでは RAG（検索拡張生成）の前段にあたる **検索（Retrieval）** を実装しています。
 *   1. content.ts / site.ts の情報を知識ドキュメント（chunk）に変換
 *   2. 日本語向けに文字 N-gram（bi-gram）でトークン化
 *   3. BM25 でクエリとの関連度をスコアリング
 *   4. スコアが閾値未満なら「答えない」（＝ハルシネーション抑制）
 *
 * 実案件では 4 の後段に大規模言語モデル（Claude 等）を接続し、
 * 検索で得た根拠だけを使って自然文を生成させます。設計思想はこのデモと同じです。
 */

import { faqs, keyFacts, services, capabilities, plans, aiImpacts, businessLines } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import { columns } from "@/lib/columns";
import { industries } from "@/lib/showcaseData";
import { glossary } from "@/lib/glossary";

export type KbDoc = {
  id: string;
  /** 出典の表示名 */
  source: string;
  /** 出典のカテゴリ */
  category:
    | "FAQ"
    | "要点"
    | "サービス"
    | "できること"
    | "料金"
    | "会社情報"
    | "スピード"
    | "コラム"
    | "職種別"
    | "用語";
  /** 検索対象テキスト（質問文・見出しなど） */
  key: string;
  /** 回答本文 */
  answer: string;
  /** 関連ページへのリンク（あれば） */
  href?: string;
};

/* ------------------------------------------------------------------
 * 1. 知識ドキュメントの構築
 * ---------------------------------------------------------------- */

function buildDocs(): KbDoc[] {
  const docs: KbDoc[] = [];

  faqs.forEach((f, i) => {
    docs.push({
      id: `faq-${i}`,
      source: f.question,
      category: "FAQ",
      key: f.question,
      answer: f.answer,
      href: "/faq",
    });
  });

  keyFacts.forEach((f, i) => {
    docs.push({
      id: `fact-${i}`,
      source: `要点：${f.q}`,
      category: "要点",
      key: f.q,
      answer: f.a,
    });
  });

  services.forEach((s) => {
    docs.push({
      id: `service-${s.slug}`,
      source: `サービス：${s.title}`,
      category: "サービス",
      key: `${s.title} ${s.features.join(" ")}`,
      answer: `${s.description}（主な内容：${s.features.join("／")}）`,
      href: "/web#services",
    });
  });

  businessLines.forEach((b, i) => {
    docs.push({
      id: `business-${i}`,
      source: `事業内容：${b.title}`,
      category: "サービス",
      key: `${b.title} 事業内容`,
      answer: b.description,
      href: b.category === "embedded" ? "/embedded#business" : "/web#business",
    });
  });

  capabilities.forEach((c) => {
    docs.push({
      id: `cap-${c.slug}`,
      source: `できること：${c.title}`,
      category: "できること",
      key: `${c.title} ${c.tagline} ${c.bullets.join(" ")} ${c.tech.join(" ")}`,
      answer: `${c.description}\n\n主にできること：${c.bullets.join("／")}\n実際に動くデモをご用意しています。`,
      href: `/demo/${c.slug}`,
    });
  });

  // 用語のやさしい解説。「そもそもAIって何？」「Web制作って何をするの？」のように、
  // サイト本文の手前にある一般的な質問に答えるための知識源（`glossary.ts`）。
  glossary.forEach((g, i) => {
    docs.push({
      id: `glossary-${i}`,
      source: `用語解説：${g.term}`,
      category: "用語",
      // 用語名そのものと言い換えを重ねて、短い質問（「AIとは？」）でも確実に当てる
      key: `${g.term} ${g.term} ${g.keywords.join(" ")}`,
      answer: g.answer,
      href: g.href,
    });
  });

  // 職種別デモサイト。「うちは飲食店だけど何ができる？」に答えられるようにする。
  industries.forEach((i) => {
    docs.push({
      id: `industry-${i.slug}`,
      source: `${i.name}向けのデモサイト`,
      category: "職種別",
      key: `${i.name} ${i.tagline} ${i.customer} ${i.challenges.join(" ")} ${i.picks
        .map((p) => p.title)
        .join(" ")}`,
      answer: `${i.name}では、${i.picks
        .map((p) => p.title)
        .join("／")}といった使い方ができます。それぞれ実際に動くデモを職種別のデモサイトに用意しています。`,
      href: `/showcase/${i.slug}`,
    });
  });

  // コラム記事。記事本体は質問に対する答えの形で書いてあるので、
  // 見出し（論点）と記事内FAQもキーに含めて拾えるようにする。
  columns.forEach((c) => {
    docs.push({
      id: `column-${c.slug}`,
      source: `コラム：${c.title}`,
      category: "コラム",
      key: `${c.question} ${c.keywords.join(" ")} ${c.body
        .filter((b) => b.type === "h2")
        .map((b) => b.text)
        .join(" ")}`,
      answer: `${c.answer}\n\n詳しくはコラム「${c.title}」で解説しています。`,
      href: `/columns/${c.slug}`,
    });

    c.faqs.forEach((f, i) => {
      docs.push({
        id: `column-${c.slug}-faq-${i}`,
        source: f.question,
        category: "コラム",
        key: f.question,
        answer: f.answer,
        href: `/columns/${c.slug}`,
      });
    });
  });

  plans.forEach((p) => {
    docs.push({
      id: `plan-${p.name}`,
      source: `料金：${p.name}プラン`,
      category: "料金",
      key: `${p.name}プラン 料金 価格 費用 いくら 見積もり ${p.priceNote}`,
      answer: `${p.name}プランは ${p.price}（${p.priceNote}）です。${p.description} 含まれるもの：${p.features.join("／")}。これはWebサイト制作の料金で、組み込み開発の費用は別途ご相談となります。初回のご相談・お見積もりは無料です。`,
      href: "/request#pricing",
    });
  });

  // 「組み込みはいくら？」に、プラン料金を答えてしまわないための専用ドキュメント
  docs.push({
    id: "embedded-pricing",
    source: "組み込み開発の費用",
    category: "料金",
    key: "組み込み 組込み 組込 ファームウェア マイコン iot 費用 料金 価格 いくら 見積もり 相場 予算 単価 工数 別途",
    answer:
      "組み込み開発の費用は別途ご相談です。Webサイト制作の料金プラン（298,000円〜など）は組み込み開発には適用されません。対象のマイコン、新規開発か既存コードの改修・移植か、通信の有無と種類、実機検証の範囲、納品物の内容によって工数が大きく変わるため、内容を伺ったうえで個別にお見積もりします。機能単位・工程単位での切り出しや、技術調査のみ・PoCのみといった小さな範囲のご依頼にも対応します。初回のご相談・お見積もりは無料です。",
    href: "/embedded#pricing",
  });

  docs.push({
    id: "speed",
    source: "AI活用による制作スピード",
    category: "スピード",
    key: "納期 期間 スピード 速い 早い どれくらい 何日 いつ 完成 公開まで AI 短縮",
    answer: `AIを制作フロー全体に組み込むことで、制作期間は従来の約1/3になります。目安は次のとおりです。${aiImpacts
      .map((i) => `${i.label}：${i.before} → ${i.after}`)
      .join("／")}。`,
    href: "/ai#ai-power",
  });

  docs.push({
    id: "company",
    source: "会社情報（所在地・連絡先）",
    category: "会社情報",
    key: "会社 会社名 名称 屋号 所在地 住所 どこ 場所 京都 伏見 電話 連絡先 営業時間 アクセス エリア 対応地域 商工会 所属団体 加盟",
    answer: `${siteConfig.legalName}は${siteConfig.contact.address.region}${siteConfig.contact.address.locality}に拠点を置き、Web制作と組み込みソフトウェア開発を手がけています。所在地は〒${siteConfig.contact.address.postalCode} ${siteConfig.contact.address.region}${siteConfig.contact.address.locality}${siteConfig.contact.address.street}。${siteConfig.memberOf.map((m) => m.name).join("・")}に所属しています。対応エリアは${siteConfig.areaServed}です。`,
    href: "/company",
  });

  docs.push({
    id: "ai-strength",
    source: "AIへの強み",
    category: "要点",
    key: "AI 強い 得意 生成AI ChatGPT Claude 活用 自動化 エージェント LLM 機械学習",
    answer:
      "エビスソフトはAIを「使う側」と「作る側」の両方を手がけます。制作工程ではAIコーディングエージェントで実装を並列化して期間を約1/3に短縮し、納品物としてはRAG構成のAIチャットボットやAI機能の開発を行います。さらに、生成AIに引用・推薦されるためのAEO / LLMO最適化も内側から理解して実装します。",
    href: "/ai",
  });

  docs.push({
    id: "embedded",
    source: "組み込み・IoT開発",
    category: "サービス",
    key: "組み込み 組込み 組込 ファームウェア firmware マイコン 基板 デバイス 機器 iot センサー 制御 c言語 c++ ルネサス renesas rh850 rx rl78 ra csplus e2studio cc-rh cc-rl 車載 can canfd stm32 esp32 arm cortex rtos ble bluetooth wi-fi mqtt uart i2c spi ハードウェア 電子機器",
    answer:
      "Web制作だけでなく、組み込みソフトウェア開発にも対応しています。マイコン（ルネサス RH850・RX・RL78・RA、ARM Cortex-M・STM32・ESP32など）のファームウェアをC / C++で開発し、BLE・Wi-Fi・MQTT・UART・I2C・SPIの通信実装、センサー制御、省電力設計まで行います。取得データを表示する管理画面やクラウド連携も同じ体制で担当できるため、装置側とWeb側を別々の会社に発注する必要がありません。",
    href: "/embedded",
  });

  docs.push({
    id: "contact",
    source: "お問い合わせ方法",
    category: "会社情報",
    key: "問い合わせ 相談 依頼 発注 申し込み 無料 見積 連絡 したい",
    answer:
      "初回のご相談・お見積もりは無料です。お問い合わせページのフォーム、またはお電話・メールでご連絡ください。ご要望を伺ったうえで、構成案とお見積もりをご提示します。",
    href: "/contact",
  });

  // 「京都で制作会社を探している」段階の質問。地名で探している人が最初に投げる言葉を広く拾う
  docs.push({
    id: "kyoto-irai",
    source: "京都でWeb制作を依頼するには",
    category: "会社情報",
    key: "京都 京都市 京都府 伏見 伏見区 地元 地域 近く 近所 関西 制作会社 web制作会社 ホームページ制作会社 探して 探す おすすめ 候補 選び方 どこに頼む 依頼先 相見積もり 比較",
    answer: `${siteConfig.legalName}は${siteConfig.contact.address.region}${siteConfig.contact.address.locality}のWeb制作・ホームページ制作の事業者です（${siteConfig.foundingDate.slice(0, 4)}年創業、${siteConfig.memberOf.map((m) => m.name).join("・")}所属）。京都府内は対面で伺い、大阪府・兵庫県・奈良県・滋賀県も対面の打ち合わせに対応しています。既存システムとの連携、AIチャットボット、3DCG演出まで自社で実装できるのが特徴です。依頼先の種類ごとの違い、費用の目安、相見積もりで確認すべき項目は「京都でWeb制作を依頼するには」のコラムにまとめています。`,
    href: "/columns/kyoto-web-seisaku-irai",
  });

  // サイト内の案内（「どこに何が書いてあるか」を聞かれたときのための道案内）
  docs.push({
    id: "sitemap",
    source: "サイトの案内（ページ一覧）",
    category: "会社情報",
    key: "サイト ページ 一覧 どこ 見たい 探して メニュー 目次 案内 構成 リンク どのページ 業種 職種",
    answer:
      "このサイトは次のページで構成されています。\n・AI活用（/ai）… AIで作る／AI機能をつくる、AEO・LLMO対策\n・Web制作（/web）… サービス内容・制作の流れ\n・組み込み開発（/embedded）… ファームウェア・IoT連携\n・できること（/demo）… 実際に動くデモ15種\n・デモサイト（/showcase）… 職種別に「この機能をこう使えます」を実演。18職種＋その場で組み立てる自動生成\n・コラム（/columns）… AI活用のWeb制作を実測で解説\n・ご依頼・ご相談（/request）… 料金・お見積もり\n・よくある質問（/faq）／会社概要（/company）／お問い合わせ（/contact）\n気になるページがあれば、そのまま質問してください。",
    href: "/demo",
  });

  return docs;
}

export const kbDocs: KbDoc[] = buildDocs();

/* ------------------------------------------------------------------
 * 2. 日本語向けトークナイザ（文字 bi-gram ＋ 英数字の単語分割）
 * ---------------------------------------------------------------- */

/**
 * 表記ゆれを吸収する同義語展開（検索の再現率を上げる）。
 * キーは NFKC 正規化・小文字化した後の形で書きます。
 */
const SYNONYMS: [string, string][] = [
  /* 料金・期間 */
  ["値段", "料金 費用"],
  ["価格", "料金 費用"],
  ["費用", "料金"],
  ["いくら", "料金 費用"],
  ["コスト", "料金 費用"],
  ["予算", "料金 費用"],
  ["相場", "料金 費用 プラン"],
  ["見積", "料金 費用 見積もり"],
  ["安い", "料金 費用 プラン"],
  ["納期", "期間 スピード"],
  ["どれくらい", "期間"],
  ["どのくらい", "期間"],
  ["何日", "期間 日数"],
  ["速い", "期間 スピード"],
  ["早い", "期間 スピード"],
  ["急ぎ", "期間 スピード 最短"],

  /* できること・デモ */
  ["3d", "3dcg 立体 webgl"],
  ["スリーディー", "3d 3dcg webgl"],
  ["ボット", "チャットボット ai"],
  ["bot", "チャットボット ai"],
  ["チャット", "チャットボット ai"],
  ["問い合わせ対応", "チャットボット ai 自動"],
  ["インスタ", "sns instagram"],
  ["ツイッター", "sns x twitter"],
  ["ライン", "sns line 通知"],
  ["連携", "連携 api システム"],
  ["アニメ", "アニメーション 動き"],
  ["動き", "アニメーション"],
  ["拡張現実", "ar"],
  ["多言語", "多言語 翻訳 英語"],
  ["英語", "多言語 翻訳"],
  ["予約", "予約 チャットボット フォーム"],

  /* AI まわり（一般語 → 用語解説へつなぐ） */
  ["生成ai", "ai 生成AI llm"],
  ["人工知能", "ai"],
  ["エーアイ", "ai"],
  ["chatgpt", "生成ai ai llm"],
  ["claude", "生成ai ai llm"],
  ["gemini", "生成ai ai llm"],
  ["機械学習", "ai 学習"],
  ["ディープラーニング", "ai 深層学習 機械学習"],
  ["自動化", "ai エージェント 効率化"],
  ["ハルシネーション", "誤答 ai 根拠"],

  /* Web の一般語 */
  ["ホームページ", "web制作 サイト ホームページ"],
  ["hp", "ホームページ web制作 サイト"],
  ["webサイト", "web制作 サイト"],
  ["ウェブ", "web"],
  ["リニューアル", "web制作 作り直し 既存"],
  ["作り直し", "リニューアル web制作"],
  ["スマホ対応", "レスポンシブ モバイル"],
  ["モバイル", "レスポンシブ スマホ対応"],
  ["検索", "seo 検索エンジン"],
  ["上位", "seo 検索順位"],
  ["集客", "seo 集客 コンバージョン"],
  ["アクセス", "seo アクセス 集客"],
  ["ワードプレス", "wordpress cms 更新"],
  ["更新", "cms 更新 保守"],
  ["メンテナンス", "保守 運用"],
  ["サポート", "保守 運用 サポート"],
  ["表示速度", "速度 core web vitals 表示"],
  ["重い", "表示速度 速度"],
  ["独自ドメイン", "ドメイン url"],
  ["レンタルサーバー", "サーバー ホスティング"],
  ["セキュリティ", "ssl https 安全"],
  ["アプリ", "pwa アプリ"],
  ["ノーコード", "ノーコード wix studio 自作"],
  ["地図", "meo google マップ 店舗"],
  ["マップ", "meo google 地図 店舗"],

  /* 組み込み・IoT */
  ["組込み", "組み込み embedded"],
  ["組込", "組み込み embedded"],
  ["ファーム", "ファームウェア 組み込み"],
  ["マイコン", "組み込み ファームウェア esp32 stm32"],
  ["センサー", "iot 組み込み 計測"],
  ["デバイス", "組み込み iot 機器"],

  /* 会社・問い合わせ */
  ["場所", "所在地 住所 京都"],
  ["どこ", "所在地 住所 京都"],
  ["住所", "所在地 京都 伏見"],
  ["遠方", "対応エリア 地域 オンライン"],
  ["エリア", "対応エリア 地域"],
  ["相談したい", "問い合わせ 相談 無料"],
  ["依頼", "問い合わせ 相談 発注"],
];

function normalize(text: string): string {
  const base = text.normalize("NFKC").toLowerCase();
  // 展開語がさらに別の同義語を呼ぶ連鎖を避けるため、判定は常に元の文字列に対して行う
  const expansions = SYNONYMS.filter(([from]) => base.includes(from)).map(([, to]) => to);
  return expansions.length ? `${base} ${expansions.join(" ")}` : base;
}

/** 記号・助詞のみの並びを除くための簡易ストップ文字 */
const STOP_CHARS = /[\s、。，．,.!?！？「」『』（）()【】・…ー~〜:：;；'"”“]/g;

export function tokenize(text: string): string[] {
  const norm = normalize(text).replace(STOP_CHARS, " ");
  const tokens: string[] = [];

  for (const w of norm.split(/\s+/)) {
    if (!w) continue;

    // 文字 bi-gram（1文字語はそのまま）。日本語はこれが主役。
    const chars = Array.from(w);
    if (chars.length === 1) {
      tokens.push(chars[0]);
    } else {
      for (let i = 0; i < chars.length - 1; i += 1) {
        tokens.push(chars[i] + chars[i + 1]);
      }
    }

    /* 英数字は「語まるごと」も足す。
       ⚠️ ここを分けているのは実際に外していた不具合への対処です。
       以前は「英数字だけの語」と「日本語混じりの語」を排他にしていたため、
       文書側の `SEO`（→ seo）と、質問側の `SEOって何？`（→ se, eo, oっ …）が
       まったく別のトークンになり、当たりませんでした。
       いまは両方から bi-gram と語まるごとの両方を出すので、必ず交わります。 */
    for (const run of w.match(/[a-z0-9]{2,}/g) ?? []) {
      tokens.push(run);
    }
    // c++ / next.js のように記号を含む語は、そのままでも1トークンとして扱う
    if (/[./+#-]/.test(w) && /^[a-z0-9./+#-]+$/.test(w)) tokens.push(w);
  }
  return tokens;
}

/* ------------------------------------------------------------------
 * 3. BM25 インデックス
 * ---------------------------------------------------------------- */

type IndexedDoc = {
  doc: KbDoc;
  tf: Map<string, number>;
  length: number;
};

const K1 = 1.4;
const B = 0.72;

function buildIndex(docs: KbDoc[]) {
  const indexed: IndexedDoc[] = docs.map((doc) => {
    // 検索対象は「key（質問・見出し）」を重めに、本文も含める
    const tokens = [...tokenize(doc.key), ...tokenize(doc.key), ...tokenize(doc.answer)];
    const tf = new Map<string, number>();
    tokens.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    return { doc, tf, length: tokens.length };
  });

  const df = new Map<string, number>();
  indexed.forEach(({ tf }) => {
    tf.forEach((_, term) => df.set(term, (df.get(term) ?? 0) + 1));
  });

  const avgLength = indexed.reduce((sum, d) => sum + d.length, 0) / (indexed.length || 1);
  return { indexed, df, avgLength, total: indexed.length };
}

const INDEX = buildIndex(kbDocs);

export type SearchHit = {
  doc: KbDoc;
  score: number;
  /** 0〜1 に正規化した関連度（UI表示用） */
  relevance: number;
  /** スコアのうち「内容語」が占める割合（0〜1）。低いほど、てにをはだけで当たっている。 */
  focus: number;
  /**
   * 質問に含まれる内容語のうち、この文書に入っていた割合（0〜1）。
   * BM25のスコアは知識源の大きさで桁が変わるのに対し、こちらは常に 0〜1 なので、
   * 「答えてよいか」の判定はこちらを主に使います。
   */
  coverage: number;
};

/**
 * 内容語（＝そのトークンを含む文書が全体の何割以下なら“珍しい”とみなすか）。
 * 「ます」「すか」のような文末表現はほぼ全文書に現れるため、これで内容語と切り分けます。
 */
const CONTENT_TERM_DF_RATIO = 0.25;

/**
 * BM25 で知識ドキュメントを検索する。
 * @param query ユーザーの質問
 * @param topK 返す件数
 */
export function searchKb(query: string, topK = 3): SearchHit[] {
  return searchIn(INDEX, query, topK);
}

/** 任意の索引に対して BM25 検索を行う（`searchKb` の中身） */
function searchIn(index: ReturnType<typeof buildIndex>, query: string, topK: number): SearchHit[] {
  const INDEX = index;
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const contentDfLimit = INDEX.total * CONTENT_TERM_DF_RATIO;

  // 一致率（coverage）の分母。珍しい語＝内容語だけを対象にする
  // （「ですか」「ますか」のような文末表現で分母を薄めない）。
  const unique = Array.from(new Set(terms));
  /* ひらがなだけの語は数えない。
     日本語で意味を担うのは漢字・カタカナ・英数字で、`って` `ですか` `どう` のような
     ひらがなだけの bi-gram は文法の部品です。これを一致率の分母に入れると、
     `ARって何` のように内容語が1つしかない短い質問で一致率が不当に下がり、
     答えられるはずの質問を取りこぼします。 */
  // 「何」を含む語（〜は何・何ですか）も疑問の言い回しなので数えない
  const meaningful = unique.filter((t) => /[^ぁ-ゖー]/.test(t) && !t.includes("何"));
  const base = meaningful.length > 0 ? meaningful : unique;
  const contentTerms = base.filter((t) => (INDEX.df.get(t) ?? 0) <= contentDfLimit);
  const coverageTerms = contentTerms.length > 0 ? contentTerms : base;

  const scored = INDEX.indexed.map(({ doc, tf, length }) => {
    let score = 0;
    // 内容語だけで積んだスコア。全体に占める割合が focus。
    let contentScore = 0;
    for (const term of terms) {
      const f = tf.get(term);
      if (!f) continue;
      const n = INDEX.df.get(term) ?? 0;
      const idf = Math.log(1 + (INDEX.total - n + 0.5) / (n + 0.5));
      const denom = f + K1 * (1 - B + (B * length) / INDEX.avgLength);
      const part = idf * ((f * (K1 + 1)) / denom);
      score += part;
      if (n <= contentDfLimit) contentScore += part;
    }
    const matched = coverageTerms.filter((t) => tf.has(t)).length;
    return {
      doc,
      score,
      focus: score > 0 ? contentScore / score : 0,
      coverage: matched / coverageTerms.length,
    };
  });

  /* 並べ替えは BM25 のスコアだけでなく、質問の内容語をどれだけ拾えているか（coverage）
     で重み付けする。BM25 は「その語が珍しいか」で決まるため、質問の一部にしか触れて
     いない文書が、質問全体に答えている文書を僅差で押しのけることがあった
     （例：「ホームページのリニューアルもできますか？」で、リニューアルの説明ではなく
     事業内容の一覧が先頭に来ていた）。 */
  const ranked = scored.map((s) => ({ ...s, rank: s.score * (0.5 + s.coverage) }));
  ranked.sort((a, b) => b.rank - a.rank);
  const best = ranked[0]?.rank ?? 0;

  return ranked
    .filter((s) => s.score > 0)
    .slice(0, topK)
    .map(({ rank, ...s }) => ({
      ...s,
      relevance: best > 0 ? rank / best : 0,
    }));
}

/**
 * 回答に足るスコアがあるかの下限（BM25の生スコア）。
 * 1語だけ偶然かすった一致を落とすための足切りで、主役は下の `coverage` です。
 */
export const CONFIDENCE_THRESHOLD = 6.0;

/**
 * スコアのうち内容語が占める割合の下限。
 * 「〜ますか」のような言い回しだけで点が積み上がった一致を弾きます。
 */
export const FOCUS_THRESHOLD = 0.25;

/**
 * 「そのまま答えてよい」一致率（`coverage`）の下限。
 *
 * 実測（想定質問31問）にもとづく値：
 *   ちゃんと答えたい質問 … 0.43〜1.00（大半は 0.6 以上）
 *   無関係な質問         … 「あなたの好きな色は？」0.00、「明日の天気は？」0.20、
 *                          「おすすめのラーメン屋を教えて」0.33
 * 生スコアは知識源が増えるたびに桁が変わる（実測 7〜135）ため境界を引けませんが、
 * 一致率は常に 0〜1 なので、知識を足しても基準を引き直さずに済みます。
 */
export const COVERAGE_CONFIDENT = 0.5;

/**
 * 「ぴったりではないが、近い内容として案内してよい」一致率の下限。
 * ここと `COVERAGE_CONFIDENT` の間は、断定せずに前置きを付けて答えます
 * （「AR」だけのような短い質問を、答えられるのに突き放さないため）。
 */
export const COVERAGE_NEAR = 0.35;

export function isConfident(hit: SearchHit | undefined): hit is SearchHit {
  return (
    !!hit &&
    hit.score >= CONFIDENCE_THRESHOLD &&
    hit.focus >= FOCUS_THRESHOLD &&
    hit.coverage >= COVERAGE_CONFIDENT
  );
}

/** 断定はしないが「近い内容」として案内してよいか */
export function isNear(hit: SearchHit | undefined): hit is SearchHit {
  if (!hit) return false;
  if (hit.score < CONFIDENCE_THRESHOLD || hit.coverage < COVERAGE_NEAR) return false;
  return !isConfident(hit);
}

/* ------------------------------------------------------------------
 * 4. 回答の組み立て
 * ---------------------------------------------------------------- */

/** 近い内容を案内するときの前置き */
const NEAR_PREFACE = "ぴったりの記載は見つかりませんでしたが、近い内容としてご案内します。\n\n";

/** 知識源から答えられなかったときの文面 */
export const NO_ANSWER_TEXT =
  "申し訳ありません。そのご質問にお答えできる情報が見つかりませんでした。憶測でお答えするより、担当者から正確にご回答します。お問い合わせからご連絡ください（初回のご相談・お見積もりは無料です）。";

export type KbAnswer = {
  /** answer＝そのまま回答／near＝近い内容として案内／none＝答えない */
  kind: "answer" | "near" | "none";
  /** 画面に出す本文 */
  text: string;
  /** 根拠として見せる文書（none のときは空。無関係なページを根拠に見せない） */
  sources: SearchHit[];
};

/**
 * 質問文から回答を組み立てる。
 *
 * 検索（BM25）→ 確信度の判定 → 文面の決定までをここに集約しています。
 * サイト内アシスタントとデモで判定がずれないようにするためです。
 */
export function askKb(query: string, topK = 3): KbAnswer {
  const hits = searchKb(query, topK);
  const top = hits[0];
  if (isConfident(top)) return { kind: "answer", text: top.doc.answer, sources: hits };
  // 別名で受け直す（isConfident が型ガードなので、そのままだと undefined に絞られてしまう）
  const candidate = hits[0];
  if (isNear(candidate)) {
    return { kind: "near", text: NEAR_PREFACE + candidate.doc.answer, sources: hits };
  }
  return { kind: "none", text: NO_ANSWER_TEXT, sources: [] };
}

/* ------------------------------------------------------------------
 * 知識源を差し替えて使う（職種別デモサイト用）
 * ---------------------------------------------------------------- */

/**
 * 別の知識源で同じ検索エンジンを動かす。
 *
 * 職種別デモサイト（`/demosite/<職種>`）のチャットボットは、
 * 当社の情報ではなく**そのお店・その医院のよくある質問**に答える必要があります。
 * 仕組み（BM25・根拠の表示・答えられないときは答えない）はそのままに、
 * 読ませる文書だけを入れ替えられるようにしたものです。
 *
 * 【小さな知識源での判定】
 * 文書が十数件しかないと BM25 のスコアは全体的に小さく出るため、
 * 大きな知識源向けに調整した `CONFIDENCE_THRESHOLD` は使えません。
 * 代わりに「質問に含まれる内容語のうち、その文書に何割入っていたか」で判定します。
 */
export function createKbSearch(docs: KbDoc[]) {
  const index = buildIndex(docs);

  return {
    docCount: docs.length,
    search: (query: string, topK = 3) => searchIn(index, query, topK),
    /**
     * 小さな知識源向けの「答えてよいか」判定。
     * 一致率（`coverage`）は検索側で計算済みなので、ここでは基準だけを緩めます
     * （文書が十数件しかないと言い回しの重なりが起きにくく、一致率が出にくいため）。
     */
    isConfident: (hit: SearchHit | undefined): hit is SearchHit =>
      !!hit && hit.score > 0 && hit.coverage >= 0.35,
  };
}

/** チャット欄に出すサジェスト質問 */
export const suggestedQuestions = [
  "AIって何ですか？",
  "Web制作では何をするのですか？",
  "料金の目安を教えてください",
  "AIを使うとどれくらい速いですか？",
  "SEOとAEO・LLMOの違いは？",
  "3DCGでどんなことができますか？",
  "AIチャットボットは作れますか？",
  "ホームページのリニューアルもできますか？",
  "既存システムと連携できますか？",
  "組み込み・IoTの開発もできますか？",
  "会社はどこにありますか？",
];
