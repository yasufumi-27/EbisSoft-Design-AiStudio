# ⚠️ このリポジトリはデザイン案 03「AI STUDIO」の検討用フォークです

本番サイト（`yasufumi-27/EbisSoft` / https://www.yebisusoft.jp ）とは**別物**です。
ここでの変更が本番へ反映されることはなく、本番への配信経路も削除してあります。
逆に、**本番リポジトリのファイルをこのリポジトリから触ってはいけません**。

- テーマ：未来を試作するラボ／漆黒パープル×紫の発光
- AIアシスタントのキャラクター：**CHROMA（クロマ）**（`src/components/assistant/Mascot3d.tsx`。Three.jsのプロシージャル生成）
- **会社ロゴだけは本番と完全に同一**。`CompanyLogo.tsx` / `Logo.tsx` / `fx/logo3d.ts` の色は
  テーマトークンではなく本番の値を直接指定しているので、テーマを触るときも変えないこと。

---

@AGENTS.md

# このプロジェクトについて（エビスソフト）

京都市伏見区の「エビスソフト」の集客サイト（SEO/AEO/LLMO特化）。
AI活用型のWeb制作に加え、組み込みソフトウェア・IoT開発も手がける。京都商工会議所所属。
正式名称は「エビスソフト」で**法人格（株式会社等）はつかない**（`site.ts` の `legalName`）。
「できること」を実際に動くデモ（3DCG/アニメーション/AIチャットボット/SNS連携/システム連携）で見せるのが最大の特徴。
※ ディレクトリ名・GitHubリポジトリ名・basePath は歴史的経緯で `EbisSoft` のまま。
**表記ルール**：本文・見出し・メタデータ・構造化データの社名は**カタカナの「エビスソフト」のみ**（`EbisuSoft` という綴りはどこにも使わない）。
例外は**ロゴだけ** — ヘッダー/フッターのワードマーク・ファビコン・OG画像は名刺と揃えて `YEBISU SOFT`（全角スペースなし・全大文字）を使う。
**会社ロゴの正は3Dモデル**（`src/components/fx/logo3d.ts`。立体文字 YEBISU ＋回るリング＋固定の Soft ＋飛ぶ光）。
ただし**ヘッダー（サイトタイトル）とフッターのロゴだけは2Dのフラット版**（`src/components/site/CompanyLogo.tsx` のインラインSVG。
べた塗りの平面文字＋文字を乗せないリング。3Dモデルと同じ Geist Black の輪郭をパス化してある）。
`Logo.tsx` はこの2Dロゴ＋ワードマーク `YEBISU SOFT` の組み合わせ。ファビコンだけは潰れないよう `YE` マークにしている。
サイト背景の3D演出（`fx/ThreeBackground.tsx`）と3DCGデモ（`demos/Demo3dcg.tsx` の「会社ロゴ」形状）は**3Dのまま**（触らない）。
印刷・資料用のロゴと名刺は `assets/brand/`（`public/` の外なのでサイトには配信されない）。
`scripts/brand-assets.py` が `site.ts`／`author.ts`／`logoFont.json` から生成するので、連絡先を変えたら再実行すること。
`assets/brand/archive/` は `EBISU` 表記時代の3Dロゴ書き出し画像。表記が古いので**使わない**。

**作業前に必ず `docs/引き継ぎ.md` を読むこと**
（現在の進捗・公開までのTODO・環境の注意点・将来構想がまとまっています）。

- サイト構成は**トップ＝要約と入口／詳細は下層ページ**。遷移優先度は `/ai`（AI活用）→ `/web`（Web制作）→ `/embedded`（組み込み）。
  ページを増やしたら `sitemap.ts`・`content.ts` の `pageLinks`・`llms.txt` を必ず更新すること。
- サイト情報の単一情報源：`src/lib/site.ts`／掲載内容：`src/lib/content.ts`／構造化データ：`src/lib/jsonld.ts`／チャットボット知識源：`src/lib/kb.ts`
- デモは `src/components/demos/`。`content.ts` の `demoNote`（デモの制約の明示）は必ず維持すること。
- `★` 印は差し替え必須のプレースホルダ。
- Bashサンドボックスがネット遮断中：`npm install`/`npm run build` は `dangerouslyDisableSandbox: true` で実行。
