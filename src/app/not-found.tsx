import type { Metadata } from "next";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { RelatedPages } from "@/components/sections/RelatedPages";

/**
 * 404（ページが見つかりません）。
 *
 * ※ このファイルは `(chrome)` ルートグループの**外**（`app/` 直下）に置く必要があります。
 *   どのルートにも一致しないURLの受け皿になれるのはルート直下の not-found だけだからです。
 *   その結果 `(chrome)/layout.tsx` のヘッダー・フッターは自動では付かないので、
 *   ここで `SiteHeader` / `SiteFooter` を明示的に読み込んでいます。
 *   一方 `SiteChrome`・`SubpageExperience`・`MobileCta` は**あえて読み込みません**。
 *   誤ったリンクで迷い込んだ人を最短で目的地へ戻すための画面で、演出は要らないためです。
 *
 * ※ 静的書き出し（`output: "export"`）では、このファイルから `out/404.html` が生成され、
 *   `public/.htaccess` の `ErrorDocument 404 /404.html` がそれを返します。
 *   **トップへリダイレクトしてはいけません**（200応答になり、検索エンジンに
 *   「ソフト404」として低品質と判定されます）。404 応答のまま中身だけを差し替えます。
 */

export const metadata: Metadata = {
  title: "ページが見つかりません",
  description:
    "お探しのページは見つかりませんでした。アドレスの変更や削除が考えられます。主なページへのご案内を掲載しています。",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1">
        <PageHeader
          eyebrow="404 / Not Found"
          title="お探しのページは、見つかりませんでした。"
          lead="アドレスが変更されたか、削除された可能性があります。お手数ですが、下のリンクから目的のページへお進みください。"
          art="req-shape"
        >
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/" withArrow>
              トップへ戻る
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" withArrow>
              お問い合わせ
            </ButtonLink>
          </div>
        </PageHeader>

        <RelatedPages
          hrefs={["/ai", "/web", "/embedded", "/demo", "/showcase", "/request"]}
        />
      </main>
      <SiteFooter />
    </>
  );
}
