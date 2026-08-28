import { Section, SectionHeading } from "@/components/ui/Section";
import { steps } from "@/lib/content";
import { ja } from "@/lib/typography";

/** 制作の流れ。番号はディスプレイフォント＋グラデーションでHUD風に。 */
export function Process() {
  return (
    <Section id="process">
      <SectionHeading
        eyebrow="Process"
        title="制作の流れ"
        description="ご相談から公開・運用まで。各ステップで丁寧にご確認いただきながら進めます。"
      />
      <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="panel panel-hover relative p-6"
            data-reveal
            style={{ "--reveal-delay": `${(i % 3) * 0.1}s` } as React.CSSProperties}
          >
            <div className="flex items-center gap-4">
              <span className="font-display grid size-11 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/10 text-base font-bold text-brand-light shadow-[0_0_18px_rgba(182,126,255,0.25)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-bold text-white">{ja(step.title)}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{ja(step.description)}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
