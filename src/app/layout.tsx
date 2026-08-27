import type { Metadata, Viewport } from "next";
import { Geist, Orbitron } from "next/font/google";
import "./globals.css";

import { siteConfig } from "@/lib/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@/components/analytics/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// 見出し・数値・英字ラベル用の近未来ディスプレイフォント
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
});

/** サブパス配信時のプレフィックス（GitHub Pages なら "/EbisSoft"、通常ホスティングでは ""）。 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** プレビュー環境（GitHub Pages）かどうか。本番＝さくらとの重複を避けるために使う。 */
const IS_PREVIEW = process.env.GITHUB_PAGES === "true";

/**
 * サイト全体のメタデータ。各ページはここを継承し、必要に応じて上書きします。
 * URL系フィールドは metadataBase を基準に絶対URL化されます。
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: siteConfig.titleTemplate,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.legalName, url: siteConfig.homeUrl }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  category: "Web制作",
  // 正規URL（重複コンテンツ対策）。
  // ※ ここは末尾スラッシュあり（homeUrl）を渡しても、Next が next.config の
  //   trailingSlash: false に従って正規化するため、出力は末尾スラッシュなしになる。
  //   metadata API 経由では変えられないので、sitemap・構造化データ側の
  //   「末尾スラッシュあり」表記とは見た目が揃わない。
  //   ルートは https://example.com と https://example.com/ が同一URLとして
  //   扱われる（RFC 3986・Google とも）ため、実害はない。
  alternates: {
    canonical: siteConfig.homeUrl,
  },
  // 電話番号以外の自動リンク化を抑止（postalコード等の誤リンク防止）
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.homeUrl,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    // og:image は app/opengraph-image.tsx から自動付与されます
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    // アカウント未開設のあいだは出力しない
    ...(siteConfig.twitterHandle
      ? { site: siteConfig.twitterHandle, creator: siteConfig.twitterHandle }
      : {}),
    // twitter:image は app/twitter-image.tsx から自動付与されます
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // apple-icon は動的生成ルートのため basePath が自動付与されない（Next.js 16 / output:export）。
  // サブパス配信（GitHub Pages）で 404 にならないよう、アイコンをまとめて明示指定する。
  // （metadata.icons を書くと file convention の自動出力は行われなくなるため、iconも併記）
  icons: {
    icon: [{ url: `${BASE_PATH}/icon.svg`, type: "image/svg+xml", sizes: "any" }],
    shortcut: [{ url: `${BASE_PATH}/favicon.ico`, sizes: "48x48" }],
    apple: [{ url: `${BASE_PATH}/apple-icon`, sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },
  // Search Console の所有権確認トークンを環境変数から注入（未設定なら出力されません）
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  // プレビュー（GitHub Pages）は本番と同一内容のため、インデックス対象から外す。
  // robots.txt の disallow はクロールを止めるだけで、外部リンク経由のインデックス登録は
  // 防げない。noindex を各ページの meta にも出して二重に効かせる。
  ...(IS_PREVIEW
    ? {
        robots: {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        },
      }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#07050e",
};

/**
 * ここには **本サイトにもデモサイトにも共通するものだけ** を置きます。
 *
 * ヘッダー・フッター・3D背景・常駐アシスタントは `app/(chrome)/layout.tsx` に移しました。
 * 職種別のデモサイト（`/demosite/<職種>`）は、お客様のホームページそのものを再現する場所で、
 * エビスソフトのヘッダーやフッターが乗っていては「本物のサイト」に見えないためです。
 * ルートグループを分けることで、デモサイト側ではこれらの**JSそのものを配信しません**
 * （＝デモの描画にCPUとGPUを回せます）。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={siteConfig.lang}
      className={`${geistSans.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* JS無効環境でもコンテンツが見えるようにリビール演出を打ち消す */}
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important;transform:none !important;filter:none !important}`}</style>
        </noscript>
        {/* サイト共通の構造化データ（事業者・サイト） */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />

        {children}

        {/* アクセス解析（NEXT_PUBLIC_GA_ID が設定された本番ビルドでのみ出力） */}
        <Analytics />
      </body>
    </html>
  );
}
