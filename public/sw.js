/*
 * EbisuSoft Service Worker
 *
 * 目的：
 * - 一度表示したページを、通信が不安定でも開けるようにする（オフライン対応）
 * - 静的アセット（JS/CSS/フォント/画像）をキャッシュから即時返す（再訪時の体感速度）
 *
 * 方針：
 * - HTML（ナビゲーション）… ネットワーク優先。失敗したらキャッシュ→オフラインページ
 * - 静的アセット           … キャッシュ優先＋バックグラウンド更新（stale-while-revalidate）
 * - それ以外・別オリジン    … 介入しない（素通し）
 *
 * ※ 静的配信のためプッシュ通知はサーバーからではなくローカル通知で確認します。
 *   Web Push を導入する場合も、受信側の実装はこのファイルの push ハンドラです。
 */

const VERSION = "v3";   // ロゴ画像の差し替えに合わせて更新（古いキャッシュを破棄）
const STATIC_CACHE = `ebisusoft-static-${VERSION}`;
const PAGE_CACHE = `ebisusoft-pages-${VERSION}`;

// Service Worker の登録スコープ = basePath（GitHub Pages のサブパス配信に対応）
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const OFFLINE_URL = `${SCOPE_PATH}/`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      // トップページだけは先に確保しておき、初回オフラインでも何か出せるようにする
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" })).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("ebisusoft-") && !k.endsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // --- ページ遷移：ネットワーク優先 ---
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(PAGE_CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match(OFFLINE_URL);
          if (fallback) return fallback;
          return new Response(
            "<!doctype html><meta charset='utf-8'><title>オフライン</title>" +
              "<body style='background:#05070f;color:#b7c2d8;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0'>" +
              "<p>オフラインです。通信が回復すると自動で表示されます。</p></body>",
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 },
          );
        }
      })(),
    );
    return;
  }

  // --- 静的アセット：キャッシュ優先＋裏で更新 ---
  const isStatic =
    url.pathname.startsWith(`${SCOPE_PATH}/_next/static/`) ||
    /\.(?:css|js|woff2?|png|jpe?g|svg|webp|avif|ico)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })(),
    );
  }
});

/* --- プッシュ通知の受信（Web Push を導入した場合にそのまま動きます） --- */
self.addEventListener("push", (event) => {
  let data = { title: "EbisuSoft", body: "新しいお知らせがあります。" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: `${SCOPE_PATH}/icon.svg`,
      badge: `${SCOPE_PATH}/icon.svg`,
      tag: "ebisusoft-push",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(OFFLINE_URL));
});
