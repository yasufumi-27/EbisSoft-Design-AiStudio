# エビスソフト — デザイン案 03「AI STUDIO」（未来を試作するラボ／漆黒パープル×紫の発光）

> **これは本番サイトではありません。**
> 新デザインの検討用に、本番リポジトリ（`EbisSoft`）をフォークして
> デザイン層だけを差し替えたものです。ここでの変更が本番へ反映されることはありません。
> 本番へ配信する経路（`deploy-sakura.yml` / `scripts/deploy-sakura.sh` / `build:sakura` 系スクリプト）は
> **このリポジトリから削除済み**です。

- このデザイン案: https://yasufumi-27.github.io/EbisSoft-Design-AiStudio
- もう一方のデザイン案: 別リポジトリで同じ構成で公開しています
- 本番（触らないこと）: https://www.yebisusoft.jp / リポジトリ `yasufumi-27/EbisSoft`

## 本番から変えたところ

| 層 | 変更 |
| --- | --- |
| 配色（`src/app/globals.css` の `@theme`） | 未来を試作するラボ／漆黒パープル×紫の発光のパレットへ全面差し替え。Tailwind の slate ランプごと振っているため、全ページの本文色が一括で乗る |
| トップページ（`src/components/sections/HomeReframed.tsx`） | 提案案の構成・寸法をそのまま移植 |
| 3D背景（`src/components/fx/ThreeBackground.tsx`） | 同じ構造のまま配色を差し替え |
| AIアシスタント（`src/components/assistant/`） | ドット絵ロボットを廃止し、**CHROMA（クロマ）** を3DCGで新規制作。クロームの多面体コア＋紫に光る横一文字の目＋回る光輪。 |

## 本番から変えていないところ

- **会社ロゴ**（`src/components/site/CompanyLogo.tsx` / `Logo.tsx` / `fx/logo3d.ts`）は本番とまったく同一です。
  サイトのテーマ色を振っても影響が出ないよう、ワードマークの色だけテーマトークンから切り離して直接指定しています。
- **ページ構成**（16ルート）、**掲載内容**（`src/lib/content.ts`）、**構造化データ**、**実動デモ15種**は本番のままです。
- GitHub Pages 配信時は本番と同様、`robots.txt` の全面 disallow と各ページの `noindex` が効きます
  （本番と内容が重複するため、検索対象にしない）。

---

以下は本番リポジトリから引き継いだ元のREADMEです。

# エビスソフト — AI活用型Web制作・組み込み開発の集客サイト

- 本番: https://www.yebisusoft.jp （`npm run deploy:sakura`。さくらのレンタルサーバへ FTPS で転送）
- プレビュー: https://yasufumi-27.github.io/EbisSoft （main への push で自動デプロイ）

京都市伏見区の**エビスソフト**の、受注（集客）を目的としたサービスサイトです。
Web制作に加え、組み込みソフトウェア・IoT機器の開発も手がけています（京都商工会議所所属）。
「**AIを駆使して、最速で、高性能なサイトを**」をコンセプトに、
SEO / AEO / LLMO（AI検索最適化）実装込みで構築しています。

最大の特徴は、**「できること」をすべて実際に動くデモとして公開している**ことです
（3DCG・Webアニメーション・AIチャットボット・SNS連携・システム連携）。

> ⚠️ 連絡先・住所・ドメイン・SNS等は仮の値（`★`印）で入っています。
> 公開前に [`src/lib/site.ts`](src/lib/site.ts) と `.env.local` を実際の情報へ差し替えてください。

## 技術スタック

| 項目 | 採用技術 |
| --- | --- |
| フレームワーク | Next.js 16（App Router / Turbopack） |
| 言語 | TypeScript |
| UI | React 19 |
| スタイル | Tailwind CSS v4 |
| 3D / WebGL | Three.js（背景演出＋3DCGデモ） |
| デモ実装 | 追加ライブラリなし（CSS Animations / Web Animations API / 自前のBM25検索） |
| 画像生成 | `next/og`（OG画像・アイコンを動的生成） |
| フォーム | React Server Actions ＋ `useActionState` |

## セットアップ

```bash
npm install
cp .env.example .env.local   # 必要に応じて値を編集
npm run dev                  # http://localhost:3000
```

### スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm start` | 本番サーバー（要 build） |
| `npm run lint` | ESLint |

## ディレクトリ構成

