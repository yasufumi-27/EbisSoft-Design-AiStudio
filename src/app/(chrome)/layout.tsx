import { ViewTransition } from "react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteChrome } from "@/components/fx/SiteChrome";
import { MobileCta } from "@/components/site/MobileCta";

/**
 * エビスソフト本サイトの外枠（ヘッダー・フッター・演出）。
 *
 * このルートグループの外にあるのは、職種別のデモサイト（`/demosite/<職種>`）だけです。
 * デモサイトは「お客様のホームページそのもの」を見せる場所なので、
 * 当社のヘッダー・フッター・3D背景・常駐アシスタントを**一切読み込みません**。
 * 条件分岐ではなくルートを分けているのは、JSの配信自体を止めるためです。
 */
export default function ChromeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* 3D背景・カーソル光・常駐アシスタントなどの起動役。
          職種ページ（/showcase）ではデモに性能を渡すため、演出を読み込みません。 */}
      <SiteChrome />

      <SiteHeader />
      {/* ページ遷移をクロスフェードさせる（非対応ブラウザでは通常の遷移になる） */}
      <ViewTransition>
        <main id="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
      </ViewTransition>
      <SiteFooter />
      {/* スマホだけ、画面下端に電話と相談の導線を常駐させる（lg 以上では非表示） */}
      <MobileCta />
    </>
  );
}
