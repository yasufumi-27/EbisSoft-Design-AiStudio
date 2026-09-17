"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { PixelChroma } from "./PixelChroma";

/** Humanized AI PR character; the conversation remains lazy-loaded. */
const AssistantPanel = dynamic(() => import("./AssistantPanel"), {
  ssr: false,
  loading: () => (
    <div className="assistant-panel panel grid place-items-center">
      <span className="font-display animate-pulse text-xs tracking-[0.3em] text-slate-500">
        LOADING…
      </span>
    </div>
  ),
});

/** 吹き出しを一度閉じたら、そのタブでは出さない */
const HINT_KEY = "ebisu-assistant-hint";

export function SiteAssistant() {
  const [open, setOpen] = useState(false);
  /** 一度でも開いたか（開くまで AssistantPanel を mount しない） */
  const [mounted, setMounted] = useState(false);
  const [hint, setHint] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // 少し待ってから「何でも聞いてください」の吹き出しを出す（存在に気づいてもらうため）
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(HINT_KEY)) return;
    } catch {
      // プライベートモード等で sessionStorage が使えない場合は、単に毎回出す
    }
    const t = window.setTimeout(() => setHint(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  const dismissHint = useCallback(() => {
    setHint(false);
    try {
      window.sessionStorage.setItem(HINT_KEY, "1");
    } catch {
      /* 保存できなくても動作に影響はない */
    }
  }, []);

  const toggle = () => {
    dismissHint();
    setMounted(true);
    setOpen((v) => !v);
  };

  return (
    <div className="assistant-root assistant-chroma" data-open={open ? "true" : "false"}>
      {/* パネル本体（開いたあとは DOM に残し、表示だけ切り替えて会話を保持する） */}
      {mounted ? (
        <div id="chroma-assistant-panel" className="assistant-slot" aria-hidden={!open} inert={!open ? true : undefined}>
          <AssistantPanel onClose={close} />
        </div>
      ) : null}

      {/* 吹き出し（初回の気づき用） */}
      {hint && !open ? (
        <div className="assistant-hint">
          <button type="button" onClick={toggle} className="assistant-hint-body">
            AI広報のクロマです！<br/>気になること、聞いてください。
          </button>
          <button
            type="button"
            onClick={dismissHint}
            className="assistant-hint-close"
            aria-label="吹き出しを閉じる"
          >
            <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ) : null}

      {/* 起動ボタン（ドット絵のクロマの輪郭そのものがボタン。枠は描かない） */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={mounted ? "chroma-assistant-panel" : undefined}
        aria-label={open ? "クロマの案内を閉じる" : "AI広報のクロマに質問する"}
        className="assistant-launcher"
      >
        <PixelChroma/>
        <span className="chroma-nameplate">クロマ<span>AI広報</span></span>
        <span className="assistant-launcher-ping" aria-hidden="true" />
      </button>
    </div>
  );
}
