# AI秘書ページのSEO・編集改善

対象: `/ai-secretary`。編集日: 2026-10-10。

## 検索意図と内容

「AI秘書」「秘書 AI」を中心に、定義・業務・社長秘書としての利用・選び方・導入費用を
同じページで判断できる構成にした。検索結果を探索したが、検索ボリュームや順位の
測定としては扱わない。他社本文や未検証の効果数値は転用していない。

- タイトルに開発・導入・費用を明示。既製アプリの販売との違いが分かる本文を追加。
- 既製アプリ・個別開発・人の秘書との役割分担を、選択の判断材料として説明。
- 基本3機能それぞれに、入力情報・成果物・人が確認する点を掲載。
- 時間削減だけでなく、確認と修正の負担・情報の抜け・連携エラーも試行で評価。
- 料金と3機能の範囲は従来どおり。実績、削減率、導入社数、レビューは作っていない。
- FAQは10件。表示本文とFAQPageの回答は同じデータを使用。
- AI活用ページの既存案内に、機能と費用が分かる通常のHTMLリンクを追加。

## 技術的な整合

専用ページのWebPage公開日が共通ヘルパーの既定値（創業日2001-04-01）に
なっていたため、このページが初めてプレビュー公開された2026-10-10に上書きした。
更新日は本文・WebPage・sitemapで同じ編集日を使用し、ビルド日時では更新しない。
WebPageのmainEntityとServiceを相互参照し、providerは共通のOrganizationのIDへ統一。
架空の朝の報告画面はdata-nosnippetを付け、検索スニペットに実データのように使われる
可能性を抑えた。画面自体と「架空データ」の表示は維持する。

canonicalは本番の `/ai-secretary`。本番用HTMLはindex可、プレビューのGitHub Pagesは
noindexを維持する。通常のHTMLで内容とリンクを読める構成を保持した。
キーワードの詰め込み、別表記ごとの重複ページ、隠しテキストは追加しない。

## 評価方針と参照資料

Googleの公式ガイドに従い、利用者が導入判断できる内容と根拠を優先する。
E-E-A-TをGoogle認証や数値スコアとして扱わない。LighthouseのSEO100点も
検索順位、インデックス登録、実ユーザーのCore Web Vitalsを保証するものではない。
meta keywords・llms.txt・FAQ構造化データをランキング上昇の根拠にしない。
Googleの2026-06-15更新ではFAQリッチリザルトの廃止と、llms.txtはGoogle検索の
可視性・順位に影響しない旨が説明されている。FAQPageは内容の構造表現として保持する。

- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/snippet
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- https://developers.google.com/search/updates

## 検証と公開の区別

証拠の保存先: `output/ai-secretary-seo-review/`（Git管理対象外）。
本番用ビルド・型検査・lint・76 HTML / 51 routesの監査に成功。
canonical、index指定、見出し、FAQ10件の本文一致、内部リンクと目次16件を検証。
Lighthouse 13.5.0、公式の既定モバイル設定とdesktopプリセットで各3回を測定。
実際のGA4を有効にした本番用成果物で、全6回ともPerformance・Accessibility・
Best Practices・SEOの4項目100点。計測対象HTMLのSHA-256は
`e1ecadcbf5288e01094c9614d178785ea58ffe60b9bd7ebee93a446560566385`。
`lighthouse-summary.json` と各回のHTML/JSONに設定・指標・計測時刻を保存した。

375・768・1440pxで追加セクションと料金の表示を確認。横はみ出しなし。
FAQ開閉、JavaScript無効時の本文、GA4のconfig、AI活用ページからのリンク遷移、
WebPageとServiceの相互参照、価格と公開・更新日をブラウザーで検証した。
`visual-checks.json` と各サイズの画面キャプチャに記録。

本番サイトには転送しない。GitHub Pagesに反映し、本番公開後にはSearch Consoleで
正規URLの認識・登録状況と対象クエリの表示回数・クリック率を確認する必要がある。
この作業でSearch Consoleの登録申請や順位測定は行っていない。
