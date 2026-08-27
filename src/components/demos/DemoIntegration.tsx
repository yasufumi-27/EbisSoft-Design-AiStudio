"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChipButton, DemoStage, RangeControl, SwitchButton } from "./DemoUi";
import { Icon, type IconKey } from "@/components/ui/icons";

/* ==================================================================
 * モックAPI（社内システムの代役）
 * 実案件では、この部分をお客様の実システムのエンドポイントに差し替えます。
 * ================================================================ */

type Item = {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: string;
};

const CATALOG: Item[] = [
  { sku: "KY-1001", name: "伏見焼 マグカップ", category: "食器", price: 3800, stock: 24, location: "京都倉庫A" },
  { sku: "KY-1002", name: "宇治茶ギフトセット", category: "食品", price: 5400, stock: 8, location: "京都倉庫A" },
  { sku: "KY-2001", name: "西陣織 ノートカバー", category: "文具", price: 7200, stock: 3, location: "京都倉庫B" },
  { sku: "KY-2002", name: "清水焼 酒器セット", category: "食器", price: 12800, stock: 0, location: "京都倉庫B" },
  { sku: "KY-3001", name: "京友禅 スカーフ", category: "衣料", price: 16500, stock: 11, location: "大阪倉庫" },
  { sku: "KY-3002", name: "桐箱入り 線香セット", category: "雑貨", price: 4200, stock: 42, location: "大阪倉庫" },
];

type LogKind = "request" | "success" | "error" | "retry" | "webhook" | "info";

type LogEntry = {
  id: number;
  time: string;
  kind: LogKind;
  system: string;
  message: string;
};

const LOG_STYLE: Record<LogKind, { color: string; label: string }> = {
  request: { color: "text-sky-300", label: "REQ" },
  success: { color: "text-emerald-300", label: "OK" },
  error: { color: "text-rose-300", label: "ERR" },
  retry: { color: "text-amber-300", label: "RETRY" },
  webhook: { color: "text-violet-300", label: "HOOK" },
  info: { color: "text-slate-400", label: "INFO" },
};

/** パイプライン上のノード（データが通る経路の可視化） */
type Node = { key: string; label: string; icon: IconKey };

/**
 * 既定の連携先。
 * ⚠️ `key`（web / api / inventory / crm / notify）は処理ステップの識別子でもあるため固定。
 *    デモサイト（/showcase）から職種に合わせて差し替えられるのは **label と icon だけ**。
 */
