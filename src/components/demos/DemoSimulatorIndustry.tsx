"use client";

import { useMemo, useState } from "react";
import { ChipButton, ControlGroup, DemoStage, RangeControl } from "./DemoUi";
import { Icon } from "@/components/ui/icons";
import type { SimulatorConfig } from "@/lib/showcase";

/* ------------------------------------------------------------------
 * 職種別の料金シミュレーター。
 *
 * 計算の骨格は当社の見積もり診断（`DemoSimulator`）と同じで、
 * **言葉と数字だけを職種のものに差し替え**ています。
 *   工務店ならリフォーム費用、自動車整備なら車検費用、士業なら顧問料。
 * 「Web制作の料金シミュレーター」がクリニックのサイトに載っていては意味がないので、
 * デモサイトではこちらを使います。
 *
 * 計算式：
 *   （基本料金 × グレード倍率） ＋ （数量 − 1）× 単価 ＋ オプション合計
 * 期間：
 *   基本日数 ＋ 数量ぶんの日数 ＋ オプションの日数
 *
 * 実案件では、この定義をお客様の価格表に差し替えるだけで同じ画面が動きます。
 * 計算はすべてブラウザ内で完結するため、サーバーは不要です。
 * ---------------------------------------------------------------- */

const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

const TONES = ["bg-brand/70", "bg-accent/70", "bg-gold/70", "bg-emerald-400/70"];

