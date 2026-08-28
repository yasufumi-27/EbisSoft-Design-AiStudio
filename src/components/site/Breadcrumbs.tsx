import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ja } from "@/lib/typography";

export type Crumb = { name: string; path: string };

/**
 * 表示用のパンくずリスト。
 * デザイン案 03 に合わせ、display フォントの小さな英字ラベルと同じ組みにしています
 * （見た目は globals.css の .ai-crumbs）。
 * 構造化データ（breadcrumbJsonLd）と同じ配列を渡して内容を一致させます。
 * 現在地は aria-current で示し、リンクにしません。
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="パンくずリスト" className="ai-crumbs">
      <Container>
        <ol>
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {isLast ? (
                  <span aria-current="page">
                    {/* 記事タイトルのように長い現在地でも語の途中で折り返さないようにする */}
                    {ja(item.name)}
                  </span>
                ) : (
                  <>
                    <Link prefetch={false} href={item.path} className="transition-colors">
                      {item.name}
                    </Link>
                    <span aria-hidden>/</span>
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
