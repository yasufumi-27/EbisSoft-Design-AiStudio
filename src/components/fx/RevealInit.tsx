"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * スクロールリビールの起動役。
 * ページ内の [data-reveal] 要素を IntersectionObserver で監視し、
 * ビューポートに入ったら data-revealed 属性を付与する（演出本体は globals.css）。
 * サーバーHTMLには全文が含まれるため、SEO/AEO/LLMOへの影響はない。
 *
 * ※ class ではなく属性で状態を持たせている理由：
 *   className を動的に切り替える要素（例：選択中のカード）が再レンダリングされると、
 *   Reactが className を丸ごと書き戻すため、JSで足したクラスは消えてしまう。
 *   Reactが管理していない data-* 属性なら再レンダリングでも保持される。
 *
 * この起動役は layout に置かれていて画面遷移でも再マウントされないため、
 * pathname を依存に入れて遷移のたびに新しいページを走査し直す。
 * （以前は MutationObserver で body 全体を subtree 監視していたが、
 *   DOMが動くたびに document 全体の querySelectorAll が走って重かった。
 *   後から現れる要素で [data-reveal] を持つものは無いので、遷移時の再走査で足りる。）
 */
export function RevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    const reveal = (el: Element) => el.setAttribute("data-revealed", "");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("[data-reveal]").forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // 画面より背の高い要素（長いフォーム等）は「12%見えるまで」を待つと
          // いつまでも表示されず空白に見えるため、触れた時点で出す。
          const isTall = entry.boundingClientRect.height > window.innerHeight * 0.85;
          if (isTall || entry.intersectionRatio >= 0.12) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: [0, 0.12], rootMargin: "0px 0px -6% 0px" },
    );

    document.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
