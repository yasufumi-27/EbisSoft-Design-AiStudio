"use client";

import { useEffect, useState } from "react";
import { nav } from "@/lib/nav";
import { SmartLink } from "@/components/ui/SmartLink";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/site/Logo";
import { Icon } from "@/components/ui/icons";
import { siteConfig } from "@/lib/site";

/**
 * サイト共通ヘッダー。暗い背景＋下辺の発光ライン。
 * スクロールすると背景の不透明度が上がり、コンテンツと干渉しない。
 *
 * ※ backdrop-filter（すりガラス）は使わない：
 *   sticky なヘッダーの背後は 3D背景・オーロラが常に動いているため、
 *   ぼかしの結果をキャッシュできず、スクロール中ずっと再合成が走って重かった。
 *   代わりに背景をほぼ不透明にして、文字の可読性を確保している。
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "bg-ink" : "bg-ink/90"
      }`}
    >
      {/* 下辺の発光ライン */}
      <div aria-hidden className="divider-glow absolute inset-x-0 bottom-0" />

      <div className="gutter-x mx-auto flex h-16 w-full max-w-6xl items-center justify-between">
        <Logo />

        {/* デスクトップナビ：ホバーでシアンの下線が伸びる */}
        {/* ナビ項目が8つあり、1024〜1279px では収まらない（ロゴに食い込み、CTAが2行になる）。
            この帯はハンバーガーメニューに任せ、デスクトップ表示は xl(1280px) 以上とする。
            ※ 以前 md → lg に上げたのと同じ理由。項目を増やすときは実測し直すこと。 */}
        <nav className="hidden items-center gap-7 xl:flex" aria-label="グローバルナビゲーション">
          {nav.map((item) => (
            <SmartLink
              key={item.href}
              href={item.href}
              className="group relative py-1 text-sm font-medium whitespace-nowrap text-slate-300 transition-colors hover:text-white"
            >
              {item.label}
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-brand to-accent shadow-[0_0_8px_rgba(182,126,255,0.8)] transition-transform duration-300 group-hover:scale-x-100"
              />
            </SmartLink>
          ))}
        </nav>

        <div className="hidden xl:block">
          <ButtonLink href="/contact" withArrow>
            無料で相談する
          </ButtonLink>
        </div>

        {/* モバイル：ハンバーガー */}
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-none text-slate-200 transition-colors hover:bg-white/10 xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* モバイルメニュー */}
      {open ? (
        <div id="mobile-menu" className="border-t border-brand/20 bg-ink xl:hidden">
          <nav
            className="gutter-x mx-auto flex w-full max-w-6xl flex-col py-3"
            aria-label="モバイルナビゲーション"
          >
            {nav.map((item) => (
              <SmartLink
                key={item.href}
                href={item.href}
                className="rounded-none px-2 py-3 text-base font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-brand-light"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </SmartLink>
            ))}
            <ButtonLink
              href="/contact"
              withArrow
              className="mt-3 w-full"
              onClick={() => setOpen(false)}
            >
              無料で相談する
            </ButtonLink>
            {/* 電話は「すぐ話したい」層の離脱を止める導線。
                クリックの計測は ContactLinkTracker がイベント委譲で拾うため onClick は不要。 */}
            <a
              href={`tel:${siteConfig.contact.telephone}`}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-none border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-bold text-brand-light"
              onClick={() => setOpen(false)}
            >
              <Icon name="phone" aria-hidden className="size-4" />
              {siteConfig.contact.telephoneDisplay}
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
