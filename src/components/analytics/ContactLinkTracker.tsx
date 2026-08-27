"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * 電話・メールリンクのタップを GA4 に記録する。
 *
 * `tel:` / `mailto:` のリンクはヘッダー・フッター・/contact・/privacy に散らばっており、
 * その多くはサーバーコンポーネントなので onClick を直接付けられない。
 * そこで document 側で1つだけクリックを拾い、リンクの種類を判定して送る
 * （イベント委譲。リンクが増えても追加の対応は不要）。
 *
 * 捕捉フェーズで listen しているのは、遷移（tel: の起動）で
 * ハンドラが呼ばれ損ねるのを避けるため。
 */
export function ContactLinkTracker() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest<HTMLAnchorElement>(
        'a[href^="tel:"], a[href^="mailto:"]',
      );
      if (!link) return;

      const href = link.getAttribute("href") ?? "";
      trackEvent("contact_tap", {
        method: href.startsWith("tel:") ? "phone" : "email",
        page_path: window.location.pathname,
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
