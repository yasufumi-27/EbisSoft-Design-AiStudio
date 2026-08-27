"use client";

import { useEffect, useState } from "react";
import { DemoStage } from "./DemoUi";
import { Icon } from "@/components/ui/icons";

/* ------------------------------------------------------------------
 * 訪問者セグメント。
 * 実案件では、リファラ・広告パラメータ・行動履歴から自動判定します。
 * このデモでは、URLの ?seg= を読み取るか、手動で切り替えられます。
 * ---------------------------------------------------------------- */

type SegKey = "default" | "maker" | "clinic" | "ec" | "recruit";

type Segment = {
  key: SegKey;
  label: string;
  /** 判定のきっかけ（実案件で使うシグナル） */
  signal: string;
  headline: string;
  sub: string;
  pain: string;
  proof: { label: string; value: string };
  caseTitle: string;
  caseBody: string;
  cta: string;
  accent: string;
};

const SEGMENTS: Segment[] = [
  {
    key: "default",
    label: "初回・流入元なし",
    signal: "リファラなし／直接アクセス",
    headline: "AIを駆使して、最速で、高性能なサイトを。",
    sub: "京都市伏見区のAI活用型Web制作会社です。",
    pain: "何から始めればいいか分からない",
    proof: { label: "公開までの最短", value: "5日" },
    caseTitle: "まずは実物を見てください",
    caseBody: "3DCG・AR・AIチャットボットなど、できることはすべて動くデモで公開しています。",
    cta: "無料で相談する",
    accent: "from-brand to-accent",
  },
  {
    key: "maker",
    label: "製造業・メーカー",
    signal: "広告キーワード「製品 3D 見せる」／製造業メディアからの流入",
    headline: "製品を、現物なしで伝えきる。",
    sub: "3DCG・ARで、展示会に行かなくても質感とサイズが伝わります。",
    pain: "カタログでは製品の良さが伝わらない",
    proof: { label: "撮影コスト", value: "1回で全色" },
    caseTitle: "産業機器メーカーの例",
    caseBody:
      "大型機器を3Dビューアで公開。遠方の見込み客が事前に寸法を確認できるようになり、商談が「導入するか」から始まるようになりました。",
    cta: "3Dで製品を見せる相談をする",
    accent: "from-cyan-400 to-blue-500",
  },
  {
    key: "clinic",
    label: "クリニック・士業",
    signal: "検索「予約 電話 減らしたい」／地域名との掛け合わせ",
    headline: "電話対応の時間を、患者さんに使う時間へ。",
    sub: "AIチャットボットと音声AIが、よくある質問の一次対応を引き受けます。",
    pain: "電話が鳴り止まず、受付が手を止められない",
    proof: { label: "対応時間", value: "24時間" },
    caseTitle: "クリニックの例",
    caseBody:
      "診療時間・予約方法・持ち物といった定型質問をAIが回答。受付の電話対応が減り、待合の患者さんへの対応に集中できるようになりました。",
    cta: "電話を減らす相談をする",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    key: "ec",
    label: "EC・小売",
    signal: "広告キーワード「EC 返品 減らす」／Shopify関連からの流入",
    headline: "「思ってたのと違う」を、買う前になくす。",
    sub: "ARで実物大に置いて確認。在庫はシステムと自動で同期します。",
    pain: "サイズ違いの返品が多く、利益が削られる",
    proof: { label: "在庫の同期", value: "リアルタイム" },
    caseTitle: "家具ECの例",
    caseBody:
      "商品をARで自室に配置できるようにし、在庫は基幹システムとAPI連携。サイズ起因の返品と、在庫切れ注文のお詫び対応がなくなりました。",
    cta: "返品を減らす相談をする",
    accent: "from-rose-400 to-orange-500",
  },
  {
    key: "recruit",
    label: "採用担当",
    signal: "検索「採用サイト 制作」／求人媒体からの流入",
    headline: "応募が来る採用サイトを、最短5日で。",
    sub: "働く様子はSNS連携で自動掲載。更新が止まらない採用サイトにします。",
    pain: "採用サイトを作っても、更新が続かない",
    proof: { label: "公開までの最短", value: "5日" },
    caseTitle: "採用サイトの例",
    caseBody:
      "InstagramとX の投稿を自動で取り込み、社内の日常が常に最新の状態に。「更新が止まった会社」に見えることによる離脱を防げます。",
    cta: "採用サイトの相談をする",
    accent: "from-violet-400 to-fuchsia-500",
  },
];

