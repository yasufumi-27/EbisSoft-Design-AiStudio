"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DemoStage } from "./DemoUi";
import { Icon } from "@/components/ui/icons";

/* ------------------------------------------------------------------
 * AIエージェント対応デモ。
 *
 * 「AIがこのサイトをどう読むか」を、実データで見せます。
 * - llms.txt … 実際にこのサイトから fetch します
 * - 構造化データ … このページに埋め込まれた JSON-LD をその場で解析します
 * - エージェントの行動（在庫照会・予約）だけは、静的配信のためシミュレーションです
 * ---------------------------------------------------------------- */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Step = {
  id: number;
  label: string;
  detail: string;
  kind: "read" | "parse" | "decide" | "act" | "done" | "error";
  payload?: string;
};

const KIND_STYLE: Record<Step["kind"], { color: string; icon: "search" | "code" | "bot" | "plug" | "check" | "shield" }> =
  {
    read: { color: "text-sky-300", icon: "search" },
    parse: { color: "text-violet-300", icon: "code" },
    decide: { color: "text-amber-300", icon: "bot" },
    act: { color: "text-brand-light", icon: "plug" },
    done: { color: "text-emerald-300", icon: "check" },
    error: { color: "text-rose-300", icon: "shield" },
  };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** ユーザーがAIに投げる想定の依頼 */
const REQUESTS = [
  "京都でAIチャットボットを作れる制作会社を探して、料金と納期を教えて",
  "3DCGとARに対応している京都のWeb制作会社を比較して",
  "予算60万円でコーポレートサイトを作れる会社に問い合わせておいて",
];

