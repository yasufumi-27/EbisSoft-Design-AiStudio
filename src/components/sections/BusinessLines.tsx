import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import {
  businessLines,
  businessLinesFor,
  type BusinessLineCategory,
} from "@/lib/content";
import { ja } from "@/lib/typography";

/**
 * 事業内容（名刺記載）の一覧。
 *
 * category を渡すと、その領域の事業内容だけを掲載します
 * （組み込み開発ページ／Web制作ページの「主な事業内容」）。
 * 省略すると全件を掲載します（会社概要ページ）。
 */
export function BusinessLines({
  category,
  eyebrow = "Business",
  title = "主な事業内容",
  description,
  id = "business",
  bg = "transparent",
}: {
  category?: BusinessLineCategory;
  eyebrow?: string;
  title?: string;
  description?: string;
  id?: string;
  bg?: "transparent" | "deep";
}) {
  const items = category ? businessLinesFor(category) : businessLines;
  const cols = items.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";

  return (
    <Section id={id} bg={bg}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className={`mt-14 grid gap-6 ${cols}`}>
        {items.map((b, i) => (
          <article
            key={b.title}
            className="panel panel-hover panel-corners flex flex-col p-6"
            data-reveal
            style={{ "--reveal-delay": `${(i % 3) * 0.1}s` } as React.CSSProperties}
          >
            <span className="grid size-11 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold-light">
              <Icon name={b.icon} className="size-5" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-white">{ja(b.title)}</h3>
            <p className="speakable mt-2 flex-1 text-sm leading-relaxed text-slate-400">
              {ja(b.description)}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
