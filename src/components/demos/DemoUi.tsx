"use client";

import type { ReactNode } from "react";

/**
 * デモ共通のUI部品。
 * 各デモで見た目と操作感を統一し、実装（デモ本体）に集中できるようにします。
 */

/** デモの外枠（HUD風のタイトルバー付きパネル）。 */
export function DemoStage({
  label,
  status,
  children,
  className = "",
}: {
  /** タイトルバーに出す英字ラベル */
  label: string;
  /** 右側のステータス表示 */
  status?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  // ラベルは "エビスソフト.XXX" 形式。狭い端末では屋号の部分を伏せ、
  // 機能名（XXX）が省略記号で切れないようにする。
  const dot = label.indexOf(".");
  const prefix = dot > 0 ? label.slice(0, dot + 1) : "";
  const main = dot > 0 ? label.slice(dot + 1) : label;

  return (
    <div className={`panel panel-corners overflow-hidden ${className}`}>
      <div className="flex min-w-0 items-center gap-1.5 border-b border-white/10 px-3 py-3 sm:px-4">
        <span className="size-2.5 shrink-0 rounded-full bg-rose-400/70" />
        <span className="size-2.5 shrink-0 rounded-full bg-amber-300/70" />
        <span className="size-2.5 shrink-0 rounded-full bg-emerald-400/70" />
        <span className="font-display ml-2 min-w-0 flex-1 truncate text-[9px] tracking-[0.08em] text-slate-500 uppercase sm:ml-3 sm:text-[10px] sm:tracking-[0.25em]">
          {prefix ? <span className="hidden sm:inline">{prefix}</span> : null}
          {main}
        </span>
        {status ? (
          <span className="font-display min-w-0 shrink truncate text-[9px] tracking-normal text-brand-light sm:text-[10px] sm:tracking-widest">
            {status}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** 操作パネルの1グループ（ラベル＋コントロール）。 */
export function ControlGroup({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-display mb-2 text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** 選択式のトグルボタン（選択中はシアンで発光）。 */
export function ChipButton({
  active,
  onClick,
  children,
  title,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
  /** その状況では効かない選択肢（例：ロゴ表示中の素材切替）を無効化する */
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-brand/60 bg-brand/15 text-brand-light shadow-[0_0_16px_rgba(34,211,238,0.28)]"
          : "border-white/10 bg-white/5 text-slate-400 enabled:hover:border-white/25 enabled:hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

/** ON/OFF スイッチ。 */
export function SwitchButton({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-white/25"
    >
      <span
        aria-hidden
        className={`relative h-4 w-8 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand/70" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 size-3 rounded-full bg-white transition-all ${
            checked ? "left-4.5 shadow-[0_0_8px_rgba(34,211,238,0.9)]" : "left-0.5"
          }`}
        />
      </span>
      {children}
    </button>
  );
}

/** スライダー（レンジ入力）。 */
export function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="font-display mb-2 flex items-center justify-between text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
        {label}
        <span className="text-brand-light">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="demo-range w-full"
      />
    </label>
  );
}

/**
 * デモの前提・制約を明示する注記。
 * 「どこまでが実装で、本番では何が変わるか」を正直に伝えるための枠（信頼性）。
 */
export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4 text-xs leading-relaxed text-slate-400">
      <span className="font-display mr-2 text-[10px] font-bold tracking-[0.2em] text-gold uppercase">
        Note
      </span>
      {children}
    </p>
  );
}
