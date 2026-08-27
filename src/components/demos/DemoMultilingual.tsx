"use client";

import { useMemo, useState } from "react";
import { DemoStage } from "./DemoUi";
import { Icon } from "@/components/ui/icons";

/* ------------------------------------------------------------------
 * 言語定義。
 * 翻訳文はサンプルですが、通貨・日付・数値の書式は Intl API による実装で、
 * 実際にその言語圏の表記に変換しています。
 * ---------------------------------------------------------------- */

type LangKey = "ja" | "en" | "zh-Hans" | "ko";

type LangDef = {
  key: LangKey;
  /** hreflang に使う言語コード */
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  /** Intl のロケール */
  locale: string;
  currency: string;
  /** 日本円からの概算レート（表示用のサンプル） */
  rate: number;
  dir: "ltr" | "rtl";
  content: {
    badge: string;
    title: string;
    lead: string;
    features: string[];
    priceLabel: string;
    dateLabel: string;
    guestsLabel: string;
    cta: string;
    note: string;
  };
};

const LANGS: LangDef[] = [
  {
    key: "ja",
    code: "ja",
    label: "日本語",
    nativeLabel: "日本語",
    flag: "🇯🇵",
    locale: "ja-JP",
    currency: "JPY",
    rate: 1,
    dir: "ltr",
    content: {
      badge: "京都・伏見",
      title: "京町家の宿で、静かな京都を。",
      lead: "築120年の町家を改装した一棟貸しの宿です。伏見の酒蔵まで徒歩5分、京都駅から電車で15分。",
      features: ["一棟貸し切り（最大6名）", "檜風呂・庭付き", "24時間チェックイン対応"],
      priceLabel: "1泊あたり",
      dateLabel: "空室のある直近の日",
      guestsLabel: "宿泊人数",
      cta: "空室を確認する",
      note: "表示価格は消費税・サービス料込みです。",
    },
  },
  {
    key: "en",
    code: "en",
    label: "英語",
    nativeLabel: "English",
    flag: "🇺🇸",
    locale: "en-US",
    currency: "USD",
    rate: 1 / 150,
    dir: "ltr",
    content: {
      badge: "Fushimi, Kyoto",
      title: "A quiet Kyoto, in a restored machiya.",
      lead: "A private 120-year-old townhouse for your group. Five minutes on foot to the Fushimi sake district, fifteen minutes by train from Kyoto Station.",
      features: [
        "Entire house to yourself (up to 6 guests)",
        "Cypress bath and private garden",
        "24-hour self check-in",
      ],
      priceLabel: "Per night",
      dateLabel: "Next available date",
      guestsLabel: "Guests",
      cta: "Check availability",
      note: "Prices include tax and service charge.",
    },
  },
  {
    key: "zh-Hans",
    code: "zh-Hans",
    label: "中国語（簡体）",
    nativeLabel: "简体中文",
    flag: "🇨🇳",
    locale: "zh-CN",
    currency: "CNY",
    rate: 1 / 21,
    dir: "ltr",
    content: {
      badge: "京都・伏见",
      title: "在百年町屋里，享受安静的京都。",
      lead: "整栋出租的百年町屋。步行5分钟即达伏见酒藏区，从京都站乘车15分钟。",
      features: ["整栋包租（最多6人）", "丝柏浴池・附庭院", "支持24小时自助入住"],
      priceLabel: "每晚",
      dateLabel: "最近可预订日期",
      guestsLabel: "入住人数",
      cta: "查询空房",
      note: "价格已包含税费及服务费。",
    },
  },
  {
    key: "ko",
    code: "ko",
    label: "韓国語",
    nativeLabel: "한국어",
    flag: "🇰🇷",
    locale: "ko-KR",
    currency: "KRW",
    rate: 9.3,
    dir: "ltr",
    content: {
      badge: "교토 후시미",
      title: "교마치야 숙소에서, 조용한 교토를.",
      lead: "지은 지 120년 된 마치야를 개조한 독채 숙소입니다. 후시미 양조장까지 도보 5분, 교토역에서 전철로 15분.",
      features: ["독채 전체 사용 (최대 6명)", "편백나무 욕조·정원", "24시간 셀프 체크인"],
      priceLabel: "1박 기준",
      dateLabel: "가장 빠른 예약 가능일",
      guestsLabel: "숙박 인원",
      cta: "빈방 확인하기",
      note: "표시 가격은 세금 및 서비스 요금 포함입니다.",
    },
  },
];

/** 基準価格（日本円）と、サンプルの空室日 */
const BASE_PRICE_JPY = 48000;
const SAMPLE_DATE = new Date(Date.UTC(2026, 10, 14)); // 2026-11-14
const GUESTS = 4;
const REVIEWS = 1284;

