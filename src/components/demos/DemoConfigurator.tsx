"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChipButton, ControlGroup, DemoStage } from "./DemoUi";
import { Icon } from "@/components/ui/icons";

/* ------------------------------------------------------------------
 * 商品コンフィギュレーター（受注生産のソファを題材にした例）。
 *
 * 見た目はSVGをその場で組み立てて描画しています（画像の切り替えではありません）。
 * 価格・納期・構成コードも、選択から都度計算しています。
 * 実案件では、この定義をお客様の商品マスタ・価格表に差し替えます。
 * ---------------------------------------------------------------- */

type Size = { key: string; label: string; seats: number; width: number; price: number; days: number; dim: string };

const SIZES: Size[] = [
  { key: "1", label: "1人掛け", seats: 1, width: 150, price: 0, days: 0, dim: "W900 × D850 × H780mm" },
  { key: "2", label: "2人掛け", seats: 2, width: 232, price: 62_000, days: 4, dim: "W1600 × D850 × H780mm" },
  { key: "3", label: "3人掛け", seats: 3, width: 312, price: 124_000, days: 8, dim: "W2100 × D850 × H780mm" },
];

type Material = {
  key: string;
  label: string;
  price: number;
  days: number;
  /** ハイライトの強さ（0〜1）＝素材の光沢表現 */
  sheen: number;
  note: string;
};

const MATERIALS: Material[] = [
  { key: "fabric", label: "ファブリック", price: 0, days: 0, sheen: 0.12, note: "通気性がよく、日常使いに強い" },
  { key: "velvet", label: "ベロア", price: 48_000, days: 3, sheen: 0.34, note: "光の当たり方で色味が変わる" },
  { key: "leather", label: "本革", price: 148_000, days: 10, sheen: 0.55, note: "使うほど艶が出る。経年変化を楽しむ" },
];

type Color = { key: string; label: string; hex: string; code: string };

const COLORS: Color[] = [
  { key: "navy", label: "ミッドナイトネイビー", hex: "#2d3a5c", code: "NVY" },
  { key: "gray", label: "フォググレー", hex: "#8b94a3", code: "GRY" },
  { key: "olive", label: "オリーブ", hex: "#5f6b4a", code: "OLV" },
  { key: "camel", label: "キャメル", hex: "#a9754a", code: "CML" },
  { key: "wine", label: "ワインレッド", hex: "#6d2b38", code: "WIN" },
  { key: "ivory", label: "アイボリー", hex: "#d8cfbe", code: "IVY" },
];

type Leg = { key: string; label: string; hex: string; price: number; code: string };

const LEGS: Leg[] = [
  { key: "oak", label: "オーク（木）", hex: "#b08054", price: 0, code: "OAK" },
  { key: "walnut", label: "ウォルナット", hex: "#5b3b26", price: 14_000, code: "WAL" },
  { key: "steel", label: "ブラックスチール", hex: "#2b2f38", price: 18_000, code: "STL" },
  { key: "brass", label: "ブラス（真鍮）", hex: "#c9a45c", price: 36_000, code: "BRS" },
];

type Option = { key: string; label: string; price: number; days: number; code: string; hint: string };

const OPTIONS: Option[] = [
  { key: "cushion", label: "専用クッション（2個）", price: 18_000, days: 0, code: "C", hint: "同じ生地で仕立てます" },
  { key: "water", label: "撥水・防汚加工", price: 24_000, days: 2, code: "W", hint: "小さなお子さま・ペットに" },
  { key: "warranty", label: "5年保証（張り替え1回込み）", price: 42_000, days: 0, code: "G", hint: "フレーム・スプリングも対象" },
  { key: "assembly", label: "設置・梱包材の回収", price: 12_000, days: 0, code: "A", hint: "階段搬入も追加費用なし" },
];

const BASE_PRICE = 168_000;
const BASE_DAYS = 18;

