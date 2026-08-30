"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { sceneIdForPath } from "./bgScenes";

// Three.js（約550KB）は初期表示のクリティカルパスから外し、
// クライアントでのみ遅延読み込みする（LCP/HTMLサイズへの影響ゼロ）。
const ThreeBackground = dynamic(() => import("./ThreeBackground"), { ssr: false });

/**
 * 3D背景を読み込んでよい環境かを判定する。
 *
 * 背景はあくまで装飾なので、割に合わない環境では読み込まない：
 * - 省データモード・低速回線
 * - CPUコアやメモリが少ない端末（描画が続くと発熱・電池消費が大きい）
 * - タッチ主体の狭い画面（スマートフォン）
 * - reduced-motion 設定
 */
function shouldLoadHeavyBackground(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 1024) return false;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return false;

  return true;
}

/** 3D背景＋可読性を確保するオーバーレイ（ビネット／薄いグリッド）。 */
export function BackgroundFx() {
  const [enabled, setEnabled] = useState(false);
  // 背景の主役はページごとに変わる（bgScenes.ts）。
  // 会社ロゴは背景から撤去し、代わりにそのページの内容を表す立体を置いている。
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!shouldLoadHeavyBackground()) return;

    // 本文の描画とページ読み込みが済み、メインスレッドが空いてから読み込む。
    // すぐ読み込むと Three.js の評価・初期化が本文の描画と競合し、体感が重くなる。
    let idleId = 0;
    const start = () => {
      idleId = window.requestIdleCallback
        ? window.requestIdleCallback(() => setEnabled(true), { timeout: 3000 })
        : window.setTimeout(() => setEnabled(true), 1200);
    };
    const cancel = () => {
      if (!idleId) return;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };

    if (document.readyState === "complete") {
      start();
      return cancel;
    }
    window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      cancel();
    };
  }, []);

  return (
    <>
      {enabled ? <ThreeBackground sceneId={sceneIdForPath(pathname)} /> : null}
      {/* オーロラ（アンビエント光）：ごくゆっくり流れる色の層で、黒い画面の平坦さを消す */}
      <div aria-hidden className="aurora" />
      {/* 本文の可読性を上げるビネット（中央上部を暗く落とす） */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_0%,rgba(7,5,14,0.45)_55%,rgba(7,5,14,0.85)_100%)]"
      />
      {/* フィルムノイズの質感（ごく薄く重ねて安っぽいフラット感を消す） */}
      <div aria-hidden className="bg-noise pointer-events-none fixed inset-0 -z-10 opacity-[0.05]" />
    </>
  );
}
