# AI Studio 本番置き換え準備（2026-09-17）

対象: https://www.yebisusoft.jp ／ プレビュー: https://yasufumi-27.github.io/EbisSoft-Design-AiStudio/

この変更では本番サイト・DNS・サーバー設定の書き換えは行っていません。

## 検査と修正

- 本文を持つ73ページ（本サイト54、職種デモ18、制作リファレンス1）をブラウザーで検査。スマホ320px・390px、PC1440px。タブレット768pxも再検査。
- キャラクターカードと吹き出しを通常のレイアウトで分離。停止ボタンにも独立した行を確保。
- モバイルの常駐クロマを電話・相談バー内に配置。ナビゲーションとチャットパネルの表示領域を調整。
- 小幅のプライバシー見出し、トップの選択ボタン、宿泊業デモのヒーロー重なりを修正。
- 正規URL、固有タイトル、説明、H1、OG画像、JSON-LD構文、内部参照、所有権確認ファイルを `scripts/audit-export.mjs` で検査。
- 本番のサイトマップ50 URLと、新サイトの50 URLが完全一致。URL変更・削除はなく、この50件には追加リダイレクト不要。
- 下層ページのOG画像継承漏れ、プレビューのprivacyだけindexになっていた設定を修正。
- noindex対象のデモ・提案はクロール可能にし、HTMLのnoindexを読めるように調整。
- 通常ページの更新日をビルドのたびに最新と偽って出力しない。記事は編集日を使用。
- llms.txtは補助資料。Google AI機能の必須条件や掲載保証ではないことを記事にも明記。
- GitHub PagesにPHPソースを公開しないようプレビュー成果物から除外。本番用には残す。

## 本番用成果物の作り方

```sh
npm run package:production
```

`.release/ebissoft-production.tar.gz` と `.release/manifest.json`（SHA-256、ソースコミット、未コミット変更の有無）を生成する。アップロード処理は含まない。

- 本番URLを固定し、GitHub Pagesのサブパスとnoindexを解除した専用ビルド。
- `.htaccess`、`api/contact.php`、Google・Bingの所有権確認、サイトマップ、robots、llms.txt、画像を含む。
- `.env`・ソースコード・Git履歴はアーカイブに含まない。
- 最新プレビューの `out/` は本番へアップロードしない。必ず本番用アーカイブを使う。

## 切り替え前に残る確認

1. 現行サーバーの公開ディレクトリ全体をバックアップする。特に `.htaccess`、API、所有権確認、既存アセットを保存。
2. 本番公開後にGA4で計測受信を確認する。現行HTMLから確認した `G-1W66QWGV2Y` は本番ビルドに引き継ぎ済み（環境変数で上書き可）。
3. 送信者・受信者を決めたテスト問い合わせで、通知・自動返信・迷惑メール判定を確認。今回、メール送信はしていない。
4. 本番切り替えの日時を決める。

お問い合わせ: 現行サイトの `/api/contact.php` はGETに405のJSONを返すことを確認。新サイトのPHPソースは元の本番プロジェクトとSHA-256が一致。これは到達性とソース一致の確認であり、メール配送の確認ではない。

## 切り替え手順

1. 上記バックアップを完了し、復元対象と保存場所を記録する。
2. 本番用アーカイブを展開し、既存の国内ローカル環境からFTPSで配信先へ反映。既存の国外IP制限・WAFは変更しない。元プロジェクトのGitHub Actions経由の本番FTPは国外IP制限で使えない記録がある。
3. 新しいハッシュ付き `_next/static` と画像を先に配置し、ページHTML・RSC・メタ情報を後から配置する。旧ハッシュ付きファイルは当面残し、無差別な削除同期を避ける。
4. 本番の全サイトマップURLと、404・robots・sitemap・OG画像・llms.txtを確認。拡張子なしのURLと末尾スラッシュの正規化も確認する。
5. スマホでメニュー、キャラクター、チャット、相談バー、お問い合わせを確認する。
6. Search Console / Bingでサイトマップと主要URLを確認。Search ConsoleのURL検査・実測Core Web Vitalsはログイン先で別途確認する。

## 戻し方

問題があれば現行バックアップのHTML・RSC・API・`.htaccess`・静的ファイル・Service Workerを一式復元する。新旧アセットが混在しても旧HTMLから参照できるよう、切り替え直後は旧アセットを削除しない。Service Worker更新とキャッシュの状態も確認する。

## 検証の範囲

ブラウザー検査はローカルChromiumでの表示、レイアウト寸法、スクロール後の表示、画像読み込み、JavaScriptエラーを対象とする。実機iPhone Safari、メール配送、Search Console内の登録結果、実ユーザーのCore Web Vitals、検索順位・AI引用の結果は未検証。

参考: [GoogleのAI検索ガイド](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)、[noindexとクロール](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)。
