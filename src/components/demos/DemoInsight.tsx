"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DemoStage, SwitchButton } from "./DemoUi";
import { Icon } from "@/components/ui/icons";

/* ------------------------------------------------------------------
 * 行動解析・A/Bテスト。
 *
 * 【ヒートマップ】本物です。この画面へのクリック（タップ）位置を記録し、
 *   密度をCanvasに描画しています。座標はブラウザ内にのみ保持し、外部送信はしません。
 *   描き方は実務と同じ2段構え：
 *     1. 各点を「中心が濃い放射グラデーション」としてアルファに積む
 *     2. 積んだアルファをカラーパレット（青→シアン→黄→赤）に写す
 *
 * 【A/Bテスト】2案に真の反応率を設定した訪問者シミュレーションです。
 *   クリック率の集計と、有意差の判定（2標本のZ検定）は本番と同じ式を使っています。
 * ---------------------------------------------------------------- */

type Point = { x: number; y: number };

/** クリック位置をどの要素のものとして数えるか（縦位置で判定） */
const ZONES = [
  { key: "hero", label: "見出し・ヒーロー", from: 0, to: 0.42 },
  { key: "cta", label: "CTAボタン", from: 0.42, to: 0.62 },
  { key: "body", label: "説明・特徴", from: 0.62, to: 0.86 },
  { key: "foot", label: "フッター周辺", from: 0.86, to: 1.01 },
];

/* ---- ヒートマップの描画 ---- */

/** アルファ値 → 色（青→シアン→黄→赤）のルックアップテーブル（初回だけ作る） */
let paletteCache: Uint8ClampedArray | null = null;
function palette() {
  paletteCache ??= buildPalette();
  return paletteCache;
}
function buildPalette() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 1;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0.0, "rgba(30,64,175,0)");
  g.addColorStop(0.25, "rgba(34,211,238,0.85)");
  g.addColorStop(0.55, "rgba(163,230,53,0.9)");
  g.addColorStop(0.78, "rgba(250,204,21,0.95)");
  g.addColorStop(1.0, "rgba(244,63,94,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 1);
  return ctx.getImageData(0, 0, 256, 1).data;
}

function drawHeatmap(canvas: HTMLCanvasElement, points: Point[], radius: number) {
  const { width, height } = canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx || width === 0 || height === 0) return;
  ctx.clearRect(0, 0, width, height);
  if (points.length === 0) return;

  // 1) 密度をアルファとして積む
  for (const p of points) {
    const x = p.x * width;
    const y = p.y * height;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, "rgba(0,0,0,0.42)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2) 積んだアルファをカラーパレットに写す
  const lut = palette();
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    const o = a * 4;
    d[i] = lut[o];
    d[i + 1] = lut[o + 1];
    d[i + 2] = lut[o + 2];
    d[i + 3] = lut[o + 3];
  }
  ctx.putImageData(img, 0, 0);
}

/* ---- A/Bテストの統計 ---- */

/** 誤差関数の近似（Abramowitz & Stegun 7.1.26） */
function erf(x: number) {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-a * a);
  return s * y;
}
/** 両側検定のp値（標準正規分布） */
const pValue = (z: number) => 1 - erf(Math.abs(z) / Math.SQRT2);

type Variant = {
  key: "A" | "B";
  label: string;
  headline: string;
  cta: string;
  /** 真のクリック率（シミュレーション用。実際の運用では当然「未知」の値） */
  trueRate: number;
  tone: string;
};

const VARIANTS: Variant[] = [
  {
    key: "A",
    label: "A案（現行）",
    headline: "AIを駆使して、最速で、高性能なサイトを。",
    cta: "無料で相談する",
    trueRate: 0.052,
    tone: "from-slate-500 to-slate-700",
  },
  {
    key: "B",
    label: "B案（改善案）",
    headline: "料金が知りたいだけでも、3分で分かります。",
    cta: "3分で概算見積もりを見る",
    trueRate: 0.071,
    tone: "from-brand to-accent",
  },
];

