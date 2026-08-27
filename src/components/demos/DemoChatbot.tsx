"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DemoStage } from "./DemoUi";
import { Icon } from "@/components/ui/icons";
import {
  CONFIDENCE_THRESHOLD,
  COVERAGE_CONFIDENT,
  FOCUS_THRESHOLD,
  isConfident,
  kbDocs,
  createKbSearch,
  searchKb,
  suggestedQuestions,
  type KbDoc,
  type SearchHit,
} from "@/lib/kb";
import { ja } from "@/lib/typography";

/** 知識ドキュメント数（表示用）。モジュール読み込み時に確定します。 */
const KB_DOC_COUNT = kbDocs.length;

type Widget = "date" | "time" | "confirm" | "done";

type Message = {
  id: number;
  role: "user" | "bot";
  text: string;
  /** 回答の根拠として使った知識ドキュメント */
  sources?: SearchHit[];
  /** 表示中（1文字ずつ描画中）かどうか */
  streaming?: boolean;
  /** 知識源から答えられなかった場合 */
  unanswered?: boolean;
  /** 会話の中に差し込む操作UI（予約フロー） */
  widget?: Widget;
};

/* ------------------------------------------------------------------
 * 会話内で予約まで完結させるフロー。
 * 「質問に答えて終わり」ではなく、その場で日程を押さえるところまで運びます。
 * 実案件では、この選択結果をカレンダーAPI（Google Calendar 等）や
 * 予約システムに登録し、確認メールの送信までを自動化します。
 * ---------------------------------------------------------------- */

/** 予約意図の検出。曖昧な言い回しも拾えるようにしています。 */
const BOOKING_RE = /(予約|相談したい|打ち合わせ|打合せ|日程|アポ|申し込み|申込|話を聞き|見積もりが欲しい)/;

/** 直近の相談枠（デモ用の固定データ） */
const BOOKING_DATES = [
  { value: "11/17（火）", slots: ["10:00", "14:00", "16:30"] },
  { value: "11/18（水）", slots: ["11:00", "15:00"] },
  { value: "11/19（木）", slots: ["10:00", "13:30", "17:00"] },
];

const GREETING =
  "こんにちは。エビスソフトのサイト内AIアシスタントです。制作期間・料金・できること・会社情報などについてお答えします。この会話の中で、ご相談の予約まで完了できます。";

let messageId = 0;
const nextId = () => (messageId += 1);

/** 検索の実行時間を計測する（コンポーネント外に置き、レンダー純粋性を保つ） */
function measure<T>(fn: () => T): { value: T; ms: number } {
  const t0 = performance.now();
  const value = fn();
  return { value, ms: performance.now() - t0 };
}

/**
 * AIチャットボットのデモ。
 *
 * 実装：BM25による検索（RAGのRetrieval）→ 根拠つきで回答 → 閾値未満なら答えない。
 * 本番ではこの後段にLLMを接続して自然文を生成しますが、
 * 「根拠を示す」「知らないことは答えない」という設計はこのデモと同じです。
 */
/**
 * @param knowledge 職種別デモサイトから渡す知識源（そのお店・その医院のQ&A）。
 *   渡されたときは、当社の情報ではなく**そのサイトの内容に答えるボット**になります。
 *   仕組み（BM25検索・根拠の表示・答えられないときは答えない）は同じです。
 * @param industryName 職種名（名乗りと問い合わせ誘導の文面に使う）
 */
