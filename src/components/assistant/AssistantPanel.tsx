"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { ja } from "@/lib/typography";
import { MascotFace } from "./MascotFace";
import { askKb, suggestedQuestions, type SearchHit } from "@/lib/kb";

/**
 * サイト内AIアシスタントの本体（チャット画面）。
 *
 * `/demo/ai-chatbot` の技術デモ（検索スコアの可視化・予約フロー付き）とは別物で、
 * こちらは「サイトに書いてあることを、どのページからでも聞ける」ための常設の案内役です。
 *
 * 仕組みはデモと同じ `src/lib/kb.ts`（content.ts から生成した知識ドキュメント＋BM25検索）。
 * 静的配信なのでブラウザ内で完結し、サーバーもAPIキーも不要です。
 * 確信度が閾値に満たないときは答えず、お問い合わせへ誘導します（誤答の抑制）。
 *
 * ※ このファイルは content.ts を間接的に読み込むため必ず遅延読み込みすること。
 *    起動役（SiteAssistant）が開いたときだけ import します。
 */

type Message = {
  id: number;
  role: "user" | "bot";
  text: string;
  /** 回答の根拠に使った知識ドキュメント */
  sources?: SearchHit[];
  /** 1文字ずつ描画している最中か */
  streaming?: boolean;
  /** 知識源から答えられなかった */
  unanswered?: boolean;
};

const GREETING =
  "こんにちは、CHROMA（クロマ）です。エビスソフトの案内役をしています。料金・制作期間・できること・組み込み開発・会社情報など、このサイトに書かれていることにお答えします。「AIって何？」「Web制作って何をするの？」のような用語の質問も大丈夫です。お気軽にどうぞ。";

let messageId = 0;
const nextId = () => (messageId += 1);

export default function AssistantPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: nextId(), role: "bot", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  // アンマウント後に setState しないよう、タイマーは必ず後片付けする
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  // 開いたら入力欄へフォーカス（キーボード操作でそのまま質問できる）
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Esc で閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 新しい発言が来たら末尾へスクロール
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /** 1文字ずつ表示して、生成AIのストリーミング応答を再現する */
  const streamAnswer = (id: number, full: string) => {
    let i = 0;
    const step = () => {
      i += Math.max(1, Math.round(full.length / 80));
      const slice = full.slice(0, i);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, text: slice, streaming: i < full.length } : m)),
      );
      if (i < full.length) later(step, 16);
    };
    step();
  };

  const ask = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!q || thinking) return;

      setInput("");
      setMessages((prev) => [...prev, { id: nextId(), role: "user", text: q }]);
      setThinking(true);

      // 検索・確信度の判定・文面の決定は kb 側にまとめてある（デモと判定をそろえるため）
      const result = askKb(q, 3);

      // 検索〜生成の待ち時間を再現（検索自体はブラウザ内で1ms未満）
      later(() => {
        setThinking(false);
        const id = nextId();
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: "bot",
            text: "",
            streaming: true,
            // 答えられなかったときは、無関係なページを根拠として見せない
            sources: result.sources.length > 0 ? result.sources : undefined,
            unanswered: result.kind === "none",
          },
        ]);
        streamAnswer(id, result.text);
      }, 420);
    },
    // streamAnswer / later は ref とセッターしか使わないため依存は thinking のみで足りる
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [thinking],
  );

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="サイト内AIアシスタント"
      className="assistant-panel panel flex flex-col overflow-hidden"
    >
      {/* ------------ ヘッダー ------------ */}
      <div className="flex items-center gap-3 border-b border-brand/20 bg-white/[0.03] px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/10">
          <MascotFace className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">CHROMA<span className="ml-2 text-[0.62rem] font-normal tracking-[0.16em] text-brand">AI ASSISTANT</span></p>
          <p className="font-display truncate text-[10px] tracking-[0.2em] text-brand-light/80 uppercase">
            {thinking ? "Thinking…" : "Online"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="アシスタントを閉じる"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand/20 bg-white/5 text-slate-400 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* ------------ 会話ログ ------------ */}
      <div
        ref={logRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="チャットの履歴"
      >
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand/20 px-3.5 py-2 text-sm leading-relaxed text-white ring-1 ring-brand/30">
                {ja(m.text)}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/10">
                <MascotFace className="size-5" />
              </span>
              <div className="min-w-0 max-w-[88%]">
                <div
                  className={`rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ring-1 ${
                    m.unanswered
                      ? "bg-amber-400/10 text-amber-100 ring-amber-400/25"
                      : "bg-white/[0.06] text-slate-200 ring-white/10"
                  }`}
                >
                  {ja(m.text)}
                  {m.streaming ? (
                    <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-brand" />
                  ) : null}
                </div>

                {/* 根拠にしたページへのリンク（どこに書いてあるかまで案内する） */}
                {m.sources && !m.streaming ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {m.sources
                      .filter((h) => h.doc.href)
                      .slice(0, 2)
                      .map((h) => (
                        <Link
                          prefetch={false}
                          key={h.doc.id}
                          href={h.doc.href as string}
                          onClick={onClose}
                          className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold-light transition-colors hover:bg-gold/20"
                        >
                          {ja(h.doc.source)}
                        </Link>
                      ))}
                  </div>
                ) : null}

                {m.unanswered && !m.streaming ? (
                  <Link
                    prefetch={false}
                    href="/contact"
                    onClick={onClose}
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-brand/40 bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand-light transition-colors hover:bg-brand/20"
                  >
                    お問い合わせへ
                    <Icon name="arrowRight" className="size-3" />
                  </Link>
                ) : null}
              </div>
            </div>
          ),
        )}

        {thinking ? (
          <div className="flex gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/10">
              <MascotFace className="size-5" />
            </span>
            <span className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3 ring-1 ring-white/10">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-brand"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        ) : null}
      </div>

      {/* ------------ 質問例 ------------ */}
      <div className="assistant-chips flex gap-2 overflow-x-auto border-t border-brand/20 px-3 py-2.5">
        {suggestedQuestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => ask(q)}
            disabled={thinking}
            className="shrink-0 rounded-full border border-brand/20 bg-white/5 px-3 py-1 text-[11px] whitespace-nowrap text-slate-400 transition-colors hover:border-brand/40 hover:text-brand-light disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ------------ 入力欄 ------------ */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 border-t border-brand/20 p-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="質問を入力（例：料金はいくら？）"
          aria-label="質問を入力"
          className="field !mt-0 min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={thinking || !input.trim()}
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-accent text-ink transition-opacity disabled:opacity-40"
          aria-label="送信"
        >
          <Icon name="arrowRight" className="size-5" />
        </button>
      </form>

      <p className="border-t border-brand/20 px-4 py-2 text-[10px] leading-relaxed text-slate-500">
        このサイトの掲載内容と、Web・AIの用語解説だけを根拠に回答します。それ以外は答えません。
      </p>
    </div>
  );
}
