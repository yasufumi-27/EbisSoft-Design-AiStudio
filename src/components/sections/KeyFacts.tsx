import { Container } from "@/components/ui/Container";
import { keyFacts } from "@/lib/content";
import { ja } from "@/lib/typography";

/**
 * 「30秒でわかるエビスソフト」要点ブロック。
 * 結論ファーストの短文Q&Aで、AI・検索エンジンがそのまま引用しやすくしています（AEO / LLMO）。
 * 回答には .speakable を付与し、Speakable構造化データの対象にしています。
 */
export function KeyFacts() {
  return (
    <section id="key-facts" className="scroll-mt-20 py-12 sm:py-16">
      <Container>
        <div className="panel panel-corners mx-auto max-w-3xl p-7 sm:p-9" data-reveal>
          <p className="eyebrow">Summary / 要点</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
            {ja("30秒でわかるエビスソフト")}
          </h2>
          <dl className="mt-6 space-y-5">
            {keyFacts.map((f) => (
              <div
                key={f.q}
                className="border-l-2 border-brand/50 pl-4 transition-colors hover:border-gold"
              >
                <dt className="font-semibold text-white">{ja(f.q)}</dt>
                <dd className="speakable mt-1 text-slate-400">{ja(f.a)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