export default function DemoInsight() {
  /* ---- ヒートマップ ---- */
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [showHeat, setShowHeat] = useState(true);

  const redraw = useCallback(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const rect = stage.getBoundingClientRect();
    // 解像度は等倍で十分（毎フレーム描くものではないため負荷は小さい）
    canvas.width = Math.max(1, Math.round(rect.width));
    canvas.height = Math.max(1, Math.round(rect.height));
    drawHeatmap(canvas, points, Math.max(28, rect.width * 0.075));
  }, [points]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => redraw());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [redraw]);

  const record = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const p = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
    setPoints((prev) => [...prev.slice(-199), p]);
  };

  const zoneStats = useMemo(() => {
    const total = points.length || 1;
    return ZONES.map((z) => {
      const n = points.filter((p) => p.y >= z.from && p.y < z.to).length;
      return { ...z, n, ratio: n / total };
    });
  }, [points]);

  /* ---- A/Bテスト ---- */
  const [ab, setAb] = useState({
    A: { imp: 0, conv: 0 },
    B: { imp: 0, conv: 0 },
  });

  const runVisitors = (n: number) => {
    setAb((prev) => {
      const next = { A: { ...prev.A }, B: { ...prev.B } };
      for (let i = 0; i < n; i++) {
        // 訪問者を50:50で振り分け、その案の真の反応率でクリックが起きる
        const v = Math.random() < 0.5 ? VARIANTS[0] : VARIANTS[1];
        const slot = next[v.key];
        slot.imp += 1;
        if (Math.random() < v.trueRate) slot.conv += 1;
      }
      return next;
    });
  };

  const test = useMemo(() => {
    const a = ab.A;
    const b = ab.B;
    const pa = a.imp ? a.conv / a.imp : 0;
    const pb = b.imp ? b.conv / b.imp : 0;

    // 2標本の比率のZ検定（プールした比率で標準誤差を出す）
    let z = 0;
    let p = 1;
    if (a.imp > 0 && b.imp > 0) {
      const pool = (a.conv + b.conv) / (a.imp + b.imp);
      const se = Math.sqrt(pool * (1 - pool) * (1 / a.imp + 1 / b.imp));
      z = se > 0 ? (pb - pa) / se : 0;
      p = pValue(z);
    }

    const uplift = pa > 0 ? (pb - pa) / pa : 0;
    const decided = a.imp >= 100 && b.imp >= 100 && p < 0.05;

    return { pa, pb, z, p, uplift, decided, total: a.imp + b.imp };
  }, [ab]);

  const maxRate = Math.max(0.001, test.pa, test.pb);

  return (
    <div className="space-y-5">
      {/* ---------------- ヒートマップ ---------------- */}
      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <DemoStage
            label="エビスソフト.Heatmap"
            status={`${points.length} clicks recorded`}
          >
            <div
              ref={stageRef}
              onPointerDown={record}
              className="relative cursor-crosshair touch-none select-none"
            >
              {/* 解析対象に見立てたページ（この上をクリックすると記録されます） */}
              <div className="relative z-10 space-y-4 p-6 sm:p-8">
                <p className="font-display text-[10px] tracking-[0.3em] text-slate-500 uppercase">
                  Sample landing page
                </p>
                <h4 className="text-xl leading-snug font-bold text-white sm:text-2xl">
                  この面をクリックしてください。
                  <br />
                  クリックした場所が、そのまま記録されます。
                </h4>
                <p className="max-w-sm text-xs leading-relaxed text-slate-400">
                  実際の運用では、これが「訪問者数千人ぶんのクリック」になります。押されていないボタン、読まれずに飛ばされている段落が、位置として見えるようになります。
                </p>
                <span className="btn btn-primary pointer-events-none inline-flex h-10 items-center px-5 text-xs">
                  無料で相談する
                </span>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {["特徴01", "特徴02", "特徴03"].map((t) => (
                    <div key={t} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <span className="block h-1.5 w-8 rounded-full bg-brand/50" />
                      <span className="mt-2 block text-[10px] text-slate-500">{t}</span>
                    </div>
                  ))}
                </div>
                <p className="pt-2 text-[10px] text-slate-600">© Sample Inc. お問い合わせ／会社概要</p>
              </div>

              {/* ヒートマップのレイヤー */}
              <canvas
                ref={canvasRef}
                aria-hidden
                className={`pointer-events-none absolute inset-0 z-20 h-full w-full transition-opacity duration-300 ${
                  showHeat ? "opacity-80" : "opacity-0"
                }`}
                style={{ mixBlendMode: "screen" }}
              />
            </div>
          </DemoStage>
        </div>

        {/* クリックの内訳 */}
        <div className="panel space-y-4 p-5 min-w-0 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              Click map / クリックの内訳
            </p>
            <SwitchButton checked={showHeat} onChange={setShowHeat}>
              ヒートマップ
            </SwitchButton>
          </div>

          {points.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 p-5 text-center text-[11px] leading-relaxed text-slate-500">
              まだクリックがありません。
              <br />
              左（スマホでは上）の画面を数回タップしてください。
            </p>
          ) : (
            <ul className="space-y-2.5">
              {zoneStats.map((z) => (
                <li key={z.key}>
                  <span className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{z.label}</span>
                    <span className="font-display text-slate-300 tabular-nums">
                      {z.n}回 / {(z.ratio * 100).toFixed(0)}%
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-brand via-lime-300 to-rose-400 transition-all duration-300"
                      style={{ width: `${z.ratio * 100}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
              薄い
              <span
                aria-hidden
                className="h-2 w-20 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(30,64,175,0.4), rgba(34,211,238,0.85), rgba(163,230,53,0.9), rgba(250,204,21,0.95), rgba(244,63,94,1))",
                }}
              />
              濃い
            </span>
            <button
              type="button"
              onClick={() => setPoints([])}
              className="text-[10px] text-slate-500 underline transition-colors hover:text-slate-200"
            >
              記録を消す
            </button>
          </div>

          <p className="text-[10px] leading-relaxed text-slate-500">
            座標はこのブラウザの中だけに保持しています（外部へ送信していません）。実案件では計測基盤に送り、訪問者全体の傾向として見ます。
          </p>
        </div>
      </div>

      {/* ---------------- A/Bテスト ---------------- */}
      <div className="panel p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              A / B Test / 2案を同時に出して判定する
            </p>
            <p className="mt-1.5 text-xs text-slate-400">
              訪問者を50:50で振り分け、クリック率に差があるかを統計的に判定します。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runVisitors(100)}
              className="btn btn-primary inline-flex h-10 items-center px-4 text-xs"
            >
              訪問者を100人流す
            </button>
            <button
              type="button"
              onClick={() => runVisitors(1000)}
              className="btn btn-secondary inline-flex h-10 items-center px-4 text-xs"
            >
              1,000人
            </button>
            <button
              type="button"
              onClick={() => setAb({ A: { imp: 0, conv: 0 }, B: { imp: 0, conv: 0 } })}
              className="inline-flex h-10 items-center rounded-lg border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-300 transition-colors hover:border-white/35"
            >
              リセット
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {VARIANTS.map((v) => {
            const d = ab[v.key];
            const rate = d.imp ? d.conv / d.imp : 0;
            const isWinner = test.decided && (v.key === "B" ? test.pb > test.pa : test.pa > test.pb);
            return (
              <div
                key={v.key}
                className={`rounded-xl border p-4 transition-colors ${
                  isWinner ? "border-emerald-400/50 bg-emerald-400/[0.07]" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-[11px] font-bold tracking-widest text-slate-400">
                    {v.label}
                  </p>
                  {isWinner ? (
                    <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      勝ち
                    </span>
                  ) : null}
                </div>

                {/* 案のプレビュー */}
                <p className="mt-3 text-xs leading-snug font-bold text-white">{v.headline}</p>
                <span
                  className={`mt-3 inline-flex h-8 items-center rounded-lg bg-gradient-to-r px-3 text-[11px] font-bold text-ink ${v.tone}`}
                >
                  {v.cta}
                </span>

                <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-[11px]">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">表示</dt>
                    <dd className="font-display text-slate-300 tabular-nums">
                      {d.imp.toLocaleString("ja-JP")}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">クリック</dt>
                    <dd className="font-display text-slate-300 tabular-nums">
                      {d.conv.toLocaleString("ja-JP")}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">クリック率</dt>
                    <dd className="font-display font-bold text-brand-light tabular-nums">
                      {(rate * 100).toFixed(2)}%
                    </dd>
                  </div>
                </dl>
                <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <span
                    className={`block h-full rounded-full bg-gradient-to-r transition-all duration-300 ${v.tone}`}
                    style={{ width: `${(rate / maxRate) * 100}%` }}
                  />
                </span>
              </div>
            );
          })}

          {/* 判定 */}
          <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4">
            <p className="font-display text-[10px] font-bold tracking-[0.25em] text-gold uppercase">
              Verdict / 判定
            </p>

            {test.total === 0 ? (
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                「訪問者を流す」を押すと集計が始まります。どちらの案が優れているかは、この時点では分かりません。
              </p>
            ) : (
              <>
                <p
                  className={`mt-3 text-sm font-bold ${
                    test.decided ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {test.decided
                    ? `B案の勝ち（${(test.uplift * 100).toFixed(0)}%改善）`
                    : "まだ判定できません"}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  {test.decided
                    ? "偶然では説明しにくい差が出ています。B案に切り替える判断ができます。"
                    : "差はあるように見えても、この人数では偶然の範囲です。ここで結論を出すのが、最もよくある間違いです。"}
                </p>

                <dl className="mt-4 space-y-1.5 border-t border-gold/20 pt-3 text-[11px]">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">累計の訪問者</dt>
                    <dd className="font-display text-slate-300 tabular-nums">
                      {test.total.toLocaleString("ja-JP")}人
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">改善率（B対A）</dt>
                    <dd className="font-display text-slate-300 tabular-nums">
                      {test.pa > 0 ? `${test.uplift > 0 ? "+" : ""}${(test.uplift * 100).toFixed(1)}%` : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Z値</dt>
                    <dd className="font-display text-slate-300 tabular-nums">{test.z.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">p値</dt>
                    <dd className="font-display text-slate-300 tabular-nums">
                      {test.p < 0.001 ? "< 0.001" : test.p.toFixed(3)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                  p値が0.05を下回り、かつ各案100人以上で「有意差あり」としています。
                </p>
              </>
            )}
          </div>
        </div>

        <Link
          prefetch={false}
          href="/contact"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-light transition-colors hover:text-white"
        >
          自社サイトの離脱点を見てほしい
          <Icon name="arrowRight" className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