const NODES: Node[] = [
  { key: "web", label: "Webサイト", icon: "layout" },
  { key: "api", label: "APIゲートウェイ", icon: "plug" },
  { key: "inventory", label: "在庫システム", icon: "cart" },
  { key: "crm", label: "CRM", icon: "user" },
  { key: "notify", label: "Slack通知", icon: "chat" },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * @param nodes    連携先の表示名（職種別デモサイトから差し替える。key は固定）
 * @param catalog  在庫データ（職種別デモサイトから差し替える）
 */
export default function DemoIntegration({
  nodes = NODES,
  catalog = CATALOG,
}: {
  nodes?: Node[];
  catalog?: Item[];
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>(catalog);
  const [searching, setSearching] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [failureMode, setFailureMode] = useState(false);
  const [latency, setLatency] = useState(240);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ calls: 0, errors: 0, retries: 0 });

  const logIdRef = useRef(0);
  const aliveRef = useRef(true);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const pushLog = useCallback((kind: LogKind, system: string, message: string) => {
    if (!aliveRef.current) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
    logIdRef.current += 1;
    setLogs((prev) => [...prev.slice(-60), { id: logIdRef.current, time, kind, system, message }]);
  }, []);

  /**
   * モックAPI呼び出し。実際に非同期で待ち、障害モードでは一定確率で失敗します。
   * 失敗時は指数バックオフで最大3回までリトライ（実案件の連携設計と同じ考え方）。
   */
  const callApi = useCallback(
    async <T,>(opts: {
      system: string;
      node: string;
      method: string;
      path: string;
      result: () => T;
      failRate?: number;
    }): Promise<T> => {
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        setActiveNode(opts.node);
        pushLog("request", opts.system, `${opts.method} ${opts.path}${attempt > 1 ? ` (attempt ${attempt})` : ""}`);
        setStats((s) => ({ ...s, calls: s.calls + 1 }));

        await sleep(latency * (0.7 + Math.random() * 0.6));
        if (!aliveRef.current) throw new Error("aborted");

        const failRate = failureMode ? (opts.failRate ?? 0.35) : 0;
        const failed = Math.random() < failRate;

        if (!failed) {
          pushLog("success", opts.system, `200 OK — ${opts.path}`);
          return opts.result();
        }

        setStats((s) => ({ ...s, errors: s.errors + 1 }));
        pushLog("error", opts.system, `503 Service Unavailable — ${opts.path}`);

        if (attempt < maxAttempts) {
          const backoff = 300 * 2 ** (attempt - 1);
          setStats((s) => ({ ...s, retries: s.retries + 1 }));
          pushLog("retry", opts.system, `${backoff}ms 待機してリトライします（指数バックオフ）`);
          await sleep(backoff);
          if (!aliveRef.current) throw new Error("aborted");
        }
      }
      throw new Error(`${opts.system} への接続に失敗しました`);
    },
    [failureMode, latency, pushLog],
  );

  /* ---------------- 在庫検索 ---------------- */
  const runSearch = async (q: string) => {
    if (running) return;
    setSearching(true);
    try {
      const result = await callApi({
        system: "在庫システム",
        node: "inventory",
        method: "GET",
        path: `/api/inventory?q=${encodeURIComponent(q || "*")}`,
        failRate: 0.2,
        result: () =>
          catalog.filter(
            (i) =>
              !q ||
              i.name.includes(q) ||
              i.sku.toLowerCase().includes(q.toLowerCase()) ||
              i.category.includes(q),
          ),
      });
      if (!aliveRef.current) return;
      setItems(result);
      pushLog("info", "Webサイト", `${result.length}件の在庫データを画面に反映しました`);
    } catch (e) {
      if (!aliveRef.current) return;
      pushLog("error", "Webサイト", `検索に失敗しました：${(e as Error).message}`);
    } finally {
      if (aliveRef.current) {
        setSearching(false);
        setActiveNode(null);
      }
    }
  };

  /* ---------------- 予約（連携フロー全体） ---------------- */
  const runReservation = async (item: Item) => {
    if (running) return;
    setRunning(true);
    pushLog("info", "Webサイト", `「${item.name}」の予約フローを開始します`);
    setActiveNode("web");
    await sleep(180);

    try {
      // 1. 在庫の引き当て
      const reserved = await callApi({
        system: "在庫システム",
        node: "inventory",
        method: "PATCH",
        path: `/api/inventory/${item.sku}/reserve`,
        result: () => ({ sku: item.sku, remaining: Math.max(item.stock - 1, 0) }),
      });
      if (!aliveRef.current) return;
      setItems((prev) =>
        prev.map((i) => (i.sku === item.sku ? { ...i, stock: reserved.remaining } : i)),
      );
      pushLog("info", "在庫システム", `${item.sku} を1点引き当て（残り${reserved.remaining}点）`);

      // 2. CRMへ顧客・商談を登録
      const crm = await callApi({
        system: "CRM",
        node: "crm",
        method: "POST",
        path: "/api/crm/deals",
        result: () => ({ dealId: `D-${Math.floor(100000 + Math.random() * 899999)}` }),
      });
      if (!aliveRef.current) return;
      pushLog("info", "CRM", `商談 ${crm.dealId} を作成しました（金額 ¥${item.price.toLocaleString()}）`);

      // 3. Webhookで社内通知
      await callApi({
        system: "Slack",
        node: "notify",
        method: "POST",
        path: "/webhooks/slack/sales",
        failRate: 0.15,
        result: () => true,
      });
      if (!aliveRef.current) return;
      pushLog("webhook", "Slack", `#sales に「${item.name} の予約が入りました」を通知`);
      pushLog("success", "Webサイト", "予約完了。お客様へ自動返信メールを送信しました");
    } catch (e) {
      if (!aliveRef.current) return;
      pushLog("error", "連携基盤", `${(e as Error).message}。処理をロールバックし、担当者へ通知しました`);
    } finally {
      if (aliveRef.current) {
        setRunning(false);
        setActiveNode(null);
      }
    }
  };

  const busy = running || searching;
  const successRate = useMemo(() => {
    if (stats.calls === 0) return null;
    return Math.round(((stats.calls - stats.errors) / stats.calls) * 100);
  }, [stats]);

  return (
    <div className="space-y-5">
      {/* ---------- パイプライン可視化 ---------- */}
      <DemoStage
        label="エビスソフト.Integration_Pipeline"
        status={busy ? "PROCESSING…" : "IDLE"}
      >
        <div className="flex items-center gap-1 overflow-x-auto p-5 sm:gap-2">
          {nodes.map((n, i) => (
            <div key={n.key} className="flex shrink-0 items-center gap-1 sm:gap-2">
              <div
                className={`flex min-w-[86px] flex-col items-center gap-2 rounded-xl border px-3 py-3 transition-all duration-300 sm:min-w-[110px] ${
                  activeNode === n.key
                    ? "-translate-y-1 border-brand/70 bg-brand/15 shadow-[0_0_24px_rgba(34,211,238,0.4)]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <Icon
                  name={n.icon}
                  className={`size-5 ${activeNode === n.key ? "text-brand-light" : "text-slate-500"}`}
                />
                <span
                  className={`text-center text-[11px] font-semibold ${
                    activeNode === n.key ? "text-white" : "text-slate-400"
                  }`}
                >
                  {n.label}
                </span>
              </div>
              {i < nodes.length - 1 ? (
                <span
                  aria-hidden
                  className={`h-px w-4 shrink-0 sm:w-7 ${
                    busy ? "pipe-flow" : "bg-white/15"
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>
      </DemoStage>

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
        {/* ---------- 在庫検索・予約 ---------- */}
        <DemoStage className="min-w-0 lg:col-span-3" label="エビスソフト.Inventory_Client">
          <div className="space-y-4 p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(query);
              }}
              className="flex gap-2"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="商品名・SKU・カテゴリで検索（例：京都、食器）"
                aria-label="在庫を検索"
                className="field !mt-0 flex-1 text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="shrink-0 rounded-lg bg-gradient-to-br from-brand to-accent px-4 text-sm font-bold text-ink transition-opacity disabled:opacity-40"
              >
                {searching ? "検索中…" : "検索"}
              </button>
            </form>

            <ul className="max-h-[300px] space-y-2 overflow-y-auto">
              {items.length === 0 ? (
                <li className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                  該当する在庫がありません。
                </li>
              ) : (
                items.map((item) => (
                  <li
                    key={item.sku}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      {/* 狭い端末では商品名を省略せず折り返す（切れると何の商品か分からない） */}
                      <p className="text-sm font-bold text-white sm:truncate">{item.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {item.sku} ・ {item.category} ・ {item.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-sm font-bold text-gold-light">
                        ¥{item.price.toLocaleString()}
                      </p>
                      <p
                        className={`text-[11px] ${
                          item.stock === 0
                            ? "text-rose-300"
                            : item.stock <= 5
                              ? "text-amber-300"
                              : "text-emerald-300"
                        }`}
                      >
                        在庫 {item.stock}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy || item.stock === 0}
                      onClick={() => runReservation(item)}
                      className="shrink-0 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-light transition-colors hover:bg-brand/20 disabled:opacity-30"
                    >
                      予約を実行
                    </button>
                  </li>
                ))
              )}
            </ul>

            {/* コントロール */}
            <div className="space-y-4 border-t border-white/10 pt-4">
              <div className="flex flex-wrap gap-2">
                <SwitchButton checked={failureMode} onChange={setFailureMode}>
                  障害シミュレーション
                </SwitchButton>
                <ChipButton
                  active={false}
                  onClick={() => {
                    setItems(catalog);
                    setQuery("");
                    setLogs([]);
                    setStats({ calls: 0, errors: 0, retries: 0 });
                  }}
                >
                  初期状態に戻す
                </ChipButton>
              </div>
              <RangeControl
                label="Network Latency / 通信遅延"
                value={latency}
                min={60}
                max={900}
                step={20}
                suffix="ms"
                onChange={setLatency}
              />
            </div>
          </div>
        </DemoStage>

        {/* ---------- イベントログ ---------- */}
        <DemoStage
          className="min-w-0 lg:col-span-2"
          label="エビスソフト.Event_Log"
          status={successRate === null ? "—" : `${successRate}% OK`}
        >
          <dl className="grid grid-cols-3 gap-px border-b border-white/10 bg-white/5 text-center">
            {[
              ["API呼び出し", stats.calls],
              ["エラー", stats.errors],
              ["リトライ", stats.retries],
            ].map(([label, value]) => (
              <div key={label as string} className="bg-ink-2/80 px-2 py-3">
                <dt className="text-[10px] text-slate-500">{label}</dt>
                <dd className="font-display mt-1 text-base font-bold text-brand-light tabular-nums">
                  {value as number}
                </dd>
              </div>
            ))}
          </dl>

          <div
            ref={logRef}
            className="h-[336px] space-y-1.5 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed"
            role="log"
            aria-live="polite"
          >
            {logs.length === 0 ? (
              <p className="pt-10 text-center font-sans text-xs text-slate-500">
                在庫を検索するか「予約を実行」を押すと、
                <br />
                API呼び出しとWebhook通知がここに流れます。
              </p>
            ) : (
              logs.map((l) => (
                <p key={l.id} className="log-line flex gap-2">
                  <span className="shrink-0 text-slate-600">{l.time}</span>
                  <span className={`w-11 shrink-0 font-bold ${LOG_STYLE[l.kind].color}`}>
                    {LOG_STYLE[l.kind].label}
                  </span>
                  <span className="min-w-0 flex-1 text-slate-400">
                    <span className="text-slate-300">[{l.system}]</span> {l.message}
                  </span>
                </p>
              ))
            )}
          </div>
        </DemoStage>
      </div>
    </div>
  );
}
