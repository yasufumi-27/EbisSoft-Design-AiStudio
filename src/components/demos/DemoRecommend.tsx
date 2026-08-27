"use client";

import { useMemo, useState } from "react";
import type { CatalogItem } from "@/lib/showcase";
import Link from "next/link";
import { DemoStage } from "./DemoUi";
import { Icon } from "@/components/ui/icons";

/* ------------------------------------------------------------------
 * AIレコメンド。
 *
 * 推薦は本物の計算です。
 *   1. 各商品に特徴ベクトル（6次元）を持たせる
 *   2. クリック履歴から「関心ベクトル」を作る（新しいクリックほど重く）
 *   3. コサイン類似度で未閲覧の商品を並べ替える（コンテンツベース）
 *   4. サンプルの閲覧セッションから共起行列を作り、「よく一緒に見られている」を出す（協調フィルタリング）
 *
 * 実案件では 1 を商品説明文の埋め込み（ベクトル）に、2〜4 をサーバー側の
 * ベクトル検索と実際の行動ログに置き換えます。式はこのままです。
 * ---------------------------------------------------------------- */

/** 特徴の軸（この6つで商品の性格を表す） */
const AXES = [
  { key: "minimal", label: "ミニマル" },
  { key: "natural", label: "ナチュラル" },
  { key: "luxury", label: "高級感" },
  { key: "function", label: "機能重視" },
  { key: "compact", label: "コンパクト" },
  { key: "color", label: "彩り" },
] as const;

type Vec = readonly [number, number, number, number, number, number];

type Item = {
  id: string;
  name: string;
  price: number;
  cat: string;
  /** AXES の順に対応する特徴ベクトル（0〜1） */
  vec: Vec;
  /** カードのビジュアル（画像を使わずCSSで表現） */
  hue: string;
};

const ITEMS: Item[] = [
  {
    id: "sofa",
    name: "ローソファ 2人掛け",
    price: 168_000,
    cat: "ソファ",
    vec: [0.8, 0.5, 0.4, 0.5, 0.2, 0.2],
    hue: "from-slate-500 to-slate-700",
  },
  {
    id: "rug",
    name: "ウールラグ 200×140",
    price: 48_000,
    cat: "ファブリック",
    vec: [0.3, 0.8, 0.3, 0.2, 0.1, 0.7],
    hue: "from-amber-700 to-stone-600",
  },
  {
    id: "lamp",
    name: "真鍮フロアランプ",
    price: 62_000,
    cat: "照明",
    vec: [0.5, 0.3, 0.9, 0.3, 0.4, 0.3],
    hue: "from-amber-400 to-yellow-700",
  },
  {
    id: "chair",
    name: "オーク材ダイニングチェア",
    price: 39_000,
    cat: "チェア",
    vec: [0.6, 0.9, 0.4, 0.4, 0.6, 0.1],
    hue: "from-amber-600 to-amber-800",
  },
  {
    id: "table",
    name: "ガラスセンターテーブル",
    price: 84_000,
    cat: "テーブル",
    vec: [0.95, 0.1, 0.6, 0.3, 0.3, 0.05],
    hue: "from-cyan-300 to-slate-500",
  },
  {
    id: "stool",
    name: "収納スツール",
    price: 18_000,
    cat: "収納",
    vec: [0.4, 0.4, 0.1, 0.95, 0.9, 0.3],
    hue: "from-emerald-600 to-teal-800",
  },
  {
    id: "curtain",
    name: "リネンカーテン",
    price: 24_000,
    cat: "ファブリック",
    vec: [0.5, 0.9, 0.3, 0.3, 0.2, 0.4],
    hue: "from-stone-300 to-stone-500",
  },
  {
    id: "mirror",
    name: "アーチミラー（真鍮）",
    price: 56_000,
    cat: "インテリア",
    vec: [0.6, 0.2, 0.95, 0.1, 0.5, 0.2],
    hue: "from-yellow-500 to-amber-700",
  },
  {
    id: "desk",
    name: "折りたたみデスク",
    price: 32_000,
    cat: "デスク",
    vec: [0.7, 0.3, 0.1, 0.9, 0.95, 0.1],
    hue: "from-slate-400 to-slate-600",
  },
  {
    id: "vase",
    name: "セラミックベース",
    price: 9_800,
    cat: "小物",
    vec: [0.5, 0.7, 0.5, 0.05, 0.95, 0.8],
    hue: "from-rose-300 to-orange-400",
  },
  {
    id: "blanket",
    name: "ウールブランケット",
    price: 16_000,
    cat: "ファブリック",
    vec: [0.3, 0.8, 0.4, 0.4, 0.8, 0.9],
    hue: "from-red-700 to-amber-600",
  },
  {
    id: "shelf",
    name: "モジュール式シェルフ",
    price: 74_000,
    cat: "収納",
    vec: [0.85, 0.4, 0.3, 0.9, 0.2, 0.1],
    hue: "from-zinc-500 to-zinc-700",
  },
];