export default function DemoChatbot({
  knowledge,
  industryName,
}: {
  knowledge?: { q: string; a: string }[];
  industryName?: string;
}) {
  /** 知識源を差し替えるときの検索エンジン（渡されなければ当社の知識源を使う） */
  const custom = useMemo(() => {
    if (!knowledge || knowledge.length === 0) return null;
    const docs: KbDoc[] = knowledge.map((k, i) => ({
      id: `site-${i}`,
      source: "サイト内のよくある質問",
      category: "FAQ",
      key: k.q,
      answer: k.a,
    }));
    return createKbSearch(docs);
  }, [knowledge]);

  const greeting = custom
    ? `こんにちは。${industryName ?? "当店"}のサイト内AIアシスタントです。このサイトに書かれている内容についてお答えします。この会話の中で、ご予約まで進めることもできます。`
    : GREETING;

  const suggestions = custom && knowledge ? knowledge.map((k) => k.q) : suggestedQuestions;

  const [messages, setMessages] = useState<Message[]>([
    { id: nextId(), role: "bot", text: greeting },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [lastHits, setLastHits] = useState<SearchHit[]>([]);
  const [lastQuery, setLastQuery] = useState("");
  const [latency, setLatency] = useState<number | null>(null);
  const [booking, setBooking] = useState<{ date?: string; time?: string; code?: string }>({});

  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  // タイマーは必ず後片付けする（アンマウント後のsetState防止）
  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // 新しいメッセージが来たらチャット欄を末尾へ
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  };

  /** 1文字ずつ表示して、生成AIのストリーミング応答を再現する */
  const streamAnswer = (id: number, full: string) => {
    let i = 0;
    const step = () => {
      i += Math.max(1, Math.round(full.length / 90));
      const slice = full.slice(0, i);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, text: slice, streaming: i < full.length } : m)),
      );
      if (i < full.length) later(step, 16);
    };
    step();
  };

  /** ボットの発言を追加して、必要なら操作UIを添える */
  const say = (text: string, widget?: Widget) => {
    const id = nextId();
    setMessages((prev) => [...prev, { id, role: "bot", text: "", widget, streaming: true }]);
    streamAnswer(id, text);
  };

  /** 日付を選んだ */
  const pickDate = (date: string) => {
    setBooking({ date });
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: date }]);
    later(() => say(`${date} ですね。ご希望のお時間を選んでください。`, "time"), 350);
  };

  /** 時間を選んだ */
  const pickTime = (time: string) => {
    setBooking((b) => ({ ...b, time }));
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: time }]);
    later(
      () =>
        say(
          "オンライン（Google Meet）で30〜60分を予定しています。この内容で仮予約しますか？",
          "confirm",
        ),
      350,
    );
  };

  /** 確定した */
  const confirmBooking = () => {
    // 予約番号はデモ用に選択内容から組み立てる（実案件は予約システムが採番）
    const code = `EB-${(BOOKING_DATES.findIndex((d) => d.value === booking.date) + 1)
      .toString()
      .padStart(2, "0")}${(booking.time ?? "").replace(":", "")}`;
    setBooking((b) => ({ ...b, code }));
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: "この内容で予約する" }]);
    later(
      () =>
        say(
          `仮予約を承りました。\n\n日時：${booking.date} ${booking.time}〜\n形式：オンライン（Google Meet）\n受付番号：${code}\n\n確認メールをお送りします。当日までにご希望を整理いただければ、そのまま構成案のご相談に入れます。`,
          "done",
        ),
      450,
    );
  };

  const startBooking = () => {
    setBooking({});
    later(
      () =>
        say(
          "ご相談の日程を、この場でお取りできます。直近で空いている日は次のとおりです。",
          "date",
        ),
      400,
    );
  };

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || thinking) return;

    setInput("");
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: q }]);
    setLastQuery(q);

    // 予約の意図があれば、検索ではなく予約フローへ分岐する
    if (BOOKING_RE.test(q)) {
      startBooking();
      return;
    }

    setThinking(true);

    // 検索の実行時間を計測（ブラウザ内で完結するため通常1ms未満）
    const { value: hits, ms } = measure(() => (custom ? custom.search(q, 3) : searchKb(q, 3)));
    setLatency(Math.max(ms, 0.01));
    setLastHits(hits);

    const top = hits[0];
    const confident = custom ? custom.isConfident(top) : isConfident(top);

    // 検索〜生成の待ち時間を再現（実際のLLM応答は数百ms〜数秒）
    later(() => {
      setThinking(false);
      const id = nextId();
      if (confident) {
        setMessages((prev) => [
          ...prev,
          { id, role: "bot", text: "", sources: hits, streaming: true },
        ]);
        streamAnswer(id, top.doc.answer);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: "bot",
            text: "",
            sources: hits.length ? hits : undefined,
            streaming: true,
            unanswered: true,
          },
        ]);
        streamAnswer(
          id,
          custom
            ? "申し訳ありません。その質問に確実にお答えできる情報が、このサイトの中に見つかりませんでした。憶測でお答えするより、スタッフから正確にご回答します。お問い合わせフォームかお電話でご連絡ください。"
            : "申し訳ありません。その質問に確実にお答えできる情報が知識源に見つかりませんでした。憶測でお答えするより、担当者から正確にご回答します。お問い合わせフォームからご連絡ください（初回相談は無料です）。",
        );
      }
    }, 480);
  };

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setMessages([{ id: nextId(), role: "bot", text: greeting }]);
    setLastHits([]);
    setLastQuery("");
    setLatency(null);
    setThinking(false);
    setBooking({});
  };

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
      {/* ---------------- チャット本体 ---------------- */}
      <DemoStage
        className="min-w-0 lg:col-span-3"
        label={custom ? "AI_Assistant" : "エビスソフト.AI_Assistant"}
        status={thinking ? "THINKING…" : "ONLINE"}
      >
        <div
          ref={logRef}
          className="h-[380px] space-y-4 overflow-y-auto p-5 sm:h-[440px]"
          role="log"
          aria-live="polite"
          aria-label="チャットの履歴"
        >
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand/20 px-4 py-2.5 text-sm leading-relaxed text-white ring-1 ring-brand/30">
                  {ja(m.text)}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/10 text-brand-light">
                  <Icon name="sparkles" className="size-4" />
                </span>
                <div className="max-w-[88%]">
                  <div
                    className={`rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ring-1 ${
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

                  {/* 回答の根拠（RAGの肝：どの情報を使ったかを開示する） */}
                  {m.sources && !m.streaming && !m.unanswered ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-display text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                        Source
                      </span>
                      {m.sources.slice(0, 2).map((h) =>
                        h.doc.href ? (
                          <Link
                            prefetch={false}
                            key={h.doc.id}
                            href={h.doc.href}
                            className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold-light transition-colors hover:bg-gold/20"
                          >
                            {h.doc.source}
                          </Link>
                        ) : (
                          <span
                            key={h.doc.id}
                            className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-400"
                          >
                            {h.doc.source}
                          </span>
                        ),
                      )}
                    </div>
                  ) : null}

                  {/* 会話に差し込む予約UI（読み上げが終わってから出す） */}
                  {m.widget && !m.streaming ? (
                    <div className="mt-2.5">
                      {m.widget === "date" ? (
                        <div className="flex flex-wrap gap-2">
                          {BOOKING_DATES.map((d) => (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => pickDate(d.value)}
                              className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand-light transition-colors hover:bg-brand/20"
                            >
                              {d.value}
                              <span className="ml-1.5 text-[10px] text-slate-500">
                                空き{d.slots.length}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {m.widget === "time" ? (
                        <div className="flex flex-wrap gap-2">
                          {(BOOKING_DATES.find((d) => d.value === booking.date)?.slots ?? []).map(
                            (t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => pickTime(t)}
                                className="font-display rounded-lg border border-brand/40 bg-brand/10 px-3.5 py-2 text-xs font-bold text-brand-light transition-colors hover:bg-brand/20"
                              >
                                {t}
                              </button>
                            ),
                          )}
                        </div>
                      ) : null}

                      {m.widget === "confirm" ? (
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                          <dl className="space-y-1 text-xs">
                            <div className="flex gap-2">
                              <dt className="w-12 shrink-0 text-slate-500">日時</dt>
                              <dd className="font-bold text-white">
                                {booking.date} {booking.time}〜
                              </dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="w-12 shrink-0 text-slate-500">形式</dt>
                              <dd className="text-slate-300">オンライン（30〜60分）</dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="w-12 shrink-0 text-slate-500">費用</dt>
                              <dd className="text-slate-300">無料</dd>
                            </div>
                          </dl>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={confirmBooking}
                              className="rounded-lg bg-gradient-to-r from-brand to-accent px-4 py-2 text-xs font-bold text-ink"
                            >
                              この内容で予約する
                            </button>
                            <button
                              type="button"
                              onClick={startBooking}
                              className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-400 transition-colors hover:text-white"
                            >
                              日時を選び直す
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {m.widget === "done" ? (
                        <Link
                          prefetch={false}
                          href="/contact"
                          className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold text-gold-light transition-colors hover:bg-gold/20"
                        >
                          事前にご要望を送っておく
                          <Icon name="arrowRight" className="size-3" />
                        </Link>
                      ) : null}
                    </div>
                  ) : null}

                  {m.unanswered && !m.streaming ? (
                    <Link
                      prefetch={false}
                      href="/contact"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-brand/40 bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand-light transition-colors hover:bg-brand/20"
                    >
                      お問い合わせフォームへ
                      <Icon name="arrowRight" className="size-3" />
                    </Link>
                  ) : null}
                </div>
              </div>
            ),
          )}

          {thinking ? (
            <div className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/10 text-brand-light">
                <Icon name="sparkles" className="size-4" />
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

        {/* 質問例 */}
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => ask("相談を予約したい")}
            disabled={thinking}
            className="rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand-light transition-colors hover:bg-brand/20 disabled:opacity-40"
          >
            {ja("相談を予約したい")}
          </button>
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              disabled={thinking}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-400 transition-colors hover:border-brand/40 hover:text-brand-light disabled:opacity-40"
            >
              {ja(q)}
            </button>
          ))}
        </div>

        {/* 入力欄 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 border-t border-white/10 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="質問を入力してください（例：料金はいくら？）"
            aria-label="質問を入力"
            className="field !mt-0 flex-1"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-accent text-ink transition-opacity disabled:opacity-40"
            aria-label="送信"
          >
            <Icon name="arrowRight" className="size-5" />
          </button>
          <button
            type="button"
            onClick={reset}
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:text-white"
            aria-label="会話をリセット"
          >
            <Icon name="refresh" className="size-4" />
          </button>
        </form>
      </DemoStage>

      {/* ---------------- 検索プロセスの可視化 ---------------- */}
      <div className="panel space-y-4 p-5 min-w-0 lg:col-span-2">
        <div>
          <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            Retrieval / 検索プロセス
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {ja("AIが「どの情報を根拠に答えたか」をリアルタイムで表示しています。RAG構成では、この検索結果だけを材料にして回答を生成するため、知識源にないことは答えられません。")}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 text-center">
          <div className="bg-ink-2/80 px-3 py-3">
            <dt className="text-[10px] text-slate-500">知識ドキュメント</dt>
            <dd className="font-display mt-1 text-lg font-bold text-brand-light">
              {custom ? custom.docCount : KB_DOC_COUNT}
            </dd>
          </div>
          <div className="bg-ink-2/80 px-3 py-3">
            <dt className="text-[10px] text-slate-500">検索時間</dt>
            <dd className="font-display mt-1 text-lg font-bold text-brand-light">
              {latency === null ? "—" : `${latency.toFixed(2)}ms`}
            </dd>
          </div>
        </dl>

        {lastQuery ? (
          <div>
            <p className="text-[11px] text-slate-500">
              クエリ：<span className="text-slate-300">{lastQuery}</span>
            </p>
            <ul className="mt-3 space-y-3">
              {lastHits.length === 0 ? (
                <li className="text-xs text-amber-200/80">
                  一致する知識ドキュメントが見つかりませんでした。
                </li>
              ) : (
                lastHits.map((h, i) => (
                  <li key={h.doc.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs text-slate-300">
                        <span className="font-display mr-1.5 text-[10px] text-slate-600">
                          #{i + 1}
                        </span>
                        {h.doc.source}
                      </span>
                      <span className="font-display shrink-0 text-[10px] text-brand-light tabular-nums">
                        {h.score.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          i === 0 && isConfident(h)
                            ? "bg-gradient-to-r from-brand to-accent"
                            : "bg-white/25"
                        }`}
                        style={{ width: `${Math.round(h.relevance * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-600">
                      {h.doc.category}
                      <span className="ml-2 tabular-nums">
                        内容語 {Math.round(h.focus * 100)}%
                      </span>
                    </p>
                  </li>
                ))
              )}
            </ul>
            <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-slate-500">
              スコアが <span className="text-slate-300">{CONFIDENCE_THRESHOLD}</span> 未満のとき、
              スコアの <span className="text-slate-300">{Math.round(FOCUS_THRESHOLD * 100)}%</span>{" "}
              以上が内容語で説明できないとき、質問の内容語の{" "}
              <span className="text-slate-300">{Math.round(COVERAGE_CONFIDENT * 100)}%</span>{" "}
              以上が根拠の文書に含まれないときは、回答せず問い合わせへ誘導します。
              「〜ますか」のような言い回しだけで点が積み上がった一致を弾くための判定です（誤答の抑制）。
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
            {ja("質問を送ると、ここに検索結果とスコアが表示されます。")}
          </p>
        )}
      </div>
    </div>
  );
}
