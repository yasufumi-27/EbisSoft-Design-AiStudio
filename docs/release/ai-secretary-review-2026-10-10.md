# AI秘書専用ページ — 編集・品質レビュー

対象: `/ai-secretary`。確認日: 2026-10-10。

## 実装

トップ・AI活用ページへの大きなAI秘書紹介を元の構成に戻し、独立したサービスページを追加。
本番のcanonicalは `https://www.yebisusoft.jp/ai-secretary`。
「AI秘書」「秘書 AI」の検索意図に合わせ、定義・用途・AI社長秘書・費用・導入手順・
連携・承認・権限・誤回答の限界を説明。Service／WebPage／BreadcrumbList／FAQPageを
表示と同期し、フッター・関連ページ情報・sitemap・llms.txtに追加した。
キーワードの詰め込みや架空の実績・削減率・レビュー・人間の監修を掲載していない。

## E-E-A-T編集確認

- Experience: 当サイトの文書検索・音声入力の個別デモを実装の確認先として掲載。
  `src/lib/kb.ts` のBM25検索とサンプル資料という範囲を明示。画面例は架空データと表示。
  AI秘書の完成品や顧客導入実績として扱わない。
- Expertise: 対象業務と出力例、API・契約・権限の確認、参照元、人の承認、誤回答、
  試行時の評価項目、費用の変動要素を具体化。
- Authoritativeness: 実在の提供者エビスソフト、会社概要・代表者の確認先、住所・電話を掲載。
  編集主体と生成AIを用いた作成方法を開示し、未実施の人間による監修を付与しない。
- Trust: 個別見積もり、外部サービス利用料、重要操作の承認、データの保存先と保持期間を説明。
  Microsoft公式のプライバシー資料はMicrosoft製品を用いる場合の確認資料として限定。

Googleの人を優先したコンテンツ・タイトルのガイドを参照して確認した。
E-E-A-Tはこの編集評価であり、Googleによる認証・数値スコアではない。

一次資料:
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/appearance/title-link
- https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy

## Lighthouse

本番用の静的成果物を圧縮なしのローカルHTTPで配信し、Lighthouse 13.5.0で測定。
モバイルは公式既定設定、PCは公式desktopプリセット、各3回。
実際のGA4外部タグを有効にし、監査対象・通信／CPU制限を変更していない。

**全6回、Performance・Accessibility・Best Practices・SEOの4項目が100点（score=1）。**

GitHub Pagesはプレビュー方針のnoindexを維持するため、公開プレビューのSEO点数と
本番用出力の100点を混同しない。実際の本番サイトへの転送は行っていない。
検索順位・AI引用・実ユーザーCore Web Vitalsの保証ではない。

## 配信方式と機能保持

専用ページはサーバー描画のHTML・通常のリンク・ネイティブdetailsで構成。
`prepare-secretary-page.mjs` が、このページの専用CSSと本番の実際の解析を残して配信する。
使用しないReactのhydration／RSC起動コード、他ページ向け共通CSS・Webフォントを
当該ページの直接配信から除外。検査専用の処理ではなく、本番／Pagesの両ビルドで適用する。
既存のReactサイトの配信形式は変更しない。
GA4の読み込み・config・contact_tapキュー、JavaScript無効時の本文、FAQ開閉を確認。

## 表示・リンク・技術確認

375・768・1440pxのスクリーンショットを目視し、はみ出し・重なりなし。
見出し階層、キーボードフォーカス、スキップリンク、FAQ操作を確認。
本文とJSON-LDのFAQ8件が一致。内部リンク・目次14件、canonical・robotsを確認。
本番用ビルド（型検査含む）・lint・出力監査（76 HTML／51 routes）が成功。

証拠（Git管理対象外）: `output/ai-secretary-review/`
- `lighthouse-summary.json`: 6回のスコア・指標・日時・設定・成果物ハッシュ
- `mobile-1..3.report.json/html`, `desktop-1..3.report.json/html`: 生レポート
- `release-review.json`: 検査範囲・ブラウザー情報・編集評価
- `content-checks.json`: metadata・構造化データ・リンク・主張と根拠
- `visual-checks.json`, `hero-*.png`, `faq-*.png`: 表示・操作・GA4確認
- `production.html`: 審査した本番用のページHTML

初回のPerformance 74点と途中測定も保存している。最終6回の測定後に、本番用成果物を
変更していない。Pages用出力は別ビルドであり、本番用計測の成果物とは区別する。
