"use client";

import { useEffect, useRef } from "react";

/**
 * 数値カウントアップ。ビューポートに入ったら 0 から実数値までアニメーションする。
 * "120+"・"98%"・"1.8倍"・"最短2週間" のような文字列から数値部分だけを動かす。
 * サーバーHTMLには最初から完成値が入るため、SEO/AEOやJS無効環境に影響しない。
 */
export function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const match = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
    if (!match) return;
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr);
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();

        const duration = 1400;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3); // ease-out-cubic
          el.textContent = `${prefix}${(target * eased).toFixed(decimals)}${suffix}`;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = value; // 端数誤差なく元の表記へ確定
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