export default function DemoMultilingual() {
  const [lang, setLang] = useState<LangKey>("ja");
  const def = LANGS.find((l) => l.key === lang) ?? LANGS[0];

  /* --- Intl API による実際のロケール変換 --- */
  const formatted = useMemo(() => {
    const amount = BASE_PRICE_JPY * def.rate;
    const price = new Intl.NumberFormat(def.locale, {
      style: "currency",
      currency: def.currency,
      maximumFractionDigits: def.currency === "JPY" || def.currency === "KRW" ? 0 : 2,
    }).format(amount);

    const date = new Intl.DateTimeFormat(def.locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: "UTC",
    }).format(SAMPLE_DATE);

    const guests = new Intl.NumberFormat(def.locale).format(GUESTS);
    const reviews = new Intl.NumberFormat(def.locale).format(REVIEWS);

    // 相対時間（「3日後」「in 3 days」など）も言語ごとに変わる
    const rtf = new Intl.RelativeTimeFormat(def.locale, { numeric: "auto" });
    const relative = rtf.format(3, "day");

    return { price, date, guests, reviews, relative };
  }, [def]);

  /* --- hreflang タグの生成（選択中の構成から実際に組み立てる） --- */
  const hreflang = useMemo(() => {
    const base = "https://www.example-machiya.jp";
    const lines = LANGS.map(
      (l) =>
        `<link rel="alternate" hreflang="${l.code}" href="${base}${l.key === "ja" ? "" : `/${l.code}`}/" />`,
    );
    lines.push(`<link rel="alternate" hreflang="x-default" href="${base}/" />`);
    return lines.join("\n");
  }, []);

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
      {/* ---------- サイトプレビュー ---------- */}
      <DemoStage
        className="min-w-0 lg:col-span-3"
        label="エビスソフト.i18n_Preview"
        status={`${def.locale} / ${def.currency}`}
      >
        {/* 言語切り替え */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3">
          {LANGS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setLang(l.key)}
              aria-pressed={lang === l.key}
              lang={l.code}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                lang === l.key
                  ? "border-brand/60 bg-brand/15 text-brand-light shadow-[0_0_16px_rgba(34,211,238,0.28)]"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200"
              }`}
            >
              <span aria-hidden className="mr-1.5">
                {l.flag}
              </span>
              {l.nativeLabel}
            </button>
          ))}
        </div>

        {/* 実際のページを模したプレビュー。lang / dir も切り替える */}
        <div lang={def.code} dir={def.dir} className="p-6 sm:p-8">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-light">
            <Icon name="pin" className="size-3.5" />
            {def.content.badge}
          </p>

          <h3 className="mt-4 text-2xl leading-snug font-bold text-white sm:text-3xl">
            {def.content.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{def.content.lead}</p>

          <ul className="mt-5 space-y-2">
            {def.content.features.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm text-slate-300">
                <Icon name="check" className="mt-0.5 size-4 shrink-0 text-brand" />
                {f}
              </li>
            ))}
          </ul>

          {/* ロケール依存の表示（ここが Intl API による実装部分） */}
          <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:grid-cols-3">
            <div className="bg-ink-2/80 px-4 py-4">
              <dt className="text-[11px] text-slate-500">{def.content.priceLabel}</dt>
              <dd className="font-display mt-1 text-lg font-bold text-gold-light">
                {formatted.price}
              </dd>
            </div>
            <div className="bg-ink-2/80 px-4 py-4">
              <dt className="text-[11px] text-slate-500">{def.content.dateLabel}</dt>
              <dd className="mt-1 text-sm font-bold text-white">{formatted.date}</dd>
              <dd className="text-[11px] text-slate-500">{formatted.relative}</dd>
            </div>
            <div className="bg-ink-2/80 px-4 py-4">
              <dt className="text-[11px] text-slate-500">{def.content.guestsLabel}</dt>
              <dd className="mt-1 text-sm font-bold text-white">
                {formatted.guests}
                <span className="ml-2 text-[11px] font-normal text-slate-500">
                  ★ {formatted.reviews}
                </span>
              </dd>
            </div>
          </dl>

          <button
            type="button"
            className="btn btn-primary mt-6 inline-flex h-11 items-center px-6 text-sm"
          >
            {def.content.cta}
            <Icon name="arrowRight" className="size-4" />
          </button>
          <p className="mt-3 text-[11px] text-slate-500">{def.content.note}</p>
        </div>
      </DemoStage>

      {/* ---------- 技術的な裏側 ---------- */}
      <div className="panel space-y-5 p-5 min-w-0 lg:col-span-2">
        <div>
          <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            Locale / 変換されている項目
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            通貨・日付・数値は、翻訳ではなくブラウザ標準の Intl API で自動変換しています。国ごとの表記ルールに常に追随します。
          </p>
          <dl className="mt-4 space-y-2 text-xs">
            {[
              ["lang属性", def.code],
              ["ロケール", def.locale],
              ["通貨", `${def.currency} / ${formatted.price}`],
              ["日付", formatted.date],
              ["相対時間", formatted.relative],
              ["桁区切り", formatted.reviews],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-slate-500">{k}</dt>
                <dd className="text-right text-slate-300">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <p className="font-display mb-2 text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            hreflang / 検索エンジンへの指示
          </p>
          <p className="mb-2 text-xs leading-relaxed text-slate-500">
            この記述がないと、各言語ページが重複コンテンツと判定され、検索結果に出にくくなります。
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-ink/70 p-3 text-[10px] leading-relaxed text-slate-400">
            <code>{hreflang}</code>
          </pre>
        </div>

        <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4">
          <p className="text-xs font-bold text-gold-light">翻訳の進め方</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            日本語を原文とし、AIで各言語へ翻訳したうえで、ネイティブがレビューして公開します。更新のたびに全言語へ即日反映でき、外注の往復による遅れがなくなります。
          </p>
        </div>
      </div>
    </div>
  );
}
