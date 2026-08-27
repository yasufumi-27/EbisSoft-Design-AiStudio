"use client";

import { useCallback, useEffect, useState } from "react";
import { DemoStage } from "./DemoUi";
import { Icon } from "@/components/ui/icons";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Status = {
  serviceWorker: "登録済み" | "登録中…" | "未登録" | "非対応";
  installed: boolean;
  online: boolean;
  notification: NotificationPermission | "非対応";
  cacheCount: number;
  cacheNames: string[];
};

/**
 * PWA・通知デモ。
 * 表示している値はすべてこのブラウザの実際の状態です（Service Worker の登録状況、
 * キャッシュ済みファイル数、オンライン判定、通知の許可状態）。
 * 通知はサーバーを持たない静的サイトのためローカル通知で確認します。
 */
export default function DemoPwa() {
  const [status, setStatus] = useState<Status>({
    serviceWorker: "登録中…",
    installed: false,
    online: true,
    notification: "default",
    cacheCount: 0,
    cacheNames: [],
  });
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /* ---- 実際の状態を読み取る ---- */
  const refresh = useCallback(async () => {
    const swSupported = "serviceWorker" in navigator;
    let sw: Status["serviceWorker"] = swSupported ? "未登録" : "非対応";
    if (swSupported) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) sw = reg.active ? "登録済み" : "登録中…";
    }

    let cacheCount = 0;
    let cacheNames: string[] = [];
    if ("caches" in window) {
      cacheNames = (await caches.keys()).filter((k) => k.startsWith("ebisusoft-"));
      for (const name of cacheNames) {
        const c = await caches.open(name);
        cacheCount += (await c.keys()).length;
      }
    }

    setStatus({
      serviceWorker: sw,
      installed:
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari
        (window.navigator as unknown as { standalone?: boolean }).standalone === true,
      online: navigator.onLine,
      notification: "Notification" in window ? Notification.permission : "非対応",
      cacheCount,
      cacheNames,
    });
  }, []);

  useEffect(() => {
    // 初回の読み取りもエフェクト本体では行わず、次のタスクへ回す
    queueMicrotask(() => void refresh());
    const t = window.setInterval(refresh, 2500);

    const onOnline = () => refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOnline);

    const onInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);

    return () => {
      window.clearInterval(t);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  }, [refresh]);

  /* ---- 通知を実際に出す ---- */
  const notify = async () => {
    if (!("Notification" in window)) {
      setMessage("このブラウザは通知に対応していません。");
      return;
    }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setMessage("通知が許可されていません。ブラウザの設定から許可すると届きます。");
      refresh();
      return;
    }

    const body = "在庫が入荷しました。今なら在庫があります（これはデモ通知です）。";
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      // Service Worker 経由：Web Push で届くときと同じ経路
      await reg.showNotification("エビスソフト からのお知らせ", {
        body,
        icon: `${BASE}/icon.svg`,
        badge: `${BASE}/icon.svg`,
        tag: "ebisusoft-demo",
      });
    } else {
      new Notification("エビスソフト からのお知らせ", { body, icon: `${BASE}/icon.svg` });
    }
    setMessage("通知を送信しました。表示されない場合はOSの通知設定をご確認ください。");
    refresh();
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setMessage(
      outcome === "accepted"
        ? "ホーム画面に追加しました。"
        : "インストールをキャンセルしました。",
    );
    setInstallEvent(null);
    refresh();
  };

  const rows: { label: string; value: string; ok: boolean; note?: string }[] = [
    {
      label: "Service Worker",
      value: status.serviceWorker,
      ok: status.serviceWorker === "登録済み",
      note: "オフライン表示とキャッシュを担当します",
    },
    {
      label: "キャッシュ済みファイル",
      value: `${status.cacheCount} 件`,
      ok: status.cacheCount > 0,
      note: status.cacheNames.join(" / ") || "まだキャッシュされていません",
    },
    {
      label: "通信状態",
      value: status.online ? "オンライン" : "オフライン",
      ok: status.online,
      note: "オフラインでもキャッシュから表示できます",
    },
    {
      label: "通知の許可",
      value:
        status.notification === "granted"
          ? "許可済み"
          : status.notification === "denied"
            ? "拒否されています"
            : status.notification === "非対応"
              ? "非対応"
              : "未設定",
      ok: status.notification === "granted",
      note: "許可すると、ブラウザを閉じていても届けられます",
    },
    {
      label: "アプリとして起動中",
      value: status.installed ? "はい" : "いいえ（ブラウザ表示）",
      ok: status.installed,
      note: "ホーム画面から起動すると「はい」になります",
    },
  ];

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
      {/* ---------- 実際の状態 ---------- */}
      <DemoStage
        className="min-w-0 lg:col-span-3"
        label="エビスソフト.PWA_Status"
        status={status.online ? "ONLINE" : "OFFLINE"}
      >
        <ul className="divide-y divide-white/5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-start gap-3 px-5 py-4">
              <span
                className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${
                  r.ok
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-white/15 bg-white/5 text-slate-500"
                }`}
              >
                <Icon name={r.ok ? "check" : "clock"} className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-white">{r.label}</p>
                  <p className={`font-display text-xs ${r.ok ? "text-emerald-300" : "text-slate-400"}`}>
                    {r.value}
                  </p>
                </div>
                {/* 補足文は狭い端末では折り返す（1行に収めると読めなくなる） */}
                <p className="mt-0.5 text-[11px] text-slate-500 sm:truncate">{r.note}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="border-t border-white/10 px-5 py-3 text-[11px] text-slate-500">
          この表はブラウザの実際の状態を2.5秒ごとに読み直しています。
        </p>
      </DemoStage>

      {/* ---------- 操作 ---------- */}
      <div className="panel space-y-4 p-5 min-w-0 lg:col-span-2">
        <div>
          <p className="font-display text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
            Try / 試す
          </p>
        </div>

        <button
          type="button"
          onClick={notify}
          className="btn btn-primary inline-flex h-11 w-full items-center justify-center text-sm"
        >
          <Icon name="bell" className="size-4" />
          通知を試す
        </button>

        <button
          type="button"
          onClick={install}
          disabled={!installEvent}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-sm font-semibold text-slate-200 transition-colors hover:border-brand/50 disabled:opacity-40"
        >
          <Icon name="external" className="size-4" />
          {status.installed
            ? "インストール済みです"
            : installEvent
              ? "ホーム画面に追加"
              : "追加はブラウザのメニューから"}
        </button>

        {message ? (
          <p className="rounded-lg border border-brand/25 bg-brand/[0.07] px-3 py-2 text-xs leading-relaxed text-slate-300">
            {message}
          </p>
        ) : null}

        <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4">
          <p className="text-xs font-bold text-gold-light">オフラインを試すには</p>
          <ol className="mt-2 space-y-1 text-[11px] leading-relaxed text-slate-400">
            <li>1. このページを一度読み込む（キャッシュされます）</li>
            <li>2. 機内モードにする、または開発者ツールでオフラインにする</li>
            <li>3. ページを再読み込みすると、キャッシュから表示されます</li>
          </ol>
        </div>

        <p className="border-t border-white/10 pt-4 text-[11px] leading-relaxed text-slate-500">
          本番では Web Push を使い、サーバーから配信します。受信側の仕組みは、いま動いているこのService
          Workerと同じです。
        </p>
      </div>
    </div>
  );
}
