import { Section, SectionHeading } from "@/components/ui/Section";
import { Icon } from "@/components/ui/icons";
import { strengths } from "@/lib/content";
import { ja } from "@/lib/typography";

/** 選ばれる理由（強み）。 */
export function Strengths() {
  return (
    <Section id="strengths">
      <SectionHeading
        eyebrow="Why エビスソフト"
        title="エビスソフトの強み"
        description="AIを使いこなす制作体制と、AI機能そのものを開発できる技術力。この2つが土台になっています。"
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {strengths.map((s, i) => (
          <div
            key={s.title}
            className="panel panel-hover panel-corners p-6"
            data-reveal
            style={{ "--reveal-delay": `${i * 0.1}s` } as React.CSSProperties}
          >
            <span className="grid size-12 place-items-center rounded-none border border-brand/30 bg-brand/10 text-brand-light shadow-[0_0_20px_rgba(182,126,255,0.2)]">
              <Icon name={s.icon} className="size-6" />
            </span>
            <h3 className="mt-5 text-lg font-bold text-white">{ja(s.title)}</h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-400 sm:text-sm">{ja(s.description)}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
