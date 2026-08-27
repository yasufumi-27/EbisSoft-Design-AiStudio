import Script from "next/script";
import { ContactLinkTracker } from "./ContactLinkTracker";

/**
 * GA4（Google アナリティクス）のタグ。
 *
 * - `NEXT_PUBLIC_GA_ID`（例: G-XXXXXXXXXX）が設定されているビルドでだけ出力されます。
 *   未設定のローカル開発では何も読み込まないので、自分のアクセスで数字が汚れません。
 * - プレビュー（GitHub Pages）でも読み込みません。本番と同じ計測IDで二重に数えないためです。
 * - `afterInteractive`（既定）で読み込むため、初期表示・LCP はブロックしません。
 *
 * 設定方法は `docs/集客セットアップ.md` を参照。
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const IS_PREVIEW = process.env.GITHUB_PAGES === "true";

export function Analytics() {
  if (!GA_ID || IS_PREVIEW) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      {/* インラインスクリプトには id が必須（Next.js が重複読み込みを防ぐために使う） */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
      {/* 電話・メールリンクのタップ計測。GA4 を読み込むときだけ有効にする */}
      <ContactLinkTracker />
    </>
  );
}
