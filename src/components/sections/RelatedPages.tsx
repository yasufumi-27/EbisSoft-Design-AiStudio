import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/icons";
import { relatedPages } from "@/lib/content";
import { ja } from "@/lib/typography";

/**
 * ページ末尾の「次に見るページ」。
 * 詳細ページ同士を明示的に結び、回遊とクロール（内部リンク＝SEO）を助けます。
 */
export function RelatedPages({ hrefs }: { hrefs: string[] }) {
  const items = relatedPages(hrefs);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="related-pages" className="py-16 sm:py-20">
      <Container>
        <h2 id="related-pages" className="eyebrow" data-reveal>
          {ja("Next / 次に見るページ")}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <Link
              prefetch={false}
              key={p.href}
              href={p.href}
              className="panel panel-hover group flex items-start gap-4 p-5"
              data-reveal
              style={{ "--reveal-delay": `${(i % 3) * 0.08}s` } as React.CSSProperties}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-light">
                <Icon name={p.icon} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  {ja(p.title)}
                  <Icon
                    name="arrowRight"
                    className="size-3.5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-brand-light"
                  />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-400">
                  {ja(p.description)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