export function DemoSimulatorIndustry({ config }: { config: SimulatorConfig }) {
  const [kind, setKind] = useState(config.kinds[0]);
  const [qty, setQty] = useState(config.quantity.init);
  const [grade, setGrade] = useState(config.grades[Math.min(1, config.grades.length - 1)]);
  const [options, setOptions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const toggle = (key: string) =>
    setOptions((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const quote = useMemo(() => {
    const chosen = config.options.filter((o) => options.includes(o.key));

    const baseCost = kind.base * grade.rate;
    const qtyCost = Math.max(0, qty - config.quantity.min) * config.quantity.perUnit;
    const optionCost = chosen.reduce((s, o) => s + o.price, 0);
    const subtotal = baseCost + qtyCost + optionCost;

    const days =
      kind.days +
      Math.max(0, qty - config.quantity.min) * config.quantity.perUnitDays +
      chosen.reduce((s, o) => s + o.days, 0);

    const breakdown = [
      { label: `${kind.label}の基本料金`, value: baseCost },
      { label: `${config.quantity.label}（${qty}${config.quantity.unit}）`, value: qtyCost },
      { label: "オプション", value: optionCost },
    ].filter((b) => b.value > 0);

    return {
      chosen,
      subtotal,
      // 概算なので上下に幅を持たせる（1円単位で出せるふりをしない）
      low: Math.round((subtotal * 0.9) / 1_000) * 1_000,
      high: Math.round((subtotal * 1.15) / 1_000) * 1_000,
      breakdown,
      days: Math.max(1, Math.round(days)),
    };
  }, [config, kind, qty, grade, options]);

  const summary = useMemo(
    () =>
      [
        `【${config.title}の結果】`,
        `${config.kindLabel}：${kind.label}`,
        `${config.quantity.label}：${qty}${config.quantity.unit}`,
        `${config.gradeLabel}：${grade.label}`,
        `${config.optionLabel}：${quote.chosen.length ? quote.chosen.map((o) => o.label).join(" / ") : "なし"}`,
        `概算金額：${yen(quote.low)} 〜 ${yen(quote.high)}`,
        `目安の期間：約${quote.days}${config.durationUnit}`,
      ].join("\n"),
    [config, kind, qty, grade, quote],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
      {/* ---------------- 入力 ---------------- */}
      <div className="panel space-y-6 p-5 min-w-0 lg:col-span-3">
        <ControlGroup label={config.kindLabel}>
          {config.kinds.map((k) => (
            <ChipButton
              key={k.key}
              active={kind.key === k.key}
              onClick={() => setKind(k)}
              title={k.note}
            >
              {k.label}
            </ChipButton>
          ))}
        </ControlGroup>
        <p className="-mt-3 text-[11px] text-slate-500">{kind.note}</p>

        <RangeControl
          label={config.quantity.label}
          value={qty}
          min={config.quantity.min}
          max={config.quantity.max}
          step={config.quantity.step}
          suffix={config.quantity.unit}
          onChange={setQty}
        />

        <ControlGroup label={config.gradeLabel}>
          {config.grades.map((g) => (
            <ChipButton
              key={g.key}
              active={grade.key === g.key}
              onClick={() => setGrade(g)}
              title={g.note}
            >
              {g.label}
            </ChipButton>
          ))}
        </ControlGroup>
        <p className="-mt-3 text-[11px] text-slate-500">{grade.note}</p>

        <div>
          <p className="font-display mb-2 text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            {config.optionLabel}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {config.options.map((o) => {
              const on = options.includes(o.key);
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => toggle(o.key)}
                  aria-pressed={on}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                    on
                      ? "border-brand/55 bg-brand/10 shadow-[0_0_18px_-6px_rgba(34,211,238,0.5)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors ${
                      on ? "border-brand bg-brand text-ink" : "border-white/25"
                    }`}
                  >
                    {on ? <Icon name="check" className="size-3" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-xs font-bold ${on ? "text-white" : "text-slate-300"}`}
                    >
                      {o.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
                      {o.hint}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] font-semibold text-slate-500 tabular-nums">
                    +{yen(o.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------------- 結果 ---------------- */}
      <div className="space-y-5 min-w-0 lg:col-span-2">
        <DemoStage label={config.title} status="LIVE CALC">
          <div className="p-5">
            <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              Estimated / 概算金額
            </p>
            <p className="mt-2 text-2xl leading-tight font-bold text-white tabular-nums sm:text-[1.7rem]">
              {yen(quote.low)}
              <span className="mx-1.5 text-base font-normal text-slate-500">〜</span>
              {yen(quote.high)}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{config.note}</p>

            {/* 内訳の積み上げバー */}
            <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-white/5">
              {quote.breakdown.map((b, i) => (
                <span
                  key={b.label}
                  className={`h-full transition-all duration-500 ${TONES[i % TONES.length]}`}
                  style={{ width: `${(b.value / quote.subtotal) * 100}%` }}
                  title={`${b.label}：${yen(b.value)}`}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {quote.breakdown.map((b, i) => (
                <li key={b.label} className="flex items-center gap-2 text-[11px]">
                  <span aria-hidden className={`size-2 rounded-full ${TONES[i % TONES.length]}`} />
                  <span className="flex-1 truncate text-slate-400">{b.label}</span>
                  <span className="font-semibold text-slate-300 tabular-nums">{yen(b.value)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
                Duration / 目安の期間
              </p>
              <p className="font-display mt-2 text-xl font-bold text-brand-light tabular-nums">
                約{quote.days}
                {config.durationUnit}
              </p>
            </div>
          </div>
        </DemoStage>

        <div className="panel p-5">
          <p className="text-xs leading-relaxed text-slate-400">
            結果はそのまま問い合わせフォームへ引き継げます。実案件では、この内容を顧客管理システムへ
            自動で登録するところまで実装します。
          </p>
          <button
            type="button"
            onClick={copy}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-xs font-semibold text-slate-200 transition-colors hover:border-brand/50"
          >
            <Icon name={copied ? "check" : "layout"} className="size-3.5" />
            {copied ? "結果をコピーしました" : "結果をコピー"}
          </button>

          <details className="mt-4">
            <summary className="cursor-pointer text-[11px] text-slate-500 hover:text-slate-300">
              問い合わせに引き継がれる内容を見る
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 bg-ink/60 p-3 text-[10px] leading-relaxed whitespace-pre-wrap text-slate-400">
              {summary}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
