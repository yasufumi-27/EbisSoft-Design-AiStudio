import { ModuleBoard } from "@/components/ui/Studio";
import { relatedPages } from "@/lib/content";

/**
 * ページ末尾の「次に見るページ」。
 * 詳細ページ同士を明示的に結び、回遊とクロール（内部リンク＝SEO）を助けます。
 *
 * 以前は隙間を空けたカードを3枚並べる形でしたが、トップやほかのセクションが
 * 「1pxの隙間で連結した盤」なのに、ここだけカードが浮いていました。
 * いまは共通の `ModuleBoard` に寄せています。
 */
export function RelatedPages({ hrefs }: { hrefs: string[] }) {
  const items = relatedPages(hrefs);
  if (items.length === 0) return null;

  return (
    <ModuleBoard
      label="Next"
      title="次に見るページ"
      lead="ここまでの話とつながるページです。"
      prefix="NXT"
      items={items.map((p) => ({ title: p.title, note: "OPEN", href: p.href }))}
    />
  );
}
