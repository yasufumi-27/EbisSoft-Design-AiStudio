"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChipButton, ControlGroup, DemoStage, RangeControl } from "./DemoUi";
import { Icon } from "@/components/ui/icons";
import { DemoSimulatorIndustry } from "./DemoSimulatorIndustry";
import type { SimulatorConfig } from "@/lib/showcase";

/* ------------------------------------------------------------------
 * 料金シミュレーター（自動診断）。
 *
 * 価格ロジックはこのファイルの上部に「ルール」として集約しています。
 * 実案件では、この定義をお客様の価格表に差し替えるだけで同じ画面が動きます。
 * （計算そのものはブラウザ内で完結。サーバー不要 → 静的サイトでも成立する）
 * ---------------------------------------------------------------- */

type SiteKind = {
  key: string;
  label: string;
  /** 基本費用（設計・デザイン・実装の土台） */
  base: number;
  /** 標準的なページ数（スライダーの初期値） */
  pages: number;
  /** 制作の基本工数（週） */
  weeks: number;
  note: string;
};

const KINDS: SiteKind[] = [
  { key: "lp", label: "ランディングページ", base: 240_000, pages: 1, weeks: 1, note: "広告の受け皿・単一商材の訴求" },
  { key: "corporate", label: "コーポレートサイト", base: 420_000, pages: 8, weeks: 2, note: "会社案内・採用・信頼性" },
  { key: "recruit", label: "採用サイト", base: 380_000, pages: 6, weeks: 2, note: "応募獲得・社内の様子の発信" },
  { key: "ec", label: "EC・通販", base: 680_000, pages: 12, weeks: 3, note: "商品販売・決済・在庫" },
  { key: "webapp", label: "Webアプリ・会員サイト", base: 980_000, pages: 10, weeks: 4, note: "ログイン・管理画面・業務利用" },
];

/** 1ページあたりの追加費用（種類ごとに作り込みの重さが違う） */
const PER_PAGE: Record<string, number> = {
  lp: 38_000,
  corporate: 26_000,
  recruit: 26_000,
  ec: 22_000,
  webapp: 34_000,
};

type Design = { key: string; label: string; /** 基本費用への倍率 */ rate: number; weeks: number; note: string };

const DESIGNS: Design[] = [
  { key: "template", label: "テンプレート活用", rate: 0.8, weeks: 0, note: "既存デザインを自社らしく調整" },
  { key: "semi", label: "セミオーダー", rate: 1, weeks: 0.5, note: "構成は定石、見た目はオリジナル" },
  { key: "full", label: "フルオーダー", rate: 1.45, weeks: 1.5, note: "コンセプトから設計・演出まで作り込み" },
];

type Feature = { key: string; label: string; price: number; weeks: number; hint: string };

const FEATURES: Feature[] = [
  { key: "cms", label: "CMS（自社更新）", price: 120_000, weeks: 0.5, hint: "お知らせ・実績を自分で更新" },
  { key: "form", label: "問い合わせフォーム", price: 60_000, weeks: 0.3, hint: "迷惑メール対策・自動返信つき" },
  { key: "booking", label: "予約システム", price: 240_000, weeks: 1, hint: "空き枠管理・重複防止" },
  { key: "payment", label: "オンライン決済", price: 180_000, weeks: 0.8, hint: "Stripe等・カード／コンビニ" },
  { key: "chatbot", label: "AIチャットボット", price: 280_000, weeks: 1, hint: "自社情報を知識源にRAG構成" },
  { key: "3d", label: "3DCG・AR", price: 320_000, weeks: 1.2, hint: "製品ビューア・実物大表示" },
  { key: "configurator", label: "商品カスタマイズ", price: 260_000, weeks: 1, hint: "仕様選択で価格が変わる注文画面" },
  { key: "multilingual", label: "多言語対応（1言語）", price: 150_000, weeks: 0.7, hint: "hreflang設計・AI翻訳＋レビュー" },
  { key: "integration", label: "既存システム連携", price: 300_000, weeks: 1.2, hint: "在庫・CRM・基幹とのAPI接続" },
  { key: "pwa", label: "アプリ化（PWA）・通知", price: 140_000, weeks: 0.6, hint: "ホーム画面追加・プッシュ通知" },
];

/** SEO/AEO/LLMOの作り込みレベル */
const SEO_LEVELS = [
  { key: "basic", label: "基本設定のみ", price: 0, weeks: 0, note: "タイトル・説明・サイトマップ" },
  { key: "standard", label: "SEO実装", price: 120_000, weeks: 0.5, note: "キーワード設計・構造化データ" },
  { key: "full", label: "SEO＋AEO / LLMO", price: 240_000, weeks: 1, note: "AI検索に引用される設計まで" },
];

const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;

/** 週数を「◯週間」「◯か月」に整える（半端な小数を出さない） */
function formatWeeks(w: number): string {
  const weeks = Math.max(1, Math.round(w * 2) / 2);
  if (weeks <= 8) return `約${weeks}週間`;
  const months = Math.round((weeks / 4.3) * 2) / 2;
  return `約${months}か月`;
}

