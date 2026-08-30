"use client";

import type { ReactNode } from "react";

/**
 * デモ共通のUI部品。
 *
 * 【デザイン案ごとに姿を変える】
 * ここに書く色・角の丸み・書体は、すべて `--dp-*` というCSS変数から読みます。
 * 変数の中身は `src/app/proposal-themes.css`（`scripts/proposal-themes.py` が
 * `src/lib/designProposals.ts` から生成）が、`.dp-<案ID>` クラスで与えます。
 *
 * つまり、デモを包む要素に `dp-vesper` などを付け替えるだけで、
 * 15のデモそれぞれが**別のデザイン案の見た目**になります。
 * どのデモにどの案を当てるかは `designProposals.ts` の `demoProposal` が持っています。
 *
 * デモの機能・文言は案によって変わりません。変わるのは見た目だけです。
 */

/** デモの外枠（タイトルバー付きのパネル）。 */
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
    <div className={`dp-stage ${className}`}>
      <div className="dp-stage-bar">
        <span className="dp-dot" />
        <span className="dp-dot" />
        <span className="dp-dot" />
        <span className="dp-stage-label">
          {prefix ? <span className="hidden sm:inline">{prefix}</span> : null}
          {main}
        </span>
        {status ? <span className="dp-stage-status">{status}</span> : null}
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
      <p className="dp-label mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** 選択式のトグルボタン（選択中はその案のアクセント色になる）。 */
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
      className="dp-chip"
      data-active={active ? "" : undefined}
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
      className="dp-switch"
    >
      <span aria-hidden className="dp-switch-track" data-on={checked ? "" : undefined}>
        <span className="dp-switch-knob" />
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
      <span className="dp-label mb-2 flex items-center justify-between">
        {label}
        <span className="dp-label-value">
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
    <p className="dp-note">
      <span className="dp-note-label">Note</span>
      {children}
    </p>
  );
}