/* ---- 色の計算（素材の陰影をコードで作る） ---- */
function hexToRgb(hex: string) {
  const v = parseInt(hex.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}
/** hex を白／黒に向けて t だけ寄せる */
function shade(hex: string, t: number) {
  const { r, g, b } = hexToRgb(hex);
  const to = t > 0 ? 255 : 0;
  const a = Math.abs(t);
  const mix = (c: number) => Math.round(c + (to - c) * a);
  return `rgb(${mix(r)} ${mix(g)} ${mix(b)})`;
}

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export default function DemoConfigurator() {
  const [size, setSize] = useState(SIZES[1]);
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [leg, setLeg] = useState(LEGS[0]);
  const [options, setOptions] = useState<string[]>(["cushion"]);
  const [cart, setCart] = useState(0);
  // 「見積もりに追加した構成コード」。仕様を変えると自動的に一致しなくなるため、
  // 表示のリセットに useEffect が要らない。
  const [quotedCode, setQuotedCode] = useState<string | null>(null);
  /** 見ている人の数（動きを見せるためのサンプル値。demoNoteで明示） */
  const [viewers, setViewers] = useState(7);

  useEffect(() => {
    const id = window.setInterval(() => {
      setViewers((v) => Math.min(23, Math.max(3, v + (Math.random() < 0.5 ? -1 : 1))));
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  const toggle = (key: string) =>
    setOptions((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const spec = useMemo(() => {
    const picked = OPTIONS.filter((o) => options.includes(o.key));
    const price =
      BASE_PRICE + size.price + material.price + leg.price + picked.reduce((s, o) => s + o.price, 0);
    const days = BASE_DAYS + size.days + material.days + picked.reduce((s, o) => s + o.days, 0);

    const lines = [
      { label: `本体（${size.label}）`, value: BASE_PRICE + size.price },
      { label: `張地：${material.label}`, value: material.price },
      { label: `脚：${leg.label}`, value: leg.price },
      ...picked.map((o) => ({ label: o.label, value: o.price })),
    ].filter((l) => l.value > 0);

    // 構成コード：この文字列だけで仕様が一意に決まる（注文・製造への引き継ぎ用）
    const code = [
      `SF${size.key}`,
      color.code,
      material.key.slice(0, 3).toUpperCase(),
      leg.code,
      picked.length ? picked.map((o) => o.code).join("") : "N",
    ].join("-");

    // 在庫：素材・サイズごとの生地在庫を模した値（サンプル）
    const stock = ((size.seats * 7 + material.key.length * 3 + color.code.charCodeAt(0)) % 9) + 2;

    return { picked, price, days, lines, code, stock };
  }, [size, material, color, leg, options]);

  const eta = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + spec.days);
    return d.toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
  }, [spec.days]);

  /* ---- SVGの寸法 ---- */
  const w = size.width;
  const cx = 200;
  const left = cx - w / 2;
  // ハイライトは素材の光沢に比例させる（強すぎると色が白飛びするため7割に抑える）
  const light = shade(color.hex, material.sheen * 0.7);
  const dark = shade(color.hex, -0.28);
  const gid = `cfg-${material.key}-${color.key}`;

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
      {/* ---------------- プレビュー ---------------- */}
      <div className="space-y-5 min-w-0 lg:col-span-3">
        <DemoStage label="エビスソフト.Configurator" status={spec.code}>
          <div className="relative">
            <div aria-hidden className="bg-grid absolute inset-0 opacity-25" />
            <svg
              viewBox="0 0 400 280"
              className="relative block w-full"
              role="img"
              aria-label={`${size.label}のソファ。張地は${material.label}の${color.label}、脚は${leg.label}`}
            >
              <defs>
                <linearGradient id={`${gid}-body`} x1="0" y1="0" x2="0.35" y2="1">
                  <stop offset="0%" stopColor={light} />
                  <stop offset="55%" stopColor={color.hex} />
                  <stop offset="100%" stopColor={dark} />
                </linearGradient>
                <linearGradient id={`${gid}-seat`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={shade(color.hex, material.sheen * 0.7)} />
                  <stop offset="100%" stopColor={shade(color.hex, -0.16)} />
                </linearGradient>
                <radialGradient id={`${gid}-glow`} cx="50%" cy="50%">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.22)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                </radialGradient>
              </defs>

              {/* 床の光 */}
              <ellipse cx={cx} cy={236} rx={w * 0.72} ry="26" fill={`url(#${gid}-glow)`} />

              {/* 脚（先に描いて本体の後ろに） */}
              {[left + 14, left + w - 14].map((x) => (
                <g key={x}>
                  <rect x={x - 4} y={196} width="8" height="34" rx="3" fill={leg.hex} />
                  <rect x={x - 4} y={196} width="3" height="34" rx="1.5" fill="rgba(255,255,255,0.18)" />
                </g>
              ))}

              {/* 背もたれ */}
              <rect
                x={left}
                y={72}
                width={w}
                height={86}
                rx="16"
                fill={`url(#${gid}-body)`}
                className="transition-all duration-500"
              />
              {/* 背クッションの分割線（座面数に応じて） */}
              {Array.from({ length: size.seats - 1 }, (_, i) => (
                <line
                  key={i}
                  x1={left + (w / size.seats) * (i + 1)}
                  y1={80}
                  x2={left + (w / size.seats) * (i + 1)}
                  y2={150}
                  stroke={shade(color.hex, -0.42)}
                  strokeWidth="2"
                />
              ))}

              {/* 座面 */}
              <rect
                x={left - 6}
                y={150}
                width={w + 12}
                height={50}
                rx="14"
                fill={`url(#${gid}-seat)`}
                className="transition-all duration-500"
              />

              {/* アーム */}
              {[left - 20, left + w - 4].map((x) => (
                <rect
                  key={x}
                  x={x}
                  y={118}
                  width="24"
                  height="84"
                  rx="12"
                  fill={`url(#${gid}-body)`}
                  className="transition-all duration-500"
                />
              ))}

              {/* 素材の光沢（本革・ベロアほど強く出る） */}
              <rect
                x={left + 8}
                y={80}
                width={w - 16}
                height="18"
                rx="9"
                fill="rgba(255,255,255,1)"
                opacity={material.sheen * 0.6}
                className="transition-opacity duration-500"
              />

              {/* オプション：クッション */}
              {options.includes("cushion") ? (
                <g className="stagger-item">
                  <rect
                    x={left + 8}
                    y={128}
                    width="42"
                    height="42"
                    rx="8"
                    fill={shade(color.hex, 0.34)}
                    transform={`rotate(-8 ${left + 29} 149)`}
                  />
                  <rect
                    x={left + w - 50}
                    y={128}
                    width="42"
                    height="42"
                    rx="8"
                    fill={shade(color.hex, -0.42)}
                    transform={`rotate(9 ${left + w - 29} 149)`}
                  />
                </g>
              ) : null}

              {/* 寸法線（実寸が伝わるように） */}
              <g stroke="rgba(226,192,120,0.65)" strokeWidth="1" fill="none">
                <line x1={left - 20} y1={252} x2={left + w + 20} y2={252} />
                <line x1={left - 20} y1={247} x2={left - 20} y2={257} />
                <line x1={left + w + 20} y1={247} x2={left + w + 20} y2={257} />
              </g>
              <text x={cx} y={268} textAnchor="middle" fill="rgba(243,221,176,0.9)" fontSize="10">
                {size.dim}
              </text>
            </svg>
          </div>
        </DemoStage>

        {/* 操作パネル */}
        <div className="panel space-y-5 p-5">
          <ControlGroup label="Size / サイズ">
            {SIZES.map((s) => (
              <ChipButton key={s.key} active={size.key === s.key} onClick={() => setSize(s)} title={s.dim}>
                {s.label}
              </ChipButton>
            ))}
          </ControlGroup>

          <ControlGroup label="Material / 張地">
            {MATERIALS.map((m) => (
              <ChipButton
                key={m.key}
                active={material.key === m.key}
                onClick={() => setMaterial(m)}
                title={m.note}
              >
                {m.label}
                {m.price > 0 ? <span className="ml-1.5 text-[10px] opacity-70">+{m.price / 10_000}万</span> : null}
              </ChipButton>
            ))}
          </ControlGroup>
          <p className="-mt-3 text-[11px] text-slate-500">{material.note}</p>

          <div>
            <p className="font-display mb-2 text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              Color / カラー（{color.label}）
            </p>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-pressed={color.key === c.key}
                  aria-label={c.label}
                  title={c.label}
                  className={`size-9 rounded-full border-2 transition-all ${
                    color.key === c.key
                      ? "scale-110 border-brand shadow-[0_0_16px_rgba(34,211,238,0.55)]"
                      : "border-white/20 hover:border-white/50"
                  }`}
                  style={{ background: `linear-gradient(145deg, ${shade(c.hex, 0.22)}, ${c.hex} 60%, ${shade(c.hex, -0.3)})` }}
                />
              ))}
            </div>
          </div>

          <ControlGroup label="Legs / 脚">
            {LEGS.map((l) => (
              <ChipButton key={l.key} active={leg.key === l.key} onClick={() => setLeg(l)}>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="size-2.5 rounded-full" style={{ background: l.hex }} />
                  {l.label}
                </span>
              </ChipButton>
            ))}
          </ControlGroup>

          <div>
            <p className="font-display mb-2 text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              Options / オプション
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {OPTIONS.map((o) => {
                const on = options.includes(o.key);
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => toggle(o.key)}
                    aria-pressed={on}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      on
                        ? "border-gold/55 bg-gold/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid size-4 shrink-0 place-items-center rounded border ${
                        on ? "border-gold bg-gold text-ink" : "border-white/25"
                      }`}
                    >
                      {on ? <Icon name="check" className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-xs font-bold ${on ? "text-white" : "text-slate-300"}`}>
                        {o.label}
                      </span>
                      <span className="block text-[10px] text-slate-500">{o.hint}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-500 tabular-nums">
                      +{yen(o.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 価格・注文 ---------------- */}
      <div className="space-y-5 min-w-0 lg:col-span-2">
        <div className="panel p-5">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            Your Configuration / この構成
          </p>
          <p className="mt-2 text-3xl font-bold text-white tabular-nums">{yen(spec.price)}</p>
          <p className="mt-1 text-[11px] text-slate-500">税別・送料込み</p>

          <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4">
            {spec.lines.map((l) => (
              <li key={l.label} className="flex items-center gap-2 text-[11px]">
                <span className="flex-1 truncate text-slate-400">{l.label}</span>
                <span className="font-semibold text-slate-300 tabular-nums">{yen(l.value)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 text-center">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <dt className="text-[10px] text-slate-500">お届け目安</dt>
              <dd className="font-display mt-1 text-sm font-bold text-brand-light">{eta}</dd>
              <dd className="text-[10px] text-slate-500">約{spec.days}日後</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <dt className="text-[10px] text-slate-500">この生地の在庫</dt>
              <dd
                className={`font-display mt-1 text-sm font-bold ${
                  spec.stock <= 3 ? "text-rose-300" : "text-emerald-300"
                }`}
              >
                残り{spec.stock}点
              </dd>
              <dd className="text-[10px] text-slate-500">{viewers}人が閲覧中</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-lg border border-gold/25 bg-gold/[0.06] p-3">
            <p className="text-[10px] tracking-wider text-slate-500 uppercase">構成コード</p>
            <p className="font-display mt-1 text-sm font-bold tracking-[0.15em] text-gold-light">
              {spec.code}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              このコードだけで仕様が一意に決まります。注文・製造指示にそのまま渡せます。
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setCart((c) => c + 1);
                setQuotedCode(spec.code);
              }}
              className="btn btn-primary inline-flex h-11 items-center justify-center px-5 text-sm"
            >
              <Icon name="cart" className="size-4" />
              この構成で見積もる
            </button>
            <Link
              prefetch={false}
              href="/contact"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-xs font-semibold text-slate-200 transition-colors hover:border-brand/50"
            >
              同じ仕組みを自社サイトに
              <Icon name="arrowRight" className="size-3.5" />
            </Link>
          </div>

          {quotedCode === spec.code ? (
            <p className="stagger-item mt-3 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-[11px] text-emerald-200">
              <Icon name="check" className="size-4 shrink-0" />
              見積もりカートに追加しました（{cart}件）。{spec.code} / {yen(spec.price)}
            </p>
          ) : null}
        </div>

        <div className="panel p-5">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            Why it sells / なぜ売れるのか
          </p>
          <ul className="mt-3 space-y-2.5">
            {[
              "自分で選んだ構成には愛着が生まれ、比較サイトに戻りにくくなる",
              "オプションを「価格表」ではなく「仕上がりの変化」として見せられる",
              "選んだ仕様がそのまま注文になるので、確認の往復が消える",
            ].map((t) => (
              <li key={t} className="flex gap-2 text-[11px] leading-relaxed text-slate-400">
                <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-brand" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