const BASE_SEG = SEGMENTS[0];

/** 差分を出すために比較する項目 */
const FIELDS: { key: keyof Segment; label: string }[] = [
  { key: "headline", label: "見出し" },
  { key: "sub", label: "サブコピー" },
  { key: "pain", label: "課題提起" },
  { key: "caseTitle", label: "実績の見出し" },
  { key: "cta", label: "CTAの文言" },
];

export default function DemoPersonalize() {
  const [seg, setSeg] = useState<SegKey>("default");
  const [fromUrl, setFromUrl] = useState(false);

  // 広告からの流入を想定：?seg=maker のようなパラメータがあれば自動で切り替える
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("seg");
    if (!param || !SEGMENTS.some((s) => s.key === param)) return;
    // エフェクト内で同期的に状態更新しないよう、次のタスクで反映する
    queueMicrotask(() => {
      setSeg(param as SegKey);
      setFromUrl(true);
    });
  }, []);

  const current = SEGMENTS.find((s) => s.key === seg) ?? BASE_SEG;
  const isDefault = current.key === "default";

  return (
    <div className="space-y-5">
      {/* セグメント切り替え */}
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              Visitor / 訪問者の属性
            </p>
            <p className="mt-1 text-xs text-slate-400">
              切り替えると、同じ1ページの見え方が変わります。
            </p>
          </div>
          {fromUrl ? (
            <span className="rounded-md border border-brand/40 bg-brand/10 px-2.5 py-1 text-[11px] text-brand-light">
              URLパラメータから自動判定しました
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setSeg(s.key);
                setFromUrl(false);
              }}
              aria-pressed={seg === s.key}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                seg === s.key
                  ? "border-brand/60 bg-brand/15 text-brand-light shadow-[0_0_16px_rgba(34,211,238,0.28)]"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-slate-400">
          <Icon name="search" className="mt-0.5 size-3.5 shrink-0 text-brand" />
          <span>
            <span className="text-slate-500">判定に使うシグナル：</span>
            {current.signal}
          </span>
        </p>
      </div>

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
        {/* ---------- 出し分けの結果 ---------- */}
        <DemoStage className="min-w-0 lg:col-span-3" label="エビスソフト.Personalized_View" status={current.label}>
          <div key={current.key} className="stagger-item p-6 sm:p-8">
            <p
              className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${current.accent} px-3 py-1 text-[11px] font-bold text-ink`}
            >
              <Icon name="target" className="size-3.5" />
              {current.label}向けの表示
            </p>

            <h3 className="mt-4 text-2xl leading-snug font-bold text-white sm:text-3xl">
              {current.headline}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{current.sub}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-2">
                <p className="text-[11px] text-slate-500">よくあるお悩み</p>
                <p className="mt-1 text-sm font-bold text-white">「{current.pain}」</p>
              </div>
              <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4 text-center">
                <p className="text-[11px] text-slate-500">{current.proof.label}</p>
                <p className="font-display mt-1 text-lg font-bold text-gold-light">
                  {current.proof.value}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-bold text-brand-light">{current.caseTitle}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{current.caseBody}</p>
            </div>

            <button
              type="button"
              className={`mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r px-6 text-sm font-bold text-ink ${current.accent}`}
            >
              {current.cta}
              <Icon name="arrowRight" className="size-4" />
            </button>
          </div>
        </DemoStage>

        {/* ---------- 何が変わったかの差分 ---------- */}
        <div className="panel space-y-4 p-5 min-w-0 lg:col-span-2">
          <div>
            <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              Diff / 標準表示との差分
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              ページを複製せず、同じURLのまま要素だけを差し替えています。
            </p>
          </div>

          {isDefault ? (
            <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
              いまは標準表示です。
              <br />
              上のタブで属性を切り替えると、差分が表示されます。
            </p>
          ) : (
            <ul className="space-y-3">
              {FIELDS.map((f) => (
                <li key={f.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] tracking-wider text-slate-500 uppercase">{f.label}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 line-through">
                    {String(BASE_SEG[f.key])}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed font-medium text-brand-light">
                    {String(current[f.key])}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="border-t border-white/10 pt-4 text-[11px] leading-relaxed text-slate-500">
            この出し分けはサーバー側（Edge）で行うため、表示が一瞬入れ替わるチラつきは起きません。個人を特定する情報は保存しない設計にできます。
          </p>
        </div>
      </div>
    </div>
  );
}
