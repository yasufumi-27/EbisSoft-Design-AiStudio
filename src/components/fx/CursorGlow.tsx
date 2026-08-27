"use client";

import { useEffect, useRef } from "react";

/**
 * カーソルライト。
 * マウス位置に薄い光（.cursor-orb）を追従させ、暗い画面に「手元の明かり」を与えます。
 *
 * - 更新は requestAnimationFrame で1フレーム1回に間引き、transform だけを書き換える
 *   （レイアウトを起こさないので、スクロール中でも描画コストがほぼ増えません）
 * - タッチ端末・reduced-motion では CSS 側で非表示にしています
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let frame = 0;

    const paint = () => {
      frame = 0;
      el.style.setProperty("--cursor-x", `${x}px`);
      el.style.setProperty("--cursor-y", `${y}px`);
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      el.setAttribute("data-active", "");
      frame ||= requestAnimationFrame(paint);
    };
    const onLeave = () => el.removeAttribute("data-active");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} aria-hidden className="cursor-orb" />;
}
