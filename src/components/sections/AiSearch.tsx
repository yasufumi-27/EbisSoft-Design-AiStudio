import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { aeo } from "@/lib/content";
import { ja } from "@/lib/typography";

/** サブパス配信（GitHub Pages）でも 404 にしないためのプレフィックス。 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * AEO / LLMO（AI検索最適化）特化セクション。
 * 「定義 → エビスソフトの具体的な施策」を結論ファーストで提示し、
 * このサイト自体がAEO/LLMOの実装例になるよう構成しています。
 */
export function AiSearch() {
  return (
    <section id="ai-search" className="relative scroll-mt-20 overflow-hidden">
      {/* このセクションだけ一段深い面＋強い光芒で世界観を切り替える */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink-2/80 backdrop-blur-[2px]" />
      <div aria-hidden className="divider-glow absolute inset-x-0 top-0" />
      <div aria-hidden className="divider-glow absolute inset-x-0 bottom-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-0 size-[42rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
      />

      <Container className="relative py-20 sm:py-28">
        <div className="max-w-2xl" data-reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-sm font-semibold text-gold-light backdrop-blur">
            <Icon name="sparkles" className="size-4 animate-pulse-glow" />
            AEO / LLMO 特化
          </p>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {ja("AI検索（AEO / LLMO）に")}
            <br className="hidden sm:block" />
            <span className="text-gradient">{ja("最初から対応")}</span>{ja("します")}
          </h2>
          <p className="speakable mt-5 text-lg leading-relaxed text-slate-300">
            {ja("これからの集客は、")}
            <strong className="font-semibold text-white">{ja("「答えを返すAI」に引用・推薦されること")}</strong>
            {ja("が鍵になります。制作の最初から、その設計を組み込みます。")}
          </p>
        </div>

        {/* 用語の定義（結論ファースト） */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {aeo.definitions.map((d, i) => (
            <div
              key={d.term}
              className="panel panel-corners p-6"
              data-reveal
              style={{ "--reveal-delay": `${i * 0.12}s` } as React.CSSProperties}
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl font-bold tracking-wider">
                  <span className="text-gradient">{d.term}</span>
                </span>
                <span className="text-sm text-slate-500">{ja(d.full)}</span>
              </div>
              <p className="speakable mt-3 text-slate-300">{ja(d.description)}</p>
            </div>
          ))}
        </div>

        {/* 具体的な施策 */}
        <h3 className="mt-14 text-xl font-bold text-white" data-reveal>
          {ja("エビスソフトが実装するAEO / LLMO施策")}
        </h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {aeo.tactics.map((t, i) => (
            <div
              key={t.title}
              className="panel panel-hover p-6"
              data-reveal
              style={{ "--reveal-delay": `${(i % 3) * 0.1}s` } as React.CSSProperties}
            >
              <span className="grid size-11 place-items-center rounded-none bg-gradient-to-br from-brand to-accent text-ink shadow-[0_0_20px_rgba(196,160,255,0.4)]">
                <Icon name={t.icon} className="size-5" />
              </span>
              <h4 className="mt-4 font-bold text-white">{ja(t.title)}</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{ja(t.description)}</p>
            </div>
          ))}
        </div>

        {/* このサイト自体での実装状況（主張ではなく、その場で確認できる一次情報） */}
        <div className="panel panel-corners mt-12 p-6 sm:p-8" data-reveal>
          <h3 className="text-lg font-bold text-white">{ja("このサイトでの実装状況")}</h3>
          <p className="speakable mt-2 text-sm leading-relaxed text-slate-400">
            {ja("下記はすべて、いま見ているこのサイトで動いているものです。リンクから中身をそのまま確認できます。")}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {aeo.selfImplementation.map((item) => (
              <li key={item.href}>
                {/* ページではなく生成ファイルを含むため、basePath を明示して素の <a> で出す */}
                <a
                  href={`${BASE_PATH}${item.href}`}
                  className="inline-flex items-center gap-2 rounded-none border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-brand/50 hover:text-white"
                >
                  <Icon name="check" className="size-3.5 text-gold" />
                  {ja(item.label)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12" data-reveal>
          <ButtonLink href="/contact" size="lg" withArrow>
            AI検索対策について相談する
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
