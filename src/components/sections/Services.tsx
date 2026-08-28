import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { services, servicesByCategory, type ServiceCategory } from "@/lib/content";
import { ja } from "@/lib/typography";

/**
 * 提供サービス一覧。
 * category を渡すと、その領域のサービスだけを掲載します（詳細ページごとの出し分け）。
 */
export function Services({
  category,
  eyebrow = "Service",
  title = "サービス",
  description,
  id = "services",
  bg = "transparent",
}: {
  category?: ServiceCategory;
  eyebrow?: string;
  title?: string;
  description?: string;
  id?: string;
  bg?: "transparent" | "deep";
}) {
  const items = category ? servicesByCategory(category) : services;

  return (
    <Section id={id} bg={bg}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((s, i) => (
          <article
            key={s.slug}
            className="group panel panel-hover panel-corners flex flex-col p-7"
            data-reveal
            style={{ "--reveal-delay": `${(i % 3) * 0.1}s` } as React.CSSProperties}
          >
            <span className="grid size-12 place-items-center rounded-none bg-gradient-to-br from-brand/80 to-accent/80 text-ink shadow-[0_0_22px_rgba(182,126,255,0.35)] transition-shadow group-hover:shadow-[0_0_32px_rgba(182,126,255,0.6)]">
              <Icon name={s.icon} className="size-6" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-white">{ja(s.title)}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{ja(s.description)}</p>
            <ul className="mt-5 space-y-2 border-t border-white/10 pt-5">
              {s.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                  <Icon name="check" className="size-4 shrink-0 text-gold" />
                  <span className="min-w-0">{ja(f)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}
