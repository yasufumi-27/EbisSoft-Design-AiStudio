import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.yebisusoft.jp"),
  title: "ページが見つかりません｜エビスソフト",
  description: "お探しのページは移動または削除された可能性があります。エビスソフトのトップページやデモ一覧からお探しください。",
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, colorScheme: "dark", themeColor: "#07050e",
};

export default function GlobalNotFound() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <html lang="ja">
      <head>
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; background: #07050e; color: #cdc2dd;
            font-family: "Hiragino Sans", "Yu Gothic", Meiryo, system-ui, sans-serif; }
          main { min-height: 100vh; min-height: 100svh; display: grid;
            place-items: center; padding: 64px 24px; }
          .content { width: 100%; max-width: 680px; text-align: center; }
          a { color: #b67eff; text-underline-offset: .25em; }
          a:focus-visible { outline: 3px solid #aaffdc; outline-offset: 5px; }
          .brand { font-weight: 700; text-decoration: none; }
          .code { margin: 40px 0 8px; color: #b67eff; font-size: clamp(72px, 18vw, 128px);
            font-weight: 800; line-height: 1; letter-spacing: .06em; }
          h1 { margin: 24px 0; color: #e6dff0; font-size: clamp(22px, 5vw, 32px); }
          .description { line-height: 2; margin: 0; overflow-wrap: anywhere; }
          nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin: 32px 0; }
          nav a { padding: 14px 24px; border: 1px solid #b67eff; border-radius: 8px;
            text-decoration: none; font-weight: 700; }
          nav a:first-child { background: #b67eff; color: #07050e; }
          nav a:hover { border-color: #aaffdc; }
          .help { font-size: 14px; line-height: 2; }
          @media (max-width: 480px) { main { padding: 40px 20px; }
            nav { flex-direction: column; } nav a { width: 100%; } }
        `}</style>
      </head>
      <body>
        <main id="main">
          <div className="content">
            <a className="brand" href={`${basePath}/`}>エビスソフト</a>
            <p className="code">404</p>
            <h1>ページが見つかりません</h1>
            <p className="description">
              お探しのページは、移動または削除された可能性があります。<br />
              URLをご確認いただくか、以下のリンクからお探しください。
            </p>
            <nav aria-label="ページを探す">
              <a href={`${basePath}/`}>トップページへ</a>
              <a href={`${basePath}/demo`}>デモ一覧を見る</a>
            </nav>
            <p className="help">お困りの場合は <a href={`${basePath}/contact`}>お問い合わせ</a> ください。</p>
          </div>
        </main>
      </body>
    </html>
  );
}
