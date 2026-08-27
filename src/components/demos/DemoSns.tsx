"use client";

import { useMemo, useState } from "react";
import { ChipButton, ControlGroup, DemoStage } from "./DemoUi";
import { Icon } from "@/components/ui/icons";

/* ==================================================================
 * SNSフィード（サンプルデータ）
 * 実案件では Instagram Graph API / X API / YouTube Data API から
 * サーバー側で定期取得し、キャッシュして配信します。
 * ================================================================ */

type Platform = "instagram" | "x" | "youtube";

type Post = {
  id: string;
  platform: Platform;
  author: string;
  handle: string;
  body: string;
  tags: string[];
  likes: number;
  comments: number;
  minutesAgo: number;
  gradient: string;
};

const PLATFORM_META: Record<Platform, { label: string; color: string; ring: string }> = {
  instagram: { label: "Instagram", color: "text-rose-300", ring: "ring-rose-400/30" },
  x: { label: "X", color: "text-slate-200", ring: "ring-slate-400/30" },
  youtube: { label: "YouTube", color: "text-red-300", ring: "ring-red-400/30" },
};

const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    platform: "instagram",
    author: "エビスソフト",
    handle: "@ebisusoft",
    body: "京都・伏見の町家をモチーフにしたコーポレートサイト、本日公開しました。3Dの町家モデルがスクロールに合わせて組み上がります。",
    tags: ["京都", "Web制作", "3DCG"],
    likes: 248,
    comments: 12,
    minutesAgo: 42,
    gradient: "from-rose-500/70 via-orange-400/60 to-amber-300/60",
  },
  {
    id: "p2",
    platform: "x",
    author: "エビスソフト",
    handle: "@ebisusoft",
    body: "AIエージェントで実装を並列化したら、LPの制作が5日で公開まで完了。空いた時間はCore Web Vitalsの詰めに使えました。Lighthouse は100点。",
    tags: ["AI開発", "Nextjs"],
    likes: 512,
    comments: 38,
    minutesAgo: 120,
    gradient: "from-cyan-500/60 via-sky-500/50 to-indigo-500/60",
  },
  {
    id: "p3",
    platform: "youtube",
    author: "エビスソフト Channel",
    handle: "@ebisusoft",
    body: "【解説】RAG構成のAIチャットボットを自社サイトに導入する手順｜根拠つき回答の作り方",
    tags: ["AIチャットボット", "RAG"],
    likes: 1840,
    comments: 96,
    minutesAgo: 300,
    gradient: "from-red-500/60 via-rose-500/50 to-fuchsia-500/50",
  },
  {
    id: "p4",
    platform: "instagram",
    author: "エビスソフト",
    handle: "@ebisusoft",
    body: "在庫システムとECをAPIで接続。サイトの在庫表示が、倉庫の実数とリアルタイムで一致するようになりました。",
    tags: ["システム連携", "EC"],
    likes: 176,
    comments: 8,
    minutesAgo: 480,
    gradient: "from-violet-500/60 via-purple-500/50 to-blue-500/50",
  },
  {
    id: "p5",
    platform: "x",
    author: "エビスソフト",
    handle: "@ebisusoft",
    body: "llms.txt を設置して2週間。生成AIからの参照が増えてきました。AEO / LLMO は「やっておくと効く」段階から「やらないと不利」な段階に入りつつあります。",
    tags: ["LLMO", "AEO"],
    likes: 903,
    comments: 54,
    minutesAgo: 720,
    gradient: "from-emerald-500/60 via-teal-400/50 to-cyan-400/50",
  },
];

/** 「新着投稿が届いた」ときに追加されるサンプル */
const INCOMING: Omit<Post, "id" | "minutesAgo">[] = [
  {
    platform: "x",
    author: "エビスソフト",
    handle: "@ebisusoft",
    body: "WebGLの製品ビューアを公開しました。スマホでも60fpsで回せるよう、ポリゴンとテクスチャを詰めています。",
    tags: ["WebGL", "3DCG"],
    likes: 3,
    comments: 0,
    gradient: "from-cyan-500/60 via-blue-500/50 to-violet-500/60",
  },
  {
    platform: "instagram",
    author: "エビスソフト",
    handle: "@ebisusoft",
    body: "伏見のオフィスから。今日は新しい採用サイトのワイヤーフレームを詰めています。",
    tags: ["京都", "採用サイト"],
    likes: 5,
    comments: 1,
    gradient: "from-amber-500/60 via-orange-400/50 to-rose-400/50",
  },
];