/**
 * 料金シミュレーターのデモ。
 *
 * @param config 職種別デモサイトから渡す試算の中身（リフォーム費用・車検費用など）。
 *   渡されたときは、当社のWeb制作費用の試算ではなく**その職種の試算**を表示します。
 *   仕組み（ブラウザ内で完結する計算・内訳の可視化・問い合わせへの引き継ぎ）は同じです。
 */
export default function DemoSimulator({ config }: { config?: SimulatorConfig }) {
  if (config) return <DemoSimulatorIndustry config={config} />;
  return <WebEstimate />;
}

/** 当社のWeb制作費用の見積もり診断（/demo/simulator で表示している本来の内容） */
function WebEstimate() {
  const [kind, setKind] = useState(KINDS[1]);
  const [pages, setPages] = useState(KINDS[1].pages);
  const [design, setDesign] = useState(DESIGNS[1]);
  const [features, setFeatures] = useState<string[]>(["cms", "form"]);
  const [seo, setSeo] = useState(SEO_LEVELS[2]);
  const [copied, setCopied] = useState(false);

  const toggle = (key: string) =>
    setFeatures((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const pickKind = (k: SiteKind) => {
    setKind(k);
    setPages(k.pages);
  };

  /* ---- 見積もりの計算（ここが本体） ---- */
  const quote = useMemo(() => {
    const chosen = FEATURES.filter((f) => features.includes(f.key));

    const baseCost = kind.base * design.rate;
    const pageCost = Math.max(0, pages - 1) * PER_PAGE[kind.key];
    const featureCost = chosen.reduce((s, f) => s + f.price, 0);
    const seoCost = seo.price;

    const subtotal = baseCost + pageCost + featureCost + seoCost;

    // 期間：基本工数＋ページ数＋機能＋デザイン。AI活用による短縮率（約1/3）を反映。
    const rawWeeks =
      kind.weeks + design.weeks + seo.weeks + pages * 0.12 + chosen.reduce((s, f) => s + f.weeks, 0);
    // 従来の制作体制ならこの3倍前後かかる、という比較のための値
    const legacyWeeks = rawWeeks * 3;

    const breakdown = [
      { label: `${kind.label}の基本費用`, value: baseCost, tone: "brand" as const },
      { label: `ページ制作（${pages}ページ）`, value: pageCost, tone: "accent" as const },
      { label: "機能の追加", value: featureCost, tone: "gold" as const },
      { label: "SEO / AEO / LLMO", value: seoCost, tone: "emerald" as const },
    ].filter((b) => b.value > 0);

    // おすすめプラン（content.ts の plans と価格帯を揃えている）
    const plan =
      subtotal >= 1_400_000
        ? { name: "プレミアム", href: "/request#pricing", reason: "AI機能・3D・システム連携を含む構成のため" }
        : subtotal >= 600_000
          ? { name: "スタンダード", href: "/request#pricing", reason: "ページ数と機能のバランスが標準的なため" }
          : { name: "ライト", href: "/request#pricing", reason: "構成がコンパクトで、短期公開に向くため" };

    // 月額の目安（保守・サーバー・ドメイン）
    const monthly =
      5_000 +
      (features.includes("cms") ? 5_000 : 0) +
      (features.includes("form") ? 3_000 : 0) +
      (features.includes("chatbot") ? 12_000 : 0) +
      (features.includes("booking") || features.includes("payment") ? 8_000 : 0) +
      (features.includes("integration") ? 10_000 : 0);

    return {
      chosen,
      subtotal,
      // 概算のため上下に幅を持たせる（誠実さ：1円単位で出せるふりをしない）
      low: Math.round((subtotal * 0.9) / 10_000) * 10_000,
      high: Math.round((subtotal * 1.15) / 10_000) * 10_000,
      breakdown,
      weeks: rawWeeks,
      legacyWeeks,
      plan,
      monthly,
    };
  }, [kind, pages, design, features, seo]);

  /** 診断結果を、そのまま問い合わせに貼れる文章にする */
  const summary = useMemo(
    () =>
      [
        "【料金シミュレーターの診断結果】",
        `サイトの種類：${kind.label}`,
        `ページ数：約${pages}ページ`,
        `デザイン：${design.label}`,
        `機能：${quote.chosen.length ? quote.chosen.map((f) => f.label).join(" / ") : "なし"}`,
        `SEO：${seo.label}`,
        `概算費用：${yen(quote.low)} 〜 ${yen(quote.high)}`,
        `概算期間：${formatWeeks(quote.weeks)}`,
        `月額の目安：${yen(quote.monthly)}`,
        `おすすめプラン：${quote.plan.name}`,
      ].join("\n"),
    [kind, pages, design, seo, quote],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const toneClass = {
    brand: "bg-brand/70",
    accent: "bg-accent/70",
    gold: "bg-gold/70",
    emerald: "bg-emerald-400/70",
  };

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
      {/* ---------------- 入力（診断） ---------------- */}
      <div className="panel space-y-6 p-5 min-w-0 lg:col-span-3">
        <ControlGroup label="Site Type / サイトの種類">
          {KINDS.map((k) => (
            <ChipButton key={k.key} active={kind.key === k.key} onClick={() => pickKind(k)} title={k.note}>
              {k.label}
            </ChipButton>
          ))}
        </ControlGroup>

        <p className="-mt-3 text-[11px] text-slate-500">{kind.note}</p>

        <RangeControl
          label="Pages / ページ数"
          value={pages}
          min={1}
          max={40}
          suffix="ページ"
          onChange={setPages}
        />

        <ControlGroup label="Design / デザインの作り方">
          {DESIGNS.map((d) => (
            <ChipButton key={d.key} active={design.key === d.key} onClick={() => setDesign(d)} title={d.note}>
              {d.label}
            </ChipButton>
          ))}
        </ControlGroup>
        <p className="-mt-3 text-[11px] text-slate-500">{design.note}</p>

        <div>
          <p className="font-display mb-2 text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            Features / 必要な機能
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FEATURES.map((f) => {
              const on = features.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggle(f.key)}
                  aria-pressed={on}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                    on
                      ? "border-brand/55 bg-brand/10 shadow-[0_0_18px_-6px_rgba(34,211,238,0.5)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors ${
                      on ? "border-brand bg-brand text-ink" : "border-white/25"
                    }`}
                  >
                    {on ? <Icon name="check" className="size-3" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-xs font-bold ${on ? "text-white" : "text-slate-300"}`}>
                      {f.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">{f.hint}</span>
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] font-semibold text-slate-500 tabular-nums">
                    +{Math.round(f.price / 10_000)}万
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ControlGroup label="Search / 検索・AI対策">
          {SEO_LEVELS.map((s) => (
            <ChipButton key={s.key} active={seo.key === s.key} onClick={() => setSeo(s)} title={s.note}>
              {s.label}
            </ChipButton>
          ))}
        </ControlGroup>
        <p className="-mt-3 text-[11px] text-slate-500">{seo.note}</p>
      </div>

      {/* ---------------- 結果 ---------------- */}
      <div className="space-y-5 min-w-0 lg:col-span-2">
        <DemoStage label="エビスソフト.Estimate" status="LIVE CALC">
          <div className="p-5">
            <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              Estimated Cost / 概算費用
            </p>
            <p className="mt-2 text-2xl leading-tight font-bold text-white tabular-nums sm:text-[1.7rem]">
              {yen(quote.low)}
              <span className="mx-1.5 text-base font-normal text-slate-500">〜</span>
              {yen(quote.high)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              税別・条件による概算です（月額の目安 {yen(quote.monthly)}）
            </p>

            {/* 内訳の積み上げバー */}
            <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-white/5">
              {quote.breakdown.map((b) => (
                <span
                  key={b.label}
                  className={`h-full transition-all duration-500 ${toneClass[b.tone]}`}
                  style={{ width: `${(b.value / quote.subtotal) * 100}%` }}
                  title={`${b.label}：${yen(b.value)}`}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {quote.breakdown.map((b) => (
                <li key={b.label} className="flex items-center gap-2 text-[11px]">
                  <span aria-hidden className={`size-2 rounded-full ${toneClass[b.tone]}`} />
                  <span className="flex-1 truncate text-slate-400">{b.label}</span>
                  <span className="font-semibold text-slate-300 tabular-nums">{yen(b.value)}</span>
                </li>
              ))}
            </ul>

            {/* 期間：AI活用の効果を「従来比」で見せる */}
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
                Lead Time / 公開までの期間
              </p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-xl font-bold text-brand-light tabular-nums">
                  {formatWeeks(quote.weeks)}
                </span>
                <span className="text-[11px] text-slate-500">
                  従来の体制なら {formatWeeks(quote.legacyWeeks)}
                </span>
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-[10px] text-slate-500">従来</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <span className="block h-full w-full rounded-full bg-slate-600" />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-[10px] text-brand-light">AI活用</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-500"
                      style={{ width: `${(quote.weeks / quote.legacyWeeks) * 100}%` }}
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DemoStage>

        {/* おすすめプランと引き継ぎ */}
        <div className="panel p-5">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            Recommended / おすすめプラン
          </p>
          <p className="mt-2 flex items-center gap-2 text-lg font-bold text-gold-light">
            <Icon name="award" className="size-5 text-gold" />
            {quote.plan.name}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{quote.plan.reason}</p>

          <div className="mt-4 flex flex-col gap-2">
            <Link prefetch={false} href="/contact" className="btn btn-primary inline-flex h-11 items-center justify-center px-5 text-sm">
              この条件で相談する
              <Icon name="arrowRight" className="size-4" />
            </Link>
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-xs font-semibold text-slate-200 transition-colors hover:border-brand/50"
            >
              <Icon name={copied ? "check" : "layout"} className="size-3.5" />
              {copied ? "診断結果をコピーしました" : "診断結果をコピー"}
            </button>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-[11px] text-slate-500 hover:text-slate-300">
              問い合わせに引き継がれる内容を見る
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-white/10 bg-ink/60 p-3 text-[10px] leading-relaxed whitespace-pre-wrap text-slate-400">
              {summary}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
