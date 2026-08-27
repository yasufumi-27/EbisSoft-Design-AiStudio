"use client";

import { useSectionSpy } from "@/components/fx/useSectionSpy";

/**
 * 右端のセクションインジケーター（HUD風のドットナビ）。
 *
 * 現在位置の判定はページ内メニュー（site/PageNav）と同じ useSectionSpy を使います。
 * 2つのナビが別々の基準で光ると、同じ画面で違う節を指してしまうためです。
 * 幅の広い画面でのみ表示（CSS側のメディアクエリ）。
 *
 * 補助的なナビゲーションのため、ページ内リンク（<a href="#id">）で実装しています。
 * JavaScriptが動かない環境でも、リンクとしては機能します。
 */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const { active, lockTo } = useSectionSpy(items);

  return (
    <nav className="dotnav" aria-label="セクション">
      {items.map((i) => (
        <a
          key={i.id}
          href={`#${i.id}`}
          className="dotnav-item"
          onClick={() => lockTo(i.id)}
          data-current={active === i.id ? "" : undefined}
          aria-current={active === i.id ? "true" : undefined}
        >
          <span className="dotnav-label">{i.label}</span>
          <span className="sr-only">{i.label}へ移動</span>
        </a>
      ))}
    </nav>
  );
}