```
src/
├ app/
│  ├ layout.tsx            # 全体メタデータ・viewport・共通JSON-LD（事業者/サイト）
│  ├ page.tsx             # トップページ（各セクション＋ページ固有JSON-LD）
│  ├ demo/page.tsx       # /demo できること一覧
│  ├ demo/[slug]/page.tsx# /demo/<slug> 各デモの詳細ページ（静的生成）
│  ├ company/page.tsx    # /company 会社概要（E-E-A-T）
│  ├ privacy/page.tsx    # /privacy プライバシーポリシー
│  ├ llms.txt/route.ts   # /llms.txt（LLMO）
│  ├ actions.ts          # お問い合わせのServer Action（★送信処理はTODO）
│  ├ contact-state.ts    # フォーム状態の型・初期値
│  ├ sitemap.ts          # /sitemap.xml
│  ├ robots.ts           # /robots.txt
│  ├ manifest.ts         # /manifest.webmanifest
│  ├ opengraph-image.tsx # /opengraph-image（SNSシェア画像を動的生成）
│  ├ twitter-image.tsx   # /twitter-image（OG画像を再利用）
│  ├ icon.svg            # ファビコン（SVG）
│  ├ apple-icon.tsx      # Apple Touch Icon（動的生成）
│  └ globals.css         # デザイントークン（ブランドカラー・フォント）
├ components/
│  ├ site/               # Header / Footer / Logo / Breadcrumbs
│  ├ sections/           # Hero, AiPower, Capabilities, Services, Pricing, FAQ ...
│  ├ demos/              # ★実際に動くデモ15種＋共通UI＋遅延ローダー
│  ├ fx/                 # 3D背景・リビール・カーソル光・セクションナビ等の演出
│  ├ ui/                 # Container / Section / Button / PageHeader / icons
│  └ JsonLd.tsx          # 構造化データ描画
└ lib/
   ├ site.ts             # ★サイトの単一情報源（社名/URL/NAP/SNS など）
   ├ content.ts          # 掲載コンテンツ（できること/サービス/料金/FAQ/AI活用…）
   ├ kb.ts               # AIチャットボットの知識源＋BM25検索エンジン
   └ jsonld.ts           # 構造化データのビルダー
```

## 「できること」デモについて

`src/components/demos/` に、15領域の**実際に動くデモ**を実装しています（AIを活用して合計約3時間で実装）。
すべてクライアントで遅延読み込みされ（`DemoLoader`）、初期表示（LCP）には影響しません。

| デモ | 実装 | 本番との違い |
| --- | --- | --- |
| `Demo3dcg` | Three.js のリアルタイムWebGL描画。形状/素材/カラー/光量/自動回転を操作可 | 実案件では顧客の製品データ（glTF等）を読み込む |
| `DemoConfigurator` | SVGをその場で組み立てて描画。仕様に応じて見た目・価格・納期・構成コードが変わる | 価格表・在庫・納期を基幹システム／Shopify等のAPIから取得 |
| `DemoAnimation` | CSS Animations / Web Animations API のみで8パターン | ほぼ同等（案件によりGSAP等を選定） |
| `DemoChatbot` | `lib/kb.ts` の日本語N-gram＋BM25検索で**根拠つき回答**。閾値未満は答えない。会話内で予約まで完結 | 検索の後段に Claude 等のLLMを接続して自然文生成に置換 |
| `DemoSimulator` | 選択条件から概算金額・内訳・期間・おすすめプラン・月額を実計算 | 料金ルールを顧客の価格表に差し替え、結果をフォーム／CRMへ連携 |
| `DemoRecommend` | 特徴ベクトルのコサイン類似度＋共起行列で実際に並べ替え、推薦理由も提示 | サーバー側のベクトル検索と実際の行動ログに置換 |
| `DemoAr` | WebXR／カメラ重ね合わせ／実寸プレビューを端末に応じて自動で出し分け | 顧客の製品モデルを読み込み、iOS向けUSDZも書き出す |
| `DemoVoice` | Web Speech API で実際に聞き取り・読み上げ（Safari含む） | リアルタイム音声APIに置換してより自然な会話に |
| `DemoMultilingual` | Intl API で通貨・日付・数値をロケール変換。hreflangも構成から生成 | 翻訳文をAI翻訳＋ネイティブレビューの本番運用に |
| `DemoAiAgent` | **このサイトの実 llms.txt を fetch し、実 JSON-LD を解析** | エージェントの在庫照会・予約の実行をAPIに接続 |
| `DemoPersonalize` | 属性の切り替えで見出し・課題・実績・CTAが実際に差し替わる（`?seg=` で自動判定） | 判定をリファラ・広告パラメータ・行動履歴から行う |
| `DemoInsight` | クリック位置を実記録してCanvasにヒートマップ描画。A/Bテストは2標本Z検定で判定 | 記録を計測基盤に送り、実訪問者のデータで同じ画面を作る |
| `DemoPwa` | Service Workerの登録状況・キャッシュ数・通知許可を**実測表示** | 通知をローカルから Web Push（サーバー配信）へ |
| `DemoSns` | フィードはサンプルデータ。OGPカードプレビューは入力に即時追従する実装 | フィードを各SNSの公式APIへ接続 |
| `DemoIntegration` | ブラウザ内モックAPI。遅延・失敗・指数バックオフのリトライ・Webhook通知が実際に動く | モック部分を顧客の実システムAPIに差し替え |

