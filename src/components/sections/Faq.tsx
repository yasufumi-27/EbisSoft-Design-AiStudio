import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { faqs, type Faq as FaqItem } from "@/lib/content";
import { ja } from "@/lib/typography";

/**
 * よくある質問。JSなしの <details>/<summary> でアコーディオン化。
 * 表示内容は FAQ 構造化データ（faqJsonLd）と同じ content.ts から生成しています。
 * items を渡すと、そのページに関係する質問だけを掲載できます。
 */
export function Faq({
  items = faqs,
  eyebrow = "FAQ",
  title = "よくある質問",
  description = "ご相談前によくいただく質問をまとめました。ここにない疑問もお気軽にお問い合わせください。",
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
      <div className="panel mx-auto mt-12 max-w-3xl divide-y divide-white/10 overflow-hidden" data-reveal>
        {items.map((faq) => (
          <details
            key={faq.question}
            className="group px-6 transition-colors open:bg-white/[0.03] [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-slate-100 transition-colors hover:text-brand-light">
              <span className="min-w-0">{ja(faq.question)}</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="shrink-0 text-brand transition-transform duration-300 group-open:rotate-180"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="speakable pb-5 text-sm leading-relaxed text-slate-400">{ja(faq.answer)}</p>
          </details>
        ))}
      </div>

      {moreHref ? (
        <p className="mt-8 text-center" data-reveal>
          <Link
            prefetch={false}
            href={moreHref}
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-light transition-colors hover:text-white"
          >
            {ja("すべての質問を見る")}
            <Icon name="arrowRight" className="size-4" />
          </Link>
        </p>
      ) : null}
    </Section>
  );
}
