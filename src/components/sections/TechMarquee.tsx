import { techStack } from "@/lib/content";

/**
 * 技術スタックが流れるマーキー帯（ゲーム公式サイト風の演出）。
 * 同一リストを2周ぶん並べ、CSSアニメーションで無限ループさせる。
 */
export function TechMarquee() {
  const items = [...techStack];
  return (
    <div className="relative border-y border-white/5 bg-ink-2/60 py-5 backdrop-blur-sm">
      <div aria-hidden className="divider-glow absolute inset-x-0 top-0 opacity-50" />
      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center gap-14">
              {items.map((t) => (
                <li
                  key={t}
                  className="font-display flex items-center gap-3 text-sm font-bold tracking-[0.25em] whitespace-nowrap text-slate-500 uppercase"
                >
                  <span className="size-1.5 rotate-45 bg-gold/70 shadow-[0_0_8px_rgba(170, 255, 220,0.8)]" />
                  {t}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      {/* スクリーンリーダー向けの静的な一覧（マーキーは装飾扱い） */}
      <p className="sr-only">対応技術・専門領域: {items.join("、")}</p>
    </div>
  );
}
