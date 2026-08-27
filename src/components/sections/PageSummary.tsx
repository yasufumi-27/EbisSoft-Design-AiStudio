import { Container } from "@/components/ui/Container";
import type { PageSummary as PageSummaryItem } from "@/lib/content";
import { ja } from "@/lib/typography";

/**
 * ページ冒頭に置く「結論ファーストの答え」（AEO）。
 *
 * 検索エンジンや生成AIは、ページ全体ではなく「質問に対する短い答え」を引用します。
 * そこで各ページの先頭に、想定質問と2〜3文の答えを機械可読な dl で置き、
 * .speakable（Speakable構造化データの対象）を付与しています。
 */
export function PageSummary({
  items,
  title = "このページの要点",
}: {
  items: PageSummaryItem[];
  title?: string;
}) {
  return (
    <section aria-labelledby="page-summary" className="pb-6">
      <Container>
        <div className="panel panel-corners p-6 sm:p-8" data-reveal>
          <p className="eyebrow">Summary / 要点</p>
          <h2 id="page-summary" className="mt-3 text-xl font-bold tracking-tight text-white">
            {ja(title)}
          </h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.q}
                className="border-l-2 border-brand/50 pl-4 transition-colors hover:border-gold"
              >
                <dt className="font-semibold text-white">{ja(item.q)}</dt>
                <dd className="speakable mt-1 text-sm leading-relaxed text-slate-400">{ja(item.a)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
