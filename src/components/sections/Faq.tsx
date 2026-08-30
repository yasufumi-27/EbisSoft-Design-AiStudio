import Link from "next/link";

import { Section, SectionHeading } from "@/components/ui/Section";
import { faqs, type Faq as FaqItem } from "@/lib/content";
import { ja } from "@/lib/typography";

/**
 * よくある質問。JSなしの <details>/<summary> でアコーディオン化。
 * 表示内容は FAQ 構造化データ（faqJsonLd）と同じ content.ts から生成しています。
 * items を渡すと、そのページに関係する質問だけを掲載できます。
 *
 * 組みは記事本文の見出しと揃えました——2桁の通し番号、1pxの紫の罫線、
 * 開閉は右端の記号だけ。丸みや発光は足しません。
 */
export function Faq({
  items = faqs,
  eyebrow = "FAQ",
  title = "よくある質問",
  description = "ご相談前によくいただく質問をまとめました。",
  moreHref,
  bg = "transparent",
}: {
  items?: FaqItem[];
  eyebrow?: string;
  title?: string;
  description?: string;
  /** 「すべての質問を見る」の遷移先（一覧ページへの導線） */
  moreHref?: string;
  bg?: "transparent" | "deep";
}) {
  return (
    <Section id="faq" bg={bg}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />

      <div className="ai-qa mt-12" data-reveal>
        {items.map((faq, i) => (
          <details key={faq.question}>
            <summary>
              <b>{String(i + 1).padStart(2, "0")}</b>
              <span className="min-w-0">{ja(faq.question)}</span>
            </summary>
            <p className="speakable">{ja(faq.answer)}</p>
          </details>
        ))}
      </div>

      {moreHref ? (
        <p className="mt-10" data-reveal>
          <Link prefetch={false} href={moreHref} className="ai-flight-more">
            すべての質問を見る <span aria-hidden>↗</span>
          </Link>
        </p>
      ) : null}
    </Section>
  );
}
