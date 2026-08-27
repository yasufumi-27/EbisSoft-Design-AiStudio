"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DemoStage } from "./DemoUi";
import { Icon } from "@/components/ui/icons";

/* ==================================================================
 * 1. テキストスクランブル
 * ================================================================ */

const GLYPHS = "アイウエオカキクケコサシスセソ0123456789#%&@*<>/\\";

function ScrambleText({ text, className = "" }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);
  const raf = useRef(0);

  const run = useCallback(() => {
    cancelAnimationFrame(raf.current);
    frame.current = 0;
    const total = text.length * 4 + 20;

    const tick = () => {
      frame.current += 1;
      const progress = frame.current / total;
      const revealed = Math.floor(progress * text.length * 1.4);
      const next = text
        .split("")
        .map((ch, i) => {
          if (ch === " " || i < revealed) return ch;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");
      setDisplay(next);
      if (frame.current < total) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };
    raf.current = requestAnimationFrame(tick);
  }, [text]);

  useEffect(() => {
    run();
    return () => cancelAnimationFrame(raf.current);
  }, [run]);

  return (
    <button
      type="button"
      onClick={run}
      onMouseEnter={run}
      className={`font-display cursor-pointer tabular-nums ${className}`}
      aria-label={`${text}（クリックで再生）`}
    >
      {display}
    </button>
  );
}

/* ==================================================================
 * 2. SVGパス描画アニメーション
 * ================================================================ */

function SvgDraw() {
  const [key, setKey] = useState(0);
  return (
    <div className="flex h-full flex-col">
      <svg
        key={key}
        viewBox="0 0 200 110"
        className="w-full flex-1"
        role="img"
        aria-label="折れ線グラフが描かれるアニメーション"
      >
        <defs>
          <linearGradient id="draw-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="60%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#e2c078" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((y) => (
          <line key={y} x1="10" y1={y} x2="190" y2={y} stroke="rgba(148,163,184,0.12)" />
        ))}
        <path
          d="M12 88 L52 62 L92 70 L132 34 L188 14"
          fill="none"
          stroke="url(#draw-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="svg-draw"
        />
        {[
          [12, 88],
          [52, 62],
          [92, 70],
          [132, 34],
          [188, 14],
        ].map(([cx, cy], i) => (
          <circle
            key={cx}
            cx={cx}
            cy={cy}
            r="4"
            fill="#05070f"
            stroke="#22d3ee"
            strokeWidth="2"
            className="svg-dot"
            style={{ animationDelay: `${0.35 + i * 0.28}s` }}
          />
        ))}
      </svg>
      <button
        type="button"
        onClick={() => setKey((k) => k + 1)}
        className="mt-2 self-start text-xs font-semibold text-brand-light transition-colors hover:text-white"
      >
        ↻ もう一度再生
      </button>
    </div>
  );
}

/* ==================================================================
 * 3. マグネティックボタン（カーソルに吸い付く）
 * ================================================================ */

function MagneticButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.3}px, ${y * 0.4}px)`;
  };

  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "translate(0, 0)";
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    window.setTimeout(() => setRipples((prev) => prev.filter((p) => p.id !== id)), 700);
  };

  return (
    <div
      className="grid h-full place-items-center py-4"
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className="relative overflow-hidden rounded-full bg-gradient-to-r from-brand to-accent px-7 py-3 text-sm font-bold text-ink shadow-[0_0_28px_rgba(34,211,238,0.4)] transition-transform duration-200 ease-out"
      >
        <span className="relative z-10">触れてみてください</span>
        {ripples.map((r) => (
          <span
            key={r.id}
            className="demo-ripple"
            style={{ left: r.x, top: r.y }}
            aria-hidden
          />
        ))}
      </button>
    </div>
  );
}

/* ==================================================================
 * 4. 円形プログレス＋カウントアップ（画面に入ったら開始）
 * ================================================================ */

function CircularProgress({ target = 98, label }: { target?: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let started = false;

    const animate = () => {
      const start = performance.now();
      const duration = 1400;
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(eased * target));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          animate();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, runId]);

  const R = 42;
  const C = 2 * Math.PI * R;

  return (
    <div ref={ref} className="flex h-full flex-col items-center justify-center gap-2">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 100 100" role="img" aria-label={`${label} ${value}%`}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (C * value) / 100}
            transform="rotate(-90 50 50)"
            style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.6))" }}
          />
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-display absolute inset-0 grid place-items-center text-2xl font-bold text-white tabular-nums">
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          setValue(0);
          setRunId((n) => n + 1);
        }}
        className="text-xs font-semibold text-brand-light transition-colors hover:text-white"
      >
        ↻ {label}
      </button>
    </div>
  );
}

/* ==================================================================
 * 5. カード3Dフリップ
 * ================================================================ */

function FlipCard() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="grid h-full place-items-center py-2">
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
        className="demo-flip h-32 w-52"
        aria-label="カードを裏返す"
      >
        <span className={`demo-flip-inner ${flipped ? "is-flipped" : ""}`}>
          <span className="demo-flip-face bg-gradient-to-br from-brand/25 to-accent/25 text-white">
            <span className="font-display text-sm tracking-[0.2em]">FRONT</span>
            <span className="mt-1 text-xs text-slate-300">カーソルを乗せる</span>
          </span>
          <span className="demo-flip-face demo-flip-back bg-gradient-to-br from-gold/30 to-amber-500/20 text-white">
            <span className="font-display text-sm tracking-[0.2em]">BACK</span>
            <span className="mt-1 text-xs text-slate-200">裏面に切り替わりました</span>
          </span>
        </span>
      </button>
    </div>
  );
}

/* ==================================================================
 * 6. スクロール連動（このデモ内のスクロール量に反応）
 * ================================================================ */

function ScrollLinked() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 要素が下から入って上へ抜けるまでを 0→1 に正規化
      const raw = (vh - rect.top) / (vh + rect.height);
      setProgress(Math.min(Math.max(raw, 0), 1));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const pct = Math.round(progress * 100);

  return (
    <div ref={ref} className="flex h-full flex-col justify-center gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-400">スクロール位置</span>
        <span className="font-display text-lg font-bold text-brand-light tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand via-accent to-gold transition-[width] duration-75"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="relative h-16 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        {/* 進捗に応じて移動・回転する要素（パララックス表現の最小例） */}
        <span
          aria-hidden
          className="absolute top-1/2 size-9 -translate-y-1/2 rounded-lg bg-gradient-to-br from-brand to-accent shadow-[0_0_20px_rgba(34,211,238,0.6)]"
          style={{
            left: `calc(${pct}% - ${pct * 0.36}px)`,
            transform: `translateY(-50%) rotate(${progress * 540}deg)`,
          }}
        />
      </div>
      <p className="text-xs text-slate-500">ページをスクロールすると連動して動きます。</p>
    </div>
  );
}

/* ==================================================================
 * 7. スタガー（時間差）リビール
 * ================================================================ */

function StaggerReveal() {
  const [key, setKey] = useState(0);
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div key={key} className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="stagger-item h-9 rounded-lg bg-gradient-to-br from-brand/40 to-accent/40"
            style={{ animationDelay: `${i * 55}ms` }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setKey((k) => k + 1)}
        className="self-start text-xs font-semibold text-brand-light transition-colors hover:text-white"
      >
        ↻ もう一度再生
      </button>
    </div>
  );
}

/* ==================================================================
 * デモ本体
 * ================================================================ */

type Panel = {
  title: string;
  note: string;
  render: () => React.ReactElement;
};

const PANELS: Panel[] = [
  {
    title: "テキストスクランブル",
    note: "見出しの登場演出。クリック／ホバーで再生します。",
    render: () => (
      <div className="grid h-full place-items-center">
        <ScrambleText text="エビスソフト" className="text-3xl font-bold text-gradient sm:text-4xl" />
      </div>
    ),
  },
  {
    title: "SVGパス描画",
    note: "グラフや図解を「描かれていく」演出で見せます。",
    render: () => <SvgDraw />,
  },
  {
    title: "マグネティック＋波紋",
    note: "カーソルに吸い付き、クリックで波紋が広がるボタン。",
    render: () => <MagneticButton />,
  },
  {
    title: "カウントアップ",
    note: "画面に入った瞬間に数値と円グラフが動き出します。",
    render: () => <CircularProgress target={98} label="もう一度" />,
  },
  {
    title: "3Dフリップカード",
    note: "CSSの3D変形。表裏で情報を切り替えます。",
    render: () => <FlipCard />,
  },
  {
    title: "スクロール連動",
    note: "スクロール量に応じて要素が移動・回転します。",
    render: () => <ScrollLinked />,
  },
  {
    title: "スタガーリビール",
    note: "時間差で要素が現れ、視線を自然に誘導します。",
    render: () => <StaggerReveal />,
  },
  {
    title: "モーフィング",
    note: "有機的に形が変わり続ける背景オブジェクト。",
    render: () => (
      <div className="grid h-full place-items-center">
        <span className="blob-morph size-28 bg-gradient-to-br from-brand via-accent to-gold opacity-80 shadow-[0_0_40px_rgba(139,92,246,0.45)]" />
      </div>
    ),
  },
];

/**
 * Webアニメーションのデモ。
 * すべて CSS Animations / Web Animations API / IntersectionObserver のみで実装し、
 * 外部アニメーションライブラリは読み込んでいません（＝表示速度に影響しない）。
 */
export default function DemoAnimation() {
  // このコンポーネントはクライアントでのみ読み込まれるため、初期化時に判定できる
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  return (
    <div className="space-y-5">
      {reduced ? (
        <p className="rounded-xl border border-brand/25 bg-brand/[0.06] p-4 text-xs text-slate-300">
          お使いの環境は「動きを減らす」設定が有効なため、一部のアニメーションを抑制して表示しています。
          アクセシビリティ対応として、実案件でも同じ配慮を標準実装します。
        </p>
      ) : null}

      <DemoStage label="エビスソフト.Motion_Lab" status="LIVE / 8 PATTERNS">
        <div className="grid gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
          {PANELS.map((p) => (
            <div key={p.title} className="flex flex-col bg-ink-2/70 p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Icon name="bolt" className="size-4 shrink-0 text-brand" />
                {p.title}
              </h3>
              <div className="my-4 min-h-[9rem] flex-1">{p.render()}</div>
              <p className="text-xs leading-relaxed text-slate-500">{p.note}</p>
            </div>
          ))}
        </div>
      </DemoStage>
    </div>
  );
}
