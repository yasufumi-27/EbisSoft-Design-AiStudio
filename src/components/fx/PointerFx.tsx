"use client";

import { useEffect } from "react";

/**
 * カードのスポットライト演出の起動役。
 * ドキュメント全体で pointermove を1本だけ監視し、ホバー中の .panel に
 * マウス座標（--mx / --my）をCSS変数で渡す（光の描画は globals.css 側）。
 */
export function PointerFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return; // タッチ端末では無効

    const onMove = (e: PointerEvent) => {
      const panel = (e.target as Element | null)?.closest?.(".panel") as HTMLElement | null;
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      panel.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
