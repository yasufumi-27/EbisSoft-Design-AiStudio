"use client";

import { usePathname } from "next/navigation";

import { BackgroundFx } from "@/components/fx/BackgroundFx";
import { RevealInit } from "@/components/fx/RevealInit";
import { PointerFx } from "@/components/fx/PointerFx";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { PwaInit } from "@/components/fx/PwaInit";
import { CursorGlow } from "@/components/fx/CursorGlow";
import { SiteAssistant } from "@/components/assistant/SiteAssistant";

/**
 * サイト共通の演出をまとめて起動する部品。
 *
 * 【デモサイト（`/showcase`）では装飾を読み込まない】
 * デモサイト側では 3DCG・カメラ・音声認識などが同時に動きます。
 * そこへ本サイトの装飾（Three.js の3D背景・カーソル追従の光・スクロール進捗・
 * 常駐のAIアシスタント）まで重ねると、GPUとメインスレッドを取り合って
 * デモそのものがカクつきます。**デモに性能を全部渡すため**、
 * これらはデモサイトでは読み込みません。
 *
 * ここで判定しているのは「読み込むかどうか」です。`{cond ? <X/> : null}` にすることで、
 * 3D背景の `dynamic(() => import("./ThreeBackground"))` 自体が評価されず、
 * Three.js（約550KB）のチャンク取得が発生しません。
 *
 * 残す：
 * - `RevealInit` … これを外すと `[data-reveal]` の要素が表示されないままになる（必須）
 * - `PwaInit`   … Service Worker の登録。ごく小さく、オフライン表示に必要
 * - 背景のビネットとノイズ … 純粋なCSSで、描画コストがほぼない
 */

/** この配下では装飾を読み込まない（＝デモサイト） */
const LIGHT_PREFIX = "/showcase";

export function SiteChrome() {
  const pathname = usePathname() || "/";
  // basePath 配信（GitHub Pages）でも判定できるよう、末尾一致ではなく含有で見る
  const light = pathname === LIGHT_PREFIX || pathname.startsWith(`${LIGHT_PREFIX}/`);

  return (
    <>
      {/* リビール演出の起動役。軽く、これが無いと本文が出ないので常に読み込む */}
      <RevealInit />
      <PwaInit />

      {light ? (
        <>
          {/* 装飾なしの静かな背景（CSSのみ。描画コストはほぼゼロ） */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_0%,rgba(7, 5, 14,0.45)_55%,rgba(7, 5, 14,0.85)_100%)]"
          />
          <div
            aria-hidden
            className="bg-noise pointer-events-none fixed inset-0 -z-10 opacity-[0.05]"
          />
        </>
      ) : (
        <>
          <BackgroundFx />
          <PointerFx />
          <ScrollProgress />
          <CursorGlow />
          {/* 右下に常駐するドット絵キャラクター（チャット本体は開いたときだけ読み込む） */}
          <SiteAssistant />
        </>
      )}
    </>
  );
}
