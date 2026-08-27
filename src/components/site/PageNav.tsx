"use client";

import { useEffect, useRef } from "react";
import { useSectionSpy } from "@/components/fx/useSectionSpy";

/**
 * ページ内メニュー（スクロールしても画面上部に残る横並びナビ）。
 *
 * ヘッダー（h-16 / sticky top-0）のすぐ下に貼り付き、いま読んでいる節を光らせます。
 * 右端のドットナビ（fx/SectionNav）は広い画面の装飾ですが、こちらは
 * 端末を問わず常に見える主要導線として使います。
 *
 * - 実体は <a href="#id"> なので、JavaScriptが動かない環境でもリンクとして機能します。
 * - 現在地の判定は useSectionSpy（読み始めの線を最後に越えた節＝いま読んでいる節）。
 * - 背景に backdrop-filter は使いません（動く3D背景の上ではスクロールが重くなるため）。
 */
export function PageNav({ items }: { items: { id: string; label: string }[] }) {
  const { active, lockTo } = useSectionSpy(items);
  const listRef = useRef<HTMLElement>(null);

  /* 狭い画面ではメニューが横スクロールになるため、現在地が画面外に出ないよう寄せる。
     ページ自体は動かさないよう、要素の scrollLeft だけを変える。 */
  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>("[data-current]");
    if (!list || !current) return;
    if (list.scrollWidth <= list.clientWidth) return;
    const left = current.offsetLeft - list.clientWidth / 2 + current.offsetWidth / 2;
    list.scrollTo({
      left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <div className="pagenav">
      <nav
        ref={listRef}
        className="gutter-x mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto py-2"
        aria-label="ページ内メニュー"
      >
        <span aria-hidden className="pagenav-mark" />
        {items.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            className="pagenav-item"
            onClick={() => lockTo(i.id)}
            data-current={active === i.id ? "" : undefined}
            aria-current={active === i.id ? "true" : undefined}
          >
            {i.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