/**
 * サンプルの閲覧セッション（他の訪問者の行動ログに相当）。
 * ここから共起行列を作り「よく一緒に見られている」を算出します。
 */
const SESSIONS: string[][] = [
  ["sofa", "rug", "table"],
  ["sofa", "table", "lamp"],
  ["chair", "table", "curtain"],
  ["chair", "curtain", "vase"],
  ["lamp", "mirror", "table"],
  ["stool", "desk", "shelf"],
  ["desk", "shelf", "stool"],
  ["rug", "blanket", "vase"],
  ["blanket", "curtain", "rug"],
  ["mirror", "lamp", "vase"],
  ["sofa", "rug", "blanket"],
  ["shelf", "desk", "table"],
];

/** 共起回数：CO[a][b] = a と b が同じセッションで見られた回数 */
function buildCo(sessions: string[][]): Record<string, Record<string, number>> {
  const m: Record<string, Record<string, number>> = {};
  for (const s of sessions) {
    for (const a of s) {
      m[a] ??= {};
      for (const b of s) {
        if (a === b) continue;
        m[a][b] = (m[a][b] ?? 0) + 1;
      }
    }
  }
  return m;
}

const CO = buildCo(SESSIONS);

/* ------------------------------------------------------------------
 * 職種別の取扱商品でそのまま動かす
 *
 * 家具の代わりに、その職種のメニュー・商品（`showcaseData` の catalog）を
 * 並べ替えの対象にします。特徴ベクトルは価格・在庫・区分から機械的に作るので、
 * どの職種でも同じ計算式のまま動きます。
 * 実案件では、ここを商品説明文の埋め込み（ベクトル）に置き換えます。
 * ---------------------------------------------------------------- */

const HUES = [
  "from-slate-500 to-slate-700",
  "from-amber-600 to-amber-800",
  "from-cyan-400 to-sky-700",
  "from-emerald-600 to-teal-800",
  "from-rose-400 to-orange-500",
  "from-violet-500 to-indigo-700",
];

function buildFromCatalog(catalog: CatalogItem[]) {
  const prices = catalog.map((c) => c.price);
  const maxP = Math.max(...prices, 1);
  const minP = Math.min(...prices);
  const maxStock = Math.max(1, ...catalog.map((c) => c.stock));
  const cats = Array.from(new Set(catalog.map((c) => c.category)));

  // 軸のうち2つは「その職種で多い区分」そのものにする（推薦理由が読める文になる）
  const axes = [
    { key: "value", label: "手ごろさ" },
    { key: "premium", label: "特別感" },
    { key: "standard", label: "定番" },
    { key: "rare", label: "希少性" },
    { key: "cat0", label: cats[0] ?? "主な区分" },
    { key: "cat1", label: cats[1] ?? "そのほかの区分" },
  ] as const;

  const items: Item[] = catalog.map((c, i) => {
    const priceRank = maxP > minP ? (c.price - minP) / (maxP - minP) : 0.5;
    const stockRank = c.stock / maxStock;
    return {
      id: c.sku,
      name: c.name,
      price: c.price,
      cat: c.category,
      vec: [
        1 - priceRank,
        priceRank,
        stockRank,
        1 - stockRank,
        c.category === cats[0] ? 1 : 0.1,
        c.category === cats[1] ? 1 : 0.1,
      ] as Vec,
      hue: HUES[i % HUES.length],
    };
  });

  // 閲覧セッションの代わりに、「同じ区分」「価格帯が近い」を一緒に見たものとして扱う
  const sessions: string[][] = items.map((it) => {
    const same = items.filter((o) => o.id !== it.id && o.cat === it.cat).slice(0, 2);
    const near = items
      .filter((o) => o.id !== it.id && !same.includes(o))
      .sort((a, b) => Math.abs(a.price - it.price) - Math.abs(b.price - it.price))
      .slice(0, 2);
    return [it.id, ...same.map((o) => o.id), ...near.map((o) => o.id)];
  });

  return { items, axes: axes as unknown as typeof AXES, co: buildCo(sessions) };
}

const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a: readonly number[]) => Math.sqrt(dot(a, a));
/** コサイン類似度（0〜1） */
function cosine(a: readonly number[], b: readonly number[]) {
  const d = norm(a) * norm(b);
  return d === 0 ? 0 : dot(a, b) / d;
}

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

