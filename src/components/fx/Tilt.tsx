"use client";

import { useRef, type ReactNode } from "react";

/**
 * マウスに追従して立体的に傾く3D Tiltラッパー（高級車サイト風のインタラクション）。
 * transform のみで実装しレイアウトを汚さない。タッチ・reduced-motionでは何もしない。
 */
export function Tilt({ children, max = 7 }: { children: ReactNode; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.6s cubic-bezier(0.2, 0.7, 0.3, 1)";
    el.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)";
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transition = "transform 0.1s linear";
    el.style.transform = `perspective(1100px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(
      px * max
    ).toFixed(2)}deg)`;
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
