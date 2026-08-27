"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Service Worker の登録役。
 * 一度表示したページを通信が不安定でも開けるようにし（オフライン対応）、
 * 再訪時の表示を速くします。登録は初期表示の邪魔をしないよう load 後に行います。
 */
export function PwaInit() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // localhost 以外の http では登録できないため、条件を満たす場合のみ試みる
    const secure = window.isSecureContext;
    if (!secure) return;

    const register = () => {
      navigator.serviceWorker
        .register(`${BASE}/sw.js`, { scope: `${BASE}/` })
        .catch(() => {
          /* 登録できない環境でもサイトは通常どおり動くため、失敗は無視する */
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
