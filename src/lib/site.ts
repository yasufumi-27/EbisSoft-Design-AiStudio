/**
 * サイト全体の単一情報源（Single Source of Truth）。
 * ドメイン・社名・NAP（社名/住所/電話）・SNS などはここだけ書き換えれば
 * メタデータ・構造化データ・sitemap・OG画像にすべて反映されます。
 *
 * 本番では NEXT_PUBLIC_SITE_URL を実ドメインに設定してください（.env 参照）。
 * ★印は仮の値です。公開前に実際の情報へ差し替えてください。
 */

/**
 * 本番ドメイン。NEXT_PUBLIC_SITE_URL が未設定のときに使われます。
 * GitHub Pages（プレビュー）へのデプロイ時だけ、ワークフローが Pages の URL を渡します。
 */
const FALLBACK_URL = "https://www.yebisusoft.jp";

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** 末尾スラッシュを落としたベースURL。下層パスの連結に使う */
const SITE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_URL);

export const siteConfig = {
  /**
   * 表示用ブランド名。本文・見出し・メタ・構造化データはすべてこのカタカナ表記で統一する。
   * 英字を使ってよいのは**ロゴだけ**（ワードマーク／ファビコン／OG画像＝`YEBISU SOFT`）。
   */
  name: "エビスソフト",
  /** 正式名称。法人格（株式会社等）はつきません。表記は必ずこの形に統一すること */
  legalName: "エビスソフト",
  /** サイトのデフォルトタイトル（トップ） */
  title: "エビスソフト｜AI活用のWeb制作・組み込み開発（京都市伏見区）",
  /** タイトルテンプレートの接尾辞 */
  titleTemplate: "%s｜エビスソフト",
  /** メタディスクリプション（120〜160字目安） */
  description:
    "エビスソフトは京都市伏見区のAI活用型Web制作・組み込みソフトウェア開発事業者です。生成AIを制作フロー全体に組み込み、通常の数分の一の期間で高性能なサイトを構築。3DCG・WebGL演出、AIチャットボット、業務システム連携に加え、マイコン・IoT機器のファームウェア開発とWeb連携まで一貫対応します。SEO・AEO・LLMO（AI検索最適化）にも特化。京都商工会議所所属。",
  /** 公開URL（末尾スラッシュなし）。`${url}/ai` のように下層パスを連結する用途に使う */
  url: SITE_URL,
  /**
   * トップページの正規URL（末尾スラッシュ**あり**）。
   * canonical・OG・sitemap・構造化データなど「トップそのものを指す」用途はこちらを使う。
   * ルートは `https://example.com` と `https://example.com/` が仕様上等価だが、
   * 表記が混在すると Search Console 側の紐付けが読みにくくなるため `/` 付きに統一する。
   * （下層ページは `trailingSlash: false` のとおりスラッシュなしが正。ルートだけ別扱い）
   */
  homeUrl: `${SITE_URL}/`,
  /** OGロケール */
  locale: "ja_JP",
  /** html lang */
  lang: "ja",
  /** 検索キーワード（メタkeywords。現在のSEO評価への寄与は小さいが付与） */
  keywords: [
    "ホームページ制作 京都",
    "Web制作 京都",
    "ホームページ制作 伏見区",
    // 「京都で制作会社を探している」段階の検索語（AI検索・地図検索の入口）
    "Web制作会社 京都",
    "京都 Web制作 依頼",
    "京都 ホームページ制作 会社",
    "京都市 ホームページ制作",
    "京都 ホームページ制作 費用",
    "Webサイト制作",
    "Web制作会社",
    "AI Web制作",
    "AI ホームページ制作",
    "AI開発 京都",
    "AIチャットボット 導入",
    "コーポレートサイト制作",
    "LP制作",
    "ECサイト制作",
    "サイトリニューアル",
    "SEO対策",
    "AEO",
    "LLMO",
    "AI検索最適化",
    "AI Overviews 対策",
    "ChatGPT 検索 対策",
    "Next.js 制作",
    "3DCG制作",
    "WebGL 制作",
    "Three.js 制作",
    "Webアニメーション制作",
    "SNS連携",
    "システム連携 API",
    "組み込みソフトウェア開発",
    "組み込み開発 京都",
    "ファームウェア開発",
    "マイコン開発 受託",
    "IoT開発 京都",
    "IoT Web連携",
  ],
  /** 連絡先・NAP（ローカルSEOで重要。表記揺れを作らないこと） */
  contact: {
    telephone: "+81-90-8208-7295", // 国際表記
    telephoneDisplay: "090-8208-7295", // 表示用
    email: "yasufumi2707@icloud.com",
    address: {
      postalCode: "612-8491", // 京都市伏見区久我石原町
      region: "京都府", // 都道府県
      locality: "京都市伏見区", // 市区町村
      street: "久我石原町7-37", // 番地
      country: "JP",
    },
    /** 緯度・経度（LocalBusiness の geo）。Googleマップで所在地を検索して取得した実座標 */
    geo: { latitude: 34.949037, longitude: 135.724274 },
    /** 営業時間（schema.org openingHours 形式 / 表示用） */
    openingHoursDisplay: "平日 10:00〜19:00",
    openingHours: "Mo-Fr 10:00-19:00",
  },
  /** 価格帯（schema.org priceRange） */
  priceRange: "¥¥",
  /** 対応エリア（表示用） */
  areaServed: "関西一円（京都府・大阪府・兵庫県・奈良県・滋賀県）※遠隔地・山間部は要相談",
  /** 構造化データ areaServed 用の地域リスト（ローカルSEO） */
  areaServedList: ["京都府", "京都市", "大阪府", "兵庫県", "奈良県", "滋賀県", "関西"],
  /** 対面での打ち合わせに伺える府県（ローカルSEOの内部表現） */
  localAreas: ["京都府", "大阪府", "兵庫県", "奈良県", "滋賀県"],
  /** 対面エリアの但し書き（移動に時間がかかる地域は事前相談） */
  localAreasNote:
    "上記の府県でも、山間部や交通の便が悪い地域は移動時間の都合でご相談とさせてください。オンライン会議での打ち合わせであれば、エリアを問わず対応できます。",
  /** 専門領域。構造化データ knowsAbout に使用し、AI/LLMの「何の専門家か」理解を助ける */
  knowsAbout: [
    "AIを活用したWeb制作",
    "生成AIによる開発自動化",
    "AIチャットボット開発",
    "ホームページ制作",
    "Webサイト制作",
    "コーポレートサイト制作",
    "ランディングページ制作",
    "ECサイト構築",
    "Webアプリ開発",
    "SEO対策",
    "AEO（Answer Engine Optimization）",
    "LLMO（LLM最適化）",
    "AI検索最適化",
    "Core Web Vitals 改善",
    "3DCG制作",
    "WebGL / Three.js 演出",
    "Webアニメーション実装",
    "SNS連携・API連携",
    "業務システム連携",
    "組み込みソフトウェア開発",
    "ファームウェア開発（C / C++）",
    "マイコン制御（ルネサス RH850 / RX / RL78・ARM Cortex-M / ESP32 / STM32）",
    "IoTデバイスとクラウド・Webの連携",
    "RTOS・ベアメタル開発",
    "通信プロトコル実装（BLE / Wi-Fi / MQTT / UART / I2C / SPI）",
  ],
  /**
   * 所属団体（構造化データ memberOf に使用。E-E-A-T の Trust）。
   *
   * ⚠️ 「京都商工会」ではなく **「京都商工会議所」** が正式名称。
   *    商工会議所（商工会議所法）と商工会（商工会法）は別の団体で、京都市内（京北を除く）の
   *    事業者が入るのは商工会議所のほう。「京都商工会」という団体は存在しない。
   */
  memberOf: [
    {
      name: "京都商工会議所",
      description:
        "商工会議所法にもとづく地域総合経済団体。京都市内の商工業者が会員となり、経営相談・販路開拓・共済などの支援を行う。",
      url: "https://www.kyo.or.jp/kyoto/",
    },
  ],
  /** 設立年月日（ISO） */
  foundingDate: "2001-04-01",
  /**
   * SNS・外部プロフィール（構造化データ sameAs に使用）。
   * ★ 実在しないアカウントを載せると誤情報になるため、開設済みのURLだけを追加すること。
   * 空のあいだは sameAs / twitter:site を出力しません。
   */
  sameAs: [] as string[],
  /** X(Twitter) ハンドル。★ 開設したら "@..." を設定（未設定なら twitter:site を出力しない） */
  twitterHandle: "",
  /** OG画像の代替テキスト */
  ogImageAlt: "エビスソフト｜AI活用のWeb制作・組み込み開発（京都市伏見区）",
} as const;

export type SiteConfig = typeof siteConfig;

/** 絶対URLを生成するヘルパー */
export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