/**
 * @param catalog 職種別デモサイトから渡す取扱商品・メニュー。
 *   渡されたときは、家具のサンプルではなく**その職種の商品**を並べ替えます。
 * @param industryName 職種名（表示ラベルに使う）
 */
export default function DemoRecommend({
  catalog,
  industryName,
}: {
  catalog?: CatalogItem[];
  industryName?: string;
}) {
  /** 並べ替えの対象。職種の商品が渡されればそちらを使う */
  const {
    items: ITEMS_,
    axes: AXES_,
    co: CO_,
  } = useMemo(
    () =>
      catalog && catalog.length >= 4
        ? buildFromCatalog(catalog)
        : { items: ITEMS, axes: AXES, co: CO },
    [catalog],
  );

  /** クリック履歴（新しいものが先頭） */
  const [history, setHistory] = useState<string[]>([]);

  const view = (id: string) => setHistory((h) => [id, ...h.filter((x) => x !== id)].slice(0, 6));

  /** 関心ベクトル：新しいクリックほど重みを大きくした加重平均 */
  const profile = useMemo(() => {
    if (history.length === 0) return null;
    const acc = new Array(AXES_.length).fill(0);
    let total = 0;
    history.forEach((id, i) => {
      const item = ITEMS_.find((x) => x.id === id);
      if (!item) return;
      const weight = Math.pow(0.7, i); // 直近のクリックを重視（時間減衰）
      item.vec.forEach((v, k) => (acc[k] += v * weight));
      total += weight;
    });
    return acc.map((v) => v / total);
  }, [history, ITEMS_, AXES_]);

  /** 推薦：未閲覧の商品を、関心ベクトルとの類似度＋共起スコアで並べ替える */
  const ranked = useMemo(() => {
    if (!profile) return [];
    const last = history[0];
    const coRow = CO_[last] ?? {};
    const coMax = Math.max(1, ...Object.values(coRow));

    return ITEMS_.filter((it) => !history.includes(it.id))
      .map((it) => {
        const content = cosine(profile, it.vec); // 好みとの近さ
        const collab = (coRow[it.id] ?? 0) / coMax; // よく一緒に見られている度
        // 最終スコア：コンテンツベース 75% ＋ 協調フィルタリング 25%
        const score = content * 0.75 + collab * 0.25;

        // 推薦理由：最も寄与した軸を探す
        let bestAxis = 0;
        let bestVal = -1;
        profile.forEach((p, k) => {
          const c = p * it.vec[k];
          if (c > bestVal) {
            bestVal = c;
            bestAxis = k;
          }
        });

        return { item: it, score, content, collab, axis: AXES_[bestAxis].label };
      })
      .sort((a, b) => b.score - a.score);
  }, [profile, history, ITEMS_, AXES_, CO_]);

  const top = ranked.slice(0, 3);
  const rest = profile
    ? ranked.slice(3)
    : ITEMS_.map((it) => ({ item: it, score: 0, content: 0, collab: 0, axis: "" }));

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
      {/* ---------------- 推薦結果と商品一覧 ---------------- */}
      <div className="space-y-5 min-w-0 lg:col-span-3">
        <DemoStage
          label={industryName ? `${industryName}.Recommender` : "エビスソフト.Recommender"}
          status={profile ? `RANKED / ${history.length} views` : "NO DATA"}
        >
          <div className="p-5">
            {profile ? (
              <>
                <p className="font-display text-[10px] font-bold tracking-[0.25em] text-brand-light uppercase">
                  Recommended for you / あなたへのおすすめ
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {top.map((r, i) => (
                    <button
                      key={r.item.id}
                      type="button"
                      onClick={() => view(r.item.id)}
                      className="stagger-item panel panel-hover flex flex-col p-3 text-left"
                      style={{ animationDelay: `${i * 0.07}s` }}
                    >
                      <span className="relative">
                        <span
                          className={`block h-20 w-full rounded-lg bg-gradient-to-br ${r.item.hue} opacity-80`}
                        />
                        <span className="font-display absolute top-1.5 left-1.5 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-gold-light">
                          #{i + 1}
                        </span>
                      </span>
                      <span className="mt-2.5 block text-xs leading-snug font-bold text-white">
                        {r.item.name}
                      </span>
                      <span className="mt-1 block text-[11px] font-semibold text-slate-400 tabular-nums">
                        {yen(r.item.price)}
                      </span>
                      <span className="mt-2 block text-[10px] leading-snug text-brand-light">
                        {r.axis}の好みに一致（適合度 {(r.score * 100).toFixed(0)}%）
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-xs leading-relaxed text-slate-500">
                まだ行動データがありません。
                <br />
                下の商品を2〜3個クリックすると、推薦が組み立てられていきます。
              </p>
            )}

            <p className="font-display mt-6 mb-3 text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              All items / 商品一覧（クリックで閲覧）
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {rest.map((r) => {
                const seen = history.includes(r.item.id);
                return (
                  <button
                    key={r.item.id}
                    type="button"
                    onClick={() => view(r.item.id)}
                    className={`rounded-xl border p-2 text-left transition-all ${
                      seen
                        ? "border-brand/40 bg-brand/5"
                        : "border-white/10 bg-white/[0.03] hover:border-white/30"
                    }`}
                  >
                    <span
                      className={`block h-12 w-full rounded-md bg-gradient-to-br ${r.item.hue} opacity-70`}
                    />
                    {/* 3列だと商品名が1行に収まらない端末があるため、2行まで折り返す */}
                    <span className="mt-1.5 line-clamp-2 block text-[10px] leading-snug font-semibold text-slate-300">
                      {r.item.name}
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-500 tabular-nums">
                      {yen(r.item.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </DemoStage>
      </div>

      {/* ---------------- 推定された好みと計算の中身 ---------------- */}
      <div className="space-y-5 min-w-0 lg:col-span-2">
        <div className="panel p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              Interest profile / 推定された好み
            </p>
            {history.length ? (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="shrink-0 text-[10px] text-slate-500 underline transition-colors hover:text-slate-200"
              >
                リセット
              </button>
            ) : null}
          </div>

          <ul className="mt-4 space-y-2.5">
            {AXES_.map((a, i) => {
              const v = profile ? profile[i] : 0;
              return (
                <li key={a.key}>
                  <span className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{a.label}</span>
                    <span className="font-display text-slate-300 tabular-nums">
                      {(v * 100).toFixed(0)}
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-500"
                      style={{ width: `${v * 100}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-slate-500">
            クリック履歴の加重平均です（直近のクリックを重く見ます）。個人を特定する情報は使っていません。
          </p>
        </div>

        {/* 閲覧履歴 */}
        <div className="panel p-5">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            Session / 閲覧履歴
          </p>
          {history.length === 0 ? (
            <p className="mt-3 text-[11px] text-slate-500">まだ何も見ていません。</p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {history.map((id, i) => {
                const it = ITEMS_.find((x) => x.id === id);
                if (!it) return null;
                return (
                  <li key={id} className="log-line flex items-center gap-2 text-[11px]">
                    <span className="font-display w-6 shrink-0 text-slate-600 tabular-nums">
                      {String(history.length - i).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden
                      className={`size-3 shrink-0 rounded-sm bg-gradient-to-br ${it.hue}`}
                    />
                    <span className="flex-1 truncate text-slate-300">{it.name}</span>
                    {i === 0 ? (
                      <span className="shrink-0 text-[10px] text-brand-light">最新</span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* スコア内訳 */}
        <div className="panel p-5">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            Why / なぜこれを推薦したか
          </p>
          {top.length === 0 ? (
            <p className="mt-3 text-[11px] text-slate-500">
              商品をクリックすると、スコアの内訳が表示されます。
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {top.map((r, i) => (
                <li
                  key={r.item.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                    <span className="font-display text-gold-light">#{i + 1}</span>
                    <span className="truncate">{r.item.name}</span>
                  </p>
                  <dl className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      <dt className="w-24 shrink-0 text-slate-500">好みとの近さ</dt>
                      <dd className="flex-1">
                        <span className="block h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <span
                            className="block h-full rounded-full bg-brand/80"
                            style={{ width: `${r.content * 100}%` }}
                          />
                        </span>
                      </dd>
                      <dd className="font-display w-8 shrink-0 text-right text-slate-400 tabular-nums">
                        {(r.content * 100).toFixed(0)}
                      </dd>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <dt className="w-24 shrink-0 text-slate-500">一緒に見られる</dt>
                      <dd className="flex-1">
                        <span className="block h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <span
                            className="block h-full rounded-full bg-gold/80"
                            style={{ width: `${r.collab * 100}%` }}
                          />
                        </span>
                      </dd>
                      <dd className="font-display w-8 shrink-0 text-right text-slate-400 tabular-nums">
                        {(r.collab * 100).toFixed(0)}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-slate-500">
            コンテンツベース（コサイン類似度）75% ＋ 協調フィルタリング（共起）25%
            で合成しています。
          </p>
        </div>

        <Link
          prefetch={false}
          href="/contact"
          className="btn btn-secondary inline-flex h-11 w-full items-center justify-center px-5 text-sm"
        >
          自社の商品で試したい
          <Icon name="arrowRight" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
