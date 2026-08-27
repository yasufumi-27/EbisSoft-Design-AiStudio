"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icons";

/**
 * ヒーローの右側に置くHUDコンソール。
 * 当社の制作パイプライン（AIが担当する工程と、人が判断する工程）を
 * 順に走らせて見せる演出です。数値の実測値ではなく、工程の可視化です。
 *
 * - タブが非表示のときは進行を止める（無駄な再描画をしない）
 * - reduced-motion では最初から全工程が完了した状態で表示する
 * - サーバーHTMLには全行が含まれるため、内容はクローラーからも読めます
 */

type Line = {
  phase: string;
  text: string;
  /** この工程の主担当 */
  by: "AI" | "人";
  /** 表示上の処理時間 */
  ms: number;
};

const LINES: Line[] = [
  { phase: "analyze", text: "ヒアリング内容を構造化", by: "AI", ms: 420 },
  { phase: "plan", text: "サイト構成を3案生成し比較", by: "AI", ms: 780 },
  { phase: "decide", text: "事業目標に沿って方針を決定", by: "人", ms: 240 },
  { phase: "write", text: "見出し・本文コピーを生成", by: "AI", ms: 640 },
  { phase: "build", text: "コンポーネントを並列実装", by: "AI", ms: 1180 },
  { phase: "review", text: "コードレビューと表現の調整", by: "人", ms: 520 },
  { phase: "optimize", text: "構造化データ・llms.txt を整備", by: "AI", ms: 460 },
  { phase: "verify", text: "Core Web Vitals を計測・検証", by: "AI", ms: 380 },
  { phase: "release", text: "公開判断・本番リリース", by: "人", ms: 200 },
];

const TOTAL = LINES.length;

export default function HeroConsole() {
  // done = 完了した工程数。TOTAL に達したら少し止めてから最初に戻る。
  const [done, setDone] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // エフェクト内で同期的に状態を更新しない（連鎖レンダリングを避ける）
      queueMicrotask(() => {
        setReduced(true);
        setDone(TOTAL);
      });
      return;
    }

    let timer = 0;
    const tick = () => {
      setDone((d) => {
        const next = d >= TOTAL ? 0 : d + 1;
        // 完了直後は間を置いてから巻き戻す（読む時間を作る）
        timer = window.setTimeout(tick, next === 0 ? 900 : next === TOTAL ? 2600 : 620);
        return next;
      });
    };
    timer = window.setTimeout(tick, 700);

    // タブが裏に回っている間は進めない
    const onVisibility = () => {
      if (document.hidden) {
        window.clearTimeout(timer);
      } else {
        timer = window.setTimeout(tick, 620);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const complete = done >= TOTAL;
  const aiCount = LINES.filter((l) => l.by === "AI").length;

  return (
    <div className="panel panel-corners overflow-hidden shadow-[0_30px_80px_-30px_rgba(182, 126, 255,0.25)]">
      {/* タイトルバー */}
      <div className="flex min-w-0 items-center gap-1.5 border-b border-white/10 px-3 py-3 sm:px-4">
        <span className="size-3 shrink-0 rounded-full bg-rose-400/80" />
        <span className="size-3 shrink-0 rounded-full bg-amber-300/80" />
        <span className="size-3 shrink-0 rounded-full bg-emerald-400/80" />
        <span className="font-display ml-2 flex h-5 min-w-0 flex-1 items-center overflow-hidden rounded-md bg-white/5 px-2 text-[9px] tracking-[0.06em] text-slate-500 sm:ml-3 sm:text-[10px] sm:tracking-[0.25em]">
          <span className="truncate">エビスソフト.AI_PIPELINE</span>
        </span>
        <span
          className={`font-display shrink-0 text-[10px] tracking-widest ${
            complete ? "text-emerald-300" : "text-brand-light"
          }`}
        >
          {complete ? "COMPLETE" : reduced ? "READY" : "RUNNING"}
        </span>
      </div>

      {/* 工程ログ */}
      <ul className="divide-y divide-white/[0.04]">
        {LINES.map((l, i) => {
          const state = i < done ? "done" : i === done && !complete ? "run" : "wait";
          return (
            <li
              key={l.phase}
              className={`flex min-w-0 items-center gap-2 px-3 py-[0.55rem] transition-colors duration-300 sm:gap-3 sm:px-4 ${
                state === "run" ? "bg-brand/[0.07]" : ""
              }`}
            >
              {/* 状態アイコン */}
              <span
                aria-hidden
                className={`grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                  state === "done"
                    ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-300"
                    : state === "run"
                      ? "border-brand bg-brand/20 text-brand-light"
                      : "border-white/15 text-transparent"
                }`}
              >
                {state === "done" ? (
                  <Icon name="check" className="size-2.5" strokeWidth={3.5} />
                ) : state === "run" ? (
                  <span className="size-1.5 animate-pulse-glow rounded-full bg-brand" />
                ) : null}
              </span>

              <span
                className={`font-display w-14 shrink-0 truncate text-[10px] tracking-normal max-[359px]:hidden sm:w-[4.6rem] sm:tracking-wider ${
                  state === "wait" ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {l.phase}
              </span>

              <span
                className={`min-w-0 flex-1 truncate text-xs transition-colors duration-300 ${
                  state === "wait" ? "text-slate-600" : "text-slate-200"
                }`}
              >
                {l.text}
              </span>

              {/* 担当（AI／人）— ここが当社の主張そのもの */}
              <span
                className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold ${
                  l.by === "AI"
                    ? "border-brand/30 bg-brand/10 text-brand-light"
                    : "border-gold/35 bg-gold/10 text-gold-light"
                } ${state === "wait" ? "opacity-40" : ""}`}
              >
                {l.by}
              </span>

              <span
                className={`font-display hidden w-12 shrink-0 text-right text-[10px] tabular-nums sm:block ${
                  state === "done" ? "text-slate-500" : "text-transparent"
                }`}
              >
                {l.ms}ms
              </span>
            </li>
          );
        })}
      </ul>

      {/* 進捗とサマリ */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-brand via-accent to-gold transition-all duration-500"
              style={{ width: `${(done / TOTAL) * 100}%` }}
            />
          </span>
          <span className="font-display shrink-0 text-[10px] text-slate-400 tabular-nums">
            {done}/{TOTAL}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "AIが担当", value: `${aiCount}工程` },
            { label: "人が判断", value: `${TOTAL - aiCount}工程` },
            { label: "制作期間", value: "従来の1/3" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2.5">
              <dt className="text-[10px] text-slate-500">{s.label}</dt>
              <dd className="font-display mt-0.5 text-xs font-bold text-white">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
