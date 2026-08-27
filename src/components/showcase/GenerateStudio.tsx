"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GENERATE_EXAMPLES, generateIndustry, type MatchResult } from "@/lib/industryGen";
import type { Industry } from "@/lib/showcase";
import { ShowcaseBody } from "@/components/showcase/ShowcaseBody";
import { MascotFace } from "@/components/assistant/MascotFace";
import { Icon } from "@/components/ui/icons";
import { ja } from "@/lib/typography";

/**
 * 職種を入力すると、その場でデモサイトの構成を組み立てる画面。
 *
 * 組み立て自体は一瞬（ブラウザ内の計算）で終わりますが、
 * **何をやっているのかが分からないと結果を信用してもらえない**ため、
 * 工程を1つずつ表示しながら進めます（合計 約1.2秒）。
 * ここで見せている工程は演出ではなく、実際に走っている処理そのものです。
 */

type Phase = "idle" | "building" | "done";

const STEPS = [
  "入力を文字N-gramに分解しています",
  "18職種のテンプレートとの類似度を計算しています",
  "3D表示・取扱データ・連携先を差し替えています",
  "デモサイトを組み立てています",
];

const STEP_MS = 300;

export function GenerateStudio() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ industry: Industry; match: MatchResult } | null>(null);
  const timers = useRef<number[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const build = useCallback((value: string) => {
    const name = value.trim();
    if (!name) return;

    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];

    setPhase("building");
    setStep(0);
    setResult(null);

    // 実際の組み立て（同期処理。ここは一瞬で終わる）
    const built = generateIndustry(name);

    STEPS.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => setStep(i), STEP_MS * i),
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setResult(built);
        setPhase("done");
        // 結果まで自動でスクロールする（下に出るので気づかれないことがある）
        window.setTimeout(
          () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
          80,
        );
      }, STEP_MS * STEPS.length),
    );
  }, []);

  return (
    <div>
      {/* ---------- 入力 ---------- */}
      <div className="panel panel-corners p-6 sm:p-8">
        <label htmlFor="industry-input" className="block text-sm font-bold text-white">
          {ja("職種・業種を入力してください")}
        </label>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {ja(
            "「ドローン空撮」「町の書店」のように、ふだん名乗っている言い方で構いません。いちばん近い構成を選んで組み立てます。",
          )}
        </p>

        <form
          className="mt-5 flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            build(input);
          }}
        >
          <input
            id="industry-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例：ドローン空撮サービス"
            maxLength={40}
            className="field h-12 min-w-0 flex-1 rounded-lg px-4 text-base text-white placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || phase === "building"}
            className="btn btn-primary h-12 px-7 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {ja(phase === "building" ? "組み立て中…" : "デモサイトを組み立てる")}
            <Icon name="sparkles" className="size-4" />
          </button>
        </form>

        <div className="mt-5">
          <p className="text-xs text-slate-500">{ja("入力例（押すとそのまま組み立てます）")}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {GENERATE_EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setInput(ex);
                  build(ex);
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-brand/40 hover:text-brand-light"
              >
                {ja(ex)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- 組み立て中 ---------- */}
      {phase === "building" ? (
        <div className="panel mt-6 grid min-h-[320px] place-items-center p-8 text-center" role="status" aria-live="polite">
          <div>
            <div className="demo-boot-bow mx-auto w-24">
              <MascotFace className="w-full" />
            </div>
            <p className="mt-6 text-base font-bold text-white">
              {ja("デモサイトを組み立てています")}
            </p>
            <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className={`flex items-start gap-2 text-sm transition-colors ${
                    i <= step ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  <Icon
                    name={i < step ? "check" : "bolt"}
                    className={`mt-0.5 size-4 shrink-0 ${i < step ? "text-gold" : "text-brand"}`}
                  />
                  <span className="min-w-0">{ja(s)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* ---------- 結果 ---------- */}
      {phase === "done" && result ? (
        <div ref={resultRef} className="mt-10 scroll-mt-28">
          {/* 何をもとに組み立てたのかを必ず開示する（結果の由来を隠さない） */}
          <div className="panel panel-corners border-gold/25 p-6">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-bold text-gold-light">{ja("組み立て結果")}</span>
              <span className="text-white">{ja(result.industry.name)}</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {result.match.confident
                ? ja(
                    `いちばん近い「${result.match.base.name}」のテンプレートを土台に、3Dで表示する対象・取扱データ・拠点名を入力に合わせて差し替えました（類似度 ${Math.round(result.match.score * 100)}%）。`,
                  )
                : ja(
                    `近い職種のテンプレートが見つからなかったため、汎用として「${result.match.base.name}」の構成を土台にしました（類似度 ${Math.round(result.match.score * 100)}%）。課題や使いどころは実態と違う可能性があります。`,
                  )}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {ja(
                "これはテンプレートの語彙を機械的に差し替えたものです。実案件では、ヒアリングした内容にもとづいて課題・シナリオ・データをすべて作り直します。この画面は「どこまで自動で組み立てられるか」をお見せするためのものです。",
              )}
            </p>
          </div>

          <div className="mt-12">
            <ShowcaseBody industry={result.industry} generated />
          </div>
        </div>
      ) : null}
    </div>
  );
}