export default function DemoAiAgent() {
  const [request, setRequest] = useState(REQUESTS[0]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [llms, setLlms] = useState<string | null>(null);
  const [jsonLd, setJsonLd] = useState<{ type: string; keys: string[]; raw: string }[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);

  const aliveRef = useRef(true);
  const logRef = useRef<HTMLDivElement>(null);
  const stepId = useRef(0);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [steps]);

  /* ---- このページに埋め込まれている構造化データを実際に読む ---- */
  useEffect(() => {
    // エフェクト内で同期的に状態更新しないよう、次のタスクで反映する
    queueMicrotask(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
    );
    const parsed: { type: string; keys: string[]; raw: string }[] = [];
    for (const n of nodes) {
      try {
        const data = JSON.parse(n.textContent ?? "");
        const list = Array.isArray(data) ? data : [data];
        for (const o of list) {
          const t = Array.isArray(o["@type"]) ? o["@type"].join(" + ") : String(o["@type"] ?? "?");
          parsed.push({
            type: t,
            keys: Object.keys(o).filter((k) => !k.startsWith("@")),
            raw: JSON.stringify(o, null, 2),
          });
        }
      } catch {
        // 解析できないものは無視
      }
    }
      setJsonLd(parsed);
    });
  }, []);

  const push = useCallback((s: Omit<Step, "id">) => {
    if (!aliveRef.current) return;
    stepId.current += 1;
    setSteps((prev) => [...prev, { ...s, id: stepId.current }]);
  }, []);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setSteps([]);
    setAnswer(null);
    stepId.current = 0;

    try {
      push({
        kind: "decide",
        label: "ユーザーの依頼を解釈",
        detail: `「${request}」を、条件（地域・技術・予算）に分解しました。`,
      });
      await sleep(700);

      // --- 1. llms.txt を実際に取得 ---
      push({ kind: "read", label: "GET /llms.txt", detail: "AI向けのサイト案内を探しています…" });
      let text = llms;
      if (!text) {
        const res = await fetch(`${BASE}/llms.txt`, { cache: "force-cache" });
        if (!res.ok) throw new Error(`llms.txt の取得に失敗しました（${res.status}）`);
        text = await res.text();
        if (!aliveRef.current) return;
        setLlms(text);
      }
      const headings = text.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3));
      push({
        kind: "done",
        label: "llms.txt を取得（実データ）",
        detail: `${text.length.toLocaleString()}文字。見出し：${headings.join(" / ")}`,
      });
      await sleep(600);

      // --- 2. 構造化データを解析 ---
      push({
        kind: "parse",
        label: "構造化データ（JSON-LD）を解析",
        detail: `このページから ${jsonLd.length} 件のノードを検出：${jsonLd.map((j) => j.type).join(", ")}`,
      });
      await sleep(700);

      // --- 3. 必要な事実を抽出（llms.txt の実データから拾う） ---
      const priceLine = text.split("\n").find((l) => l.includes("298,000円")) ?? "";
      const areaLine = text.split("\n").find((l) => l.includes("対応エリア")) ?? "";
      const speedLine = text.split("\n").find((l) => l.includes("最短5日")) ?? "";
      push({
        kind: "parse",
        label: "回答に必要な事実を抽出",
        detail: "料金・対応エリア・納期・専門領域を、機械可読な形で取得できました。",
        payload: [priceLine, areaLine, speedLine].filter(Boolean).join("\n"),
      });
      await sleep(700);

      // --- 4. エージェントによる行動（ここはシミュレーション） ---
      push({
        kind: "act",
        label: "POST /agent/api/availability",
        detail: "エージェント向けAPIで、相談枠の空きを照会しています…（シミュレーション）",
      });
      await sleep(900);
      push({
        kind: "done",
        label: "200 OK",
        detail: "直近の相談可能枠：11/17(火) 10:00 / 14:00、11/18(水) 15:00",
      });
      await sleep(600);

      push({
        kind: "act",
        label: "POST /agent/api/inquiry",
        detail: "ユーザーに代わって問い合わせを送信しています…（シミュレーション）",
      });
      await sleep(900);
      push({
        kind: "done",
        label: "問い合わせを登録",
        detail: "受付番号 AG-40213 を発行。担当者へ通知しました。",
      });
      await sleep(500);

      setAnswer(
        "京都市伏見区の エビスソフト が条件に合致します。AIチャットボット（RAG構成）と3DCG・ARに対応し、料金は298,000円〜（小規模）／680,000円〜（標準）。小規模サイトは最短5日で公開できます。相談枠が空いていたため、11/17(火) 10:00 で仮の問い合わせを送信しました（受付番号 AG-40213）。",
      );
      push({ kind: "done", label: "ユーザーへ回答を生成", detail: "根拠はすべてサイトの公開情報です。" });
    } catch (e) {
      push({
        kind: "error",
        label: "エラー",
        detail: e instanceof Error ? e.message : "不明なエラーが発生しました。",
      });
    } finally {
      if (aliveRef.current) setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 依頼の選択 */}
      <div className="panel p-5">
        <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
          User Request / AIへの依頼
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          利用者はサイトを直接見ず、AIに調べさせます。AIが読める形になっていなければ、比較の候補にすら入りません。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {REQUESTS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRequest(r)}
              aria-pressed={request === r}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                request === r
                  ? "border-brand/60 bg-brand/15 text-brand-light"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="btn btn-primary mt-4 inline-flex h-11 items-center px-6 text-sm disabled:opacity-50"
        >
          <Icon name="bot" className="size-4" />
          {running ? "エージェント実行中…" : "エージェントを実行"}
        </button>
      </div>

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-2">
        {/* エージェントの動作ログ */}
        <DemoStage label="エビスソフト.Agent_Trace" status={running ? "RUNNING…" : `${steps.length} STEPS`}>
          <div
            ref={logRef}
            className="h-[380px] space-y-3 overflow-y-auto p-5"
            role="log"
            aria-live="polite"
          >
            {steps.length === 0 ? (
              <p className="pt-24 text-center text-xs text-slate-500">
                「エージェントを実行」を押すと、
                <br />
                AIがこのサイトを読む流れが再現されます。
              </p>
            ) : (
              steps.map((s) => {
                const st = KIND_STYLE[s.kind];
                return (
                  <div key={s.id} className="log-line flex gap-3">
                    <span
                      className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 ${st.color}`}
                    >
                      <Icon name={st.icon} className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-mono text-xs font-bold ${st.color}`}>{s.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{s.detail}</p>
                      {s.payload ? (
                        <pre className="mt-1.5 overflow-x-auto rounded-lg border border-white/10 bg-ink/70 p-2 text-[10px] leading-relaxed whitespace-pre-wrap text-slate-500">
                          {s.payload}
                        </pre>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {answer ? (
            <div className="border-t border-white/10 bg-emerald-400/[0.04] p-5">
              <p className="font-display text-[10px] font-bold tracking-[0.25em] text-emerald-300 uppercase">
                AI → User
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{answer}</p>
            </div>
          ) : null}
        </DemoStage>

        {/* AIが読んでいる実データ */}
        <DemoStage label="エビスソフト.Machine_Readable" status="REAL DATA">
          <div className="h-[380px] space-y-4 overflow-y-auto p-5">
            <div>
              <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
                /llms.txt（このサイトの実ファイル）
              </p>
              {llms ? (
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 bg-ink/70 p-3 text-[10px] leading-relaxed whitespace-pre-wrap text-slate-400">
                  {llms.slice(0, 900)}
                  {llms.length > 900 ? "\n…" : ""}
                </pre>
              ) : (
                <p className="mt-2 rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-slate-600">
                  エージェントを実行すると、ここに実際の取得結果が表示されます
                </p>
              )}
            </div>

            <div>
              <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
                構造化データ（このページのJSON-LD）
              </p>
              <ul className="mt-2 space-y-2">
                {jsonLd.map((j, i) => (
                  <li
                    key={`${j.type}-${i}`}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <p className="font-display text-xs font-bold text-violet-300">{j.type}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                      {j.keys.slice(0, 10).join(" / ")}
                      {j.keys.length > 10 ? " …" : ""}
                    </p>
                  </li>
                ))}
                {jsonLd.length === 0 ? (
                  <li className="text-xs text-slate-600">構造化データを検出できませんでした。</li>
                ) : null}
              </ul>
            </div>
          </div>
        </DemoStage>
      </div>
    </div>
  );
}
