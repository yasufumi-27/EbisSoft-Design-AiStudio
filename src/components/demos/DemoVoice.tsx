"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChipButton, ControlGroup, DemoStage, RangeControl } from "./DemoUi";
import { Icon } from "@/components/ui/icons";
import { isConfident, searchKb, type SearchHit } from "@/lib/kb";

/* ------------------------------------------------------------------
 * Web Speech API の型（TypeScriptの標準libに含まれないため最小限を定義）
 * ---------------------------------------------------------------- */
type SpeechRecognitionResultLike = { transcript: string };
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { isFinal: boolean; length: number; [j: number]: SpeechRecognitionResultLike };
  };
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Turn = { id: number; role: "user" | "bot"; text: string; source?: SearchHit };

let turnId = 0;

const SAMPLES = ["料金はいくらですか", "会社はどこにありますか", "納期はどれくらい", "3DCGは作れますか"];

/**
 * 音声AIデモ。
 * ブラウザ標準の Web Speech API で、実際にマイク入力を認識し、回答を読み上げます。
 * 認識に非対応のブラウザ（Safari / Firefox）では、テキスト入力で同じ流れを再現します。
 */
export default function DemoVoice() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [micHint, setMicHint] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [rate, setRate] = useState(1.05);
  const [voiceName, setVoiceName] = useState<string>("");
  const [voices, setVoices] = useState<{ name: string; lang: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [level, setLevel] = useState(0);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const levelTimer = useRef<number>(0);
  /**
   * iOS / macOS Safari は「ユーザー操作の中で一度 speak() を呼ぶ」までは
   * 読み上げが再生されない。ボタンを押した瞬間に無音を1回流して解錠する。
   */
  const unlockedRef = useRef(false);
  const unlockSpeech = () => {
    if (unlockedRef.current) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    synth.speak(u);
    unlockedRef.current = true;
  };

  /** 表示用の簡易な端末判定（対応状況の説明をわかりやすくするためだけに使う） */
  const [uaLabel, setUaLabel] = useState("確認中…");

  /* ---- 対応状況と音声一覧 ---- */
  useEffect(() => {
    const ua = navigator.userAgent;
    const isApple = /iPhone|iPad|iPod|Macintosh/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
    queueMicrotask(() =>
      setUaLabel(
        isApple && isSafari
          ? "Apple / Safari"
          : /Chrome|Chromium|Edg/.test(ua)
            ? "Chrome系"
            : /Firefox/.test(ua)
              ? "Firefox"
              : "その他",
      ),
    );
    if (isApple && isSafari) {
      queueMicrotask(() =>
        setMicHint(
          "iPhone / iPad / Mac の Safari でも動作します。初回はマイクと音声認識の許可を求められます。",
        ),
      );
    }
    const Ctor = getRecognitionCtor();
    queueMicrotask(() => setSupported(Boolean(Ctor)));

    const loadVoices = () => {
      const list = window.speechSynthesis?.getVoices() ?? [];
      const ja = list.filter((v) => v.lang.startsWith("ja"));
      const pick = (ja.length ? ja : list).map((v) => ({ name: v.name, lang: v.lang }));
      setVoices(pick);
      setVoiceName((prev) => prev || pick[0]?.name || "");
    };
    queueMicrotask(loadVoices);
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis?.cancel();
      recRef.current?.abort();
      window.clearInterval(levelTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, interim]);

  /* ---- 読み上げ ---- */
  const speak = useCallback(
    (text: string) => {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      // Safari は cancel() の直後に speak() すると無音になることがあるため1フレーム待つ
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      u.rate = rate;
      const v = synth.getVoices().find((x) => x.name === voiceName);
      if (v) u.voice = v;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.setTimeout(() => synth.speak(u), 60);
    },
    [rate, voiceName],
  );

  /* ---- 質問を処理（音声・テキスト共通） ---- */
  const answer = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!q) return;
      unlockSpeech();
      turnId += 1;
      setTurns((prev) => [...prev, { id: turnId, role: "user", text: q }]);

      const hits = searchKb(q, 1);
      const top = hits[0];
      // 判定はチャットと同じ基準にそろえる（音声だけ甘い／辛いをなくす）
      const confident = isConfident(top);
      const text = confident
        ? top.doc.answer
        : "申し訳ありません。その質問にお答えできる情報が見つかりませんでした。お電話またはお問い合わせフォームからご連絡ください。";

      turnId += 1;
      setTurns((prev) => [
        ...prev,
        { id: turnId, role: "bot", text, source: confident ? top : undefined },
      ]);
      speak(text);
    },
    [speak],
  );

  /* ---- 音声認識の開始／停止 ---- */
  const startListening = () => {
    unlockSpeech();
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    window.speechSynthesis?.cancel();
    setError(null);
    setInterim("");

    const rec = new Ctor();
    rec.lang = "ja-JP";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
      if (finalText) {
        setInterim("");
        answer(finalText);
      }
    };
    rec.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "マイクの使用が許可されていません。ブラウザの設定をご確認ください。"
          : e.error === "no-speech"
            ? "音声が聞き取れませんでした。もう一度お試しください。"
            : e.error === "service-not-allowed"
              ? "音声認識の使用が許可されていません。Safariの場合は「設定 > Safari > マイク」もご確認ください。"
              : `音声認識でエラーが発生しました（${e.error}）。`,
      );
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      window.clearInterval(levelTimer.current);
      setLevel(0);
    };

    recRef.current = rec;
    rec.start();
    setListening(true);
    // 収音中であることを示すインジケータ（マイク音量の実測ではなく視覚的な合図）
    levelTimer.current = window.setInterval(() => setLevel(Math.random()), 110);
  };

  const stopListening = () => {
    recRef.current?.stop();
    setListening(false);
  };

  const reset = () => {
    window.speechSynthesis?.cancel();
    recRef.current?.abort();
    setTurns([]);
    setInterim("");
    setError(null);
  };

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
      <DemoStage
        className="min-w-0 lg:col-span-3"
        label="エビスソフト.Voice_Assistant"
        status={listening ? "LISTENING…" : speaking ? "SPEAKING…" : "READY"}
      >
        <div ref={logRef} className="h-[300px] space-y-4 overflow-y-auto p-5 sm:h-[360px]" role="log" aria-live="polite">
          {turns.length === 0 && !interim ? (
            <p className="pt-16 text-center text-sm text-slate-500">
              マイクボタンを押して、話しかけてください。
              <br />
              例：「料金はいくらですか」
            </p>
          ) : null}

          {turns.map((t) =>
            t.role === "user" ? (
              <div key={t.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-amber-400/15 px-4 py-2.5 text-sm text-white ring-1 ring-amber-400/30">
                  {t.text}
                </p>
              </div>
            ) : (
              <div key={t.id} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-200">
                  <Icon name="mic" className="size-4" />
                </span>
                <div className="max-w-[88%]">
                  <p className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-2.5 text-sm leading-relaxed text-slate-200 ring-1 ring-white/10">
                    {t.text}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {t.source ? (
                      <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold-light">
                        {t.source.doc.source}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => speak(t.text)}
                      className="text-[11px] text-slate-500 transition-colors hover:text-brand-light"
                    >
                      ↻ もう一度読み上げる
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}

          {interim ? (
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm border border-dashed border-amber-400/40 px-4 py-2.5 text-sm text-amber-200/70">
                {interim}…
              </p>
            </div>
          ) : null}
        </div>

        {/* マイク操作 */}
        <div className="border-t border-white/10 p-5">
          {error ? (
            <p className="mb-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          ) : null}
          {micHint && !error ? (
            <p className="mb-3 rounded-lg border border-brand/25 bg-brand/[0.07] px-3 py-2 text-xs leading-relaxed text-slate-300">
              {micHint}
            </p>
          ) : null}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={supported === false}
              aria-label={listening ? "音声入力を停止" : "音声入力を開始"}
              className={`relative grid size-16 shrink-0 place-items-center rounded-full transition-all disabled:opacity-40 ${
                listening
                  ? "bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.6)]"
                  : "bg-gradient-to-br from-amber-400 to-orange-500 text-ink shadow-[0_0_22px_rgba(251,146,60,0.45)]"
              }`}
            >
              {listening ? (
                <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />
              ) : null}
              <Icon name="mic" className="relative size-7" />
            </button>

            <div className="min-w-0 flex-1">
              {/* 収音インジケータ */}
              <div className="flex h-10 items-end gap-1" aria-hidden>
                {Array.from({ length: 22 }).map((_, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-amber-500/40 to-amber-300"
                    style={{
                      height: listening
                        ? `${18 + Math.abs(Math.sin(i * 0.7 + level * 6)) * 78}%`
                        : "8%",
                      transition: "height 0.12s ease",
                    }}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {supported === false
                  ? "このブラウザは音声認識に非対応です（Firefox等）。下の入力欄からお試しください。"
                  : listening
                    ? "話しかけてください…"
                    : "マイクボタンを押して話しかけてください"}
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              aria-label="会話をリセット"
              className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:text-white"
            >
              <Icon name="refresh" className="size-4" />
            </button>
          </div>

          {/* 非対応環境・キーボード派向けの代替入力 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              answer(typed);
              setTyped("");
            }}
            className="mt-4 flex gap-2"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="キーボードで質問する（音声で読み上げます）"
              aria-label="質問を入力"
              className="field !mt-0 flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={!typed.trim()}
              className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-brand/50 disabled:opacity-40"
            >
              送信
            </button>
          </form>
        </div>
      </DemoStage>

      {/* 設定・説明 */}
      <div className="panel space-y-5 p-5 min-w-0 lg:col-span-2">
        <div>
          <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            Environment / 実行環境
          </p>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">音声認識</dt>
              <dd className={supported ? "text-emerald-300" : "text-amber-300"}>
                {supported === null ? "確認中…" : supported ? "利用できます" : "非対応"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">この端末</dt>
              <dd className="text-slate-300">{uaLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">読み上げ</dt>
              <dd className="text-emerald-300">
                {voices.length ? `${voices.length}種類の音声` : "確認中…"}
              </dd>
            </div>
          </dl>
        </div>

        {voices.length > 1 ? (
          <div>
            <label
              htmlFor="voice-select"
              className="font-display mb-2 block text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase"
            >
              Voice / 声
            </label>
            <select
              id="voice-select"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="field !mt-0 text-sm"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}（{v.lang}）
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <RangeControl
          label="Rate / 読み上げ速度"
          value={rate}
          min={0.6}
          max={1.6}
          step={0.05}
          suffix="x"
          onChange={setRate}
        />

        <ControlGroup label="Try / 質問例">
          {SAMPLES.map((s) => (
            <ChipButton key={s} active={false} onClick={() => answer(s)}>
              {s}
            </ChipButton>
          ))}
        </ControlGroup>

        <p className="border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-500">
          音声の認識・読み上げはブラウザの機能をそのまま使っているため、追加の通信費もサーバーも不要です。実案件では、より自然な会話が必要な場合にリアルタイム音声APIへ切り替えます。
        </p>
      </div>
    </div>
  );
}