> デモページには必ず「どこまでが実装で、本番では何が変わるか」を明記しています（`content.ts` の `demoNote`）。
> 誇張しないことが E-E-A-T の Trust に直結するため、この方針は維持してください。

## 実装済みのSEO対策

- **メタデータ**: タイトルテンプレート、ディスクリプション、キーワード、`canonical`（絶対URL）
- **OGP / Twitter Card**: `og:*` 一式、`summary_large_image`、画像は動的生成（`/opengraph-image`）
- **構造化データ（JSON-LD）**:
  - `ProfessionalService` + `Organization`（住所・座標・営業時間・対応エリア・`hasOfferCatalog`）＋ `WebSite`
  - `BreadcrumbList`（表示パンくずと内容同期）
  - `ItemList`（提供サービス／できること）
  - `Service` + `WebApplication`（各デモページ：動く実物があることを明示）
  - `HowTo`（制作の流れ）、`FAQPage`（FAQと内容同期）、`WebPage`/`CollectionPage`/`AboutPage` + `Speakable`
- **AEO / LLMO**: `/llms.txt`、AIクローラー明示歓迎（`robots.ts`）、結論ファーストの要点ブロック、`knowsAbout`
- **E-E-A-T**: 実際に動くデモ（Experience）／AI活用手法の一次情報公開（Expertise）／会社概要・NAP明記（Authoritativeness）／デモの制約明示・プライバシーポリシー（Trust）
- **クロール制御**: `robots.txt`、`sitemap.xml`、`robots` メタ（`max-image-preview:large` 等）
- **PWA**: `manifest.webmanifest`、各種アイコン、`theme-color`
- **パフォーマンス（Core Web Vitals）**: Webフォント最小化（ラテンのみ自己ホスト＋日本語はシステムフォント）、画像レス（CSS製ビジュアル）、静的プリレンダリング
- **セマンティクス / a11y**: 唯一の `<h1>`、見出し階層、`lang="ja"`、フォームのラベル/`aria-*`
- **セキュリティヘッダ**: `Strict-Transport-Security` / `X-Content-Type-Options` / `Referrer-Policy` ほか（[`next.config.ts`](next.config.ts)）

## 🚀 公開前チェックリスト

- [ ] [`src/lib/site.ts`](src/lib/site.ts) の `★` 印（社名・住所・電話・メール・SNS・設立日）を実情報に
- [ ] `.env.local` に本番ドメイン `NEXT_PUBLIC_SITE_URL` を設定
- [ ] Google Search Console の確認コード `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` を設定
- [ ] [`src/app/actions.ts`](src/app/actions.ts) の `TODO` に**実際の送信処理**（メール送信/CRM連携）を実装
- [ ] [`src/lib/content.ts`](src/lib/content.ts) の文言・料金・スピードの数値を実情報に合わせて確認
- [ ] `public/favicon.ico`（現状は仮）と `app/icon.svg` を正式ロゴに差し替え
- [ ] （任意）OG画像に日本語を入れる場合は日本語フォント（例: Noto Sans JP）の `.ttf` を
      バンドルし、`app/opengraph-image.tsx` の `ImageResponse` に `fonts` を渡す
- [ ] Search Console へ `sitemap.xml` を送信

## カスタマイズ

- **ブランドカラー / フォント**: [`src/app/globals.css`](src/app/globals.css) の `@theme`（`--color-brand` ほか）
- **掲載内容**: [`src/lib/content.ts`](src/lib/content.ts)（UIと構造化データの両方に反映されます）
- **サイト情報**: [`src/lib/site.ts`](src/lib/site.ts)
