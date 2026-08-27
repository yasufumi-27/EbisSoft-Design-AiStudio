import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ja } from "@/lib/typography";

export type Crumb = { name: string; path: string };

/**
 * 表示用のパンくずリスト。
 * 構造化データ（breadcrumbJsonLd）と同じ配列を渡して内容を一致させます。
 * 現在地は aria-current で示し、リンクにしません。
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="パンくずリスト" className="border-b border-white/5 bg-ink-2/40 backdrop-blur-sm">
      <Container>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 py-3 text-xs text-slate-500">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {isLast ? (
                  <span aria-current="page" className="text-slate-300">
                    {/* 記事タイトルのように長い現在地でも語の途中で折り返さないようにする */}
                    {ja(item.name)}
                  </span>
                ) : (
                  <>
                    <Link prefetch={false} href={item.path} className="transition-colors hover:text-brand-light">
                      {item.name}
                    </Link>
                    <span aria-hidden className="text-slate-700">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </Container>
    </nav>
  );
}