function relativeTime(min: number): string {
  if (min < 60) return `${min}分前`;
  if (min < 1440) return `${Math.floor(min / 60)}時間前`;
  return `${Math.floor(min / 1440)}日前`;
}

/* ==================================================================
 * OGPカードプレビュー（こちらは実装：入力が即座に反映されます）
 * ================================================================ */

type Preview = "x" | "facebook" | "line";

const THEMES = [
  { key: "cyan", label: "シアン", from: "#0e7490", via: "#22d3ee", to: "#8b5cf6" },
  { key: "gold", label: "ゴールド", from: "#7c5a1e", via: "#e2c078", to: "#f3ddb0" },
  { key: "rose", label: "ローズ", from: "#9f1239", via: "#f43f5e", to: "#fb923c" },
  { key: "violet", label: "バイオレット", from: "#4c1d95", via: "#8b5cf6", to: "#22d3ee" },
];

export default function DemoSns() {
  /* ---- フィード ---- */
  const [filter, setFilter] = useState<Platform | "all">("all");
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [incomingIndex, setIncomingIndex] = useState(0);

  const visible = useMemo(
    () => (filter === "all" ? posts : posts.filter((p) => p.platform === filter)),
    [filter, posts],
  );

  const fetchNew = () => {
    const src = INCOMING[incomingIndex % INCOMING.length];
    setPosts((prev) => [
      { ...src, id: `new-${prev.length}-${incomingIndex}`, minutesAgo: 1 },
      ...prev,
    ]);
    setIncomingIndex((i) => i + 1);
    setFilter("all");
  };

  /* ---- OGPカード ---- */
  const [title, setTitle] = useState("AIで最速・高性能なホームページ制作｜エビスソフト");
  const [desc, setDesc] = useState(
    "京都市伏見区のAI活用型Web制作会社。生成AIを制作フローに組み込み、最短5日で高性能なサイトを公開します。",
  );
  const [theme, setTheme] = useState(THEMES[0]);
  const [preview, setPreview] = useState<Preview>("x");

  const titleLimit = 60;
  const descLimit = 120;

  const metaTags = `<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="https://www.ebisusoft.co.jp/opengraph-image" />
<meta name="twitter:card" content="summary_large_image" />`;

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-2">
      {/* ================= フィード ================= */}
      <DemoStage label="エビスソフト.Social_Feed" status={`${visible.length} POSTS`}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
          <ChipButton active={filter === "all"} onClick={() => setFilter("all")}>
            すべて
          </ChipButton>
          {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
            <ChipButton key={p} active={filter === p} onClick={() => setFilter(p)}>
              {PLATFORM_META[p].label}
            </ChipButton>
          ))}
          <button
            type="button"
            onClick={fetchNew}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-light transition-colors hover:bg-brand/20"
          >
            <Icon name="refresh" className="size-3.5" />
            新着を取得
          </button>
        </div>

        <ul className="h-[420px] divide-y divide-white/5 overflow-y-auto">
          {visible.map((post) => {
            const meta = PLATFORM_META[post.platform];
            return (
              <li key={post.id} className="sns-post flex gap-3 p-4">
                <span
                  className={`size-11 shrink-0 rounded-xl bg-gradient-to-br ${post.gradient} ring-1 ${meta.ring}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-bold text-white">{post.author}</span>
                    <span className="text-xs text-slate-500">{post.handle}</span>
                    <span className={`font-display text-[10px] tracking-widest ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="ml-auto text-[11px] text-slate-600">
                      {relativeTime(post.minutesAgo)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{post.body}</p>
                  <p className="mt-2 flex flex-wrap gap-x-2 text-xs text-brand-light">
                    {post.tags.map((t) => (
                      <span key={t}>#{t}</span>
                    ))}
                  </p>
                  <p className="mt-2 flex gap-4 text-[11px] text-slate-500">
                    <span>♥ {post.likes.toLocaleString()}</span>
                    <span>💬 {post.comments}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </DemoStage>

      {/* ================= OGPカードプレビュー ================= */}
      <DemoStage label="エビスソフト.OGP_Preview" status="LIVE EDIT">
        <div className="space-y-4 p-5">
          {/* プレビュー先の切り替え */}
          <ControlGroup label="Preview / 表示先">
            {(
              [
                ["x", "X（旧Twitter）"],
                ["facebook", "Facebook"],
                ["line", "LINE"],
              ] as [Preview, string][]
            ).map(([key, label]) => (
              <ChipButton key={key} active={preview === key} onClick={() => setPreview(key)}>
                {label}
              </ChipButton>
            ))}
          </ControlGroup>

          {/* カードのプレビュー */}
          <div
            className={
              preview === "line"
                ? "mx-auto max-w-[300px] overflow-hidden rounded-2xl bg-[#1b1f27] ring-1 ring-white/10"
                : "overflow-hidden rounded-xl bg-[#15181c] ring-1 ring-white/15"
            }
          >
            {/* OG画像に相当する領域（実際は Next.js の動的画像生成で作ります） */}
            <div
              className="relative flex aspect-[1200/630] flex-col justify-between p-5"
              style={{
                background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.via} 55%, ${theme.to} 100%)`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-md bg-black/35 text-xs font-bold text-white">
                  E
                </span>
                <span className="font-display text-xs font-bold tracking-widest text-white/90">
                  エビスソフト
                </span>
              </div>
              <p className="line-clamp-3 text-lg leading-snug font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)] sm:text-xl">
                {title || "（タイトル未入力）"}
              </p>
              <span className="font-display text-[10px] tracking-widest text-white/80">
                www.ebisusoft.co.jp
              </span>
            </div>

            {/* 各SNSでのテキスト表示の違い */}
            {preview === "x" ? (
              <div className="px-3 py-2">
                <p className="truncate text-[13px] text-white">{title}</p>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-400">{desc}</p>
                <p className="mt-1 text-[11px] text-slate-500">www.ebisusoft.co.jp</p>
              </div>
            ) : preview === "facebook" ? (
              <div className="bg-[#f0f2f5] px-3 py-2">
                <p className="text-[10px] tracking-wide text-[#65676b] uppercase">
                  www.ebisusoft.co.jp
                </p>
                <p className="mt-0.5 line-clamp-2 text-[13px] font-bold text-[#050505]">{title}</p>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-[#65676b]">{desc}</p>
              </div>
            ) : (
              <div className="px-3 py-2">
                <p className="line-clamp-2 text-[13px] font-bold text-white">{title}</p>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-400">{desc}</p>
              </div>
            )}
          </div>

          {/* 入力欄 */}
          <div className="space-y-3">
            <label className="block">
              <span className="flex items-center justify-between text-xs text-slate-400">
                og:title
                <span
                  className={
                    title.length > titleLimit ? "text-rose-300" : "text-slate-600"
                  }
                >
                  {title.length} / {titleLimit}
                </span>
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="field text-sm"
                aria-label="OGPタイトル"
              />
            </label>

            <label className="block">
              <span className="flex items-center justify-between text-xs text-slate-400">
                og:description
                <span className={desc.length > descLimit ? "text-rose-300" : "text-slate-600"}>
                  {desc.length} / {descLimit}
                </span>
              </span>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                className="field resize-none text-sm"
                aria-label="OGP説明文"
              />
            </label>

            <ControlGroup label="Theme / 配色">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTheme(t)}
                  aria-label={t.label}
                  aria-pressed={theme.key === t.key}
                  className={`h-8 w-12 rounded-lg border-2 transition-all ${
                    theme.key === t.key ? "scale-105 border-white" : "border-white/20"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${t.from}, ${t.via}, ${t.to})`,
                  }}
                />
              ))}
            </ControlGroup>
          </div>

          {/* 生成されるメタタグ */}
          <div>
            <p className="font-display mb-2 text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              Generated Meta Tags
            </p>
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-ink/70 p-3 text-[10px] leading-relaxed text-slate-400">
              <code>{metaTags}</code>
            </pre>
          </div>
        </div>
      </DemoStage>
    </div>
  );
}
