"use client";

import { MascotFace } from "@/components/assistant/MascotFace";
import { ja } from "@/lib/typography";

/**
 * デモの読み込み待機画面。
 *
 * デモは3D・音声認識・カメラなどを含み、回線や端末によっては数秒かかります。
 * 何も出ないまま止まって見えると「壊れた」と受け取られるため、
 * ドット絵のロボットにお辞儀させて、待ち時間であることを明示しています。
 *
 * - 画像を使わないので、この待機画面自体の読み込みは一瞬で終わります
 *   （ロボットはSVGの矩形。すでに読み込み済みの部品を使い回しています）。
 * - `prefers-reduced-motion` ではお辞儀を止めます（CSS側で対応）。
 */
export function DemoBootScreen({ label }: { label: string }) {
  return (
    <div
      className="panel grid min-h-[420px] place-items-center p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <div>
        <div className="demo-boot-bow mx-auto w-24 sm:w-28">
          <MascotFace className="w-full" />
        </div>

        <p className="font-display mt-6 text-[10px] tracking-[0.3em] text-brand-light">
          LOADING…
        </p>
        <p className="mt-3 text-base font-bold text-white">
          {ja("デモサイトは")}
          <span className="text-brand-light">{ja("読み込みに時間がかかる")}</span>
          {ja("場合があります")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {ja(`いま「${label}」を読み込んでいます。少しだけお待ちください。`)}
        </p>

        {/* 進行中であることを示す不定形のバー（進捗率は分からないので割合は出さない） */}
        <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <span className="demo-boot-bar block h-full w-1/3 rounded-full bg-gradient-to-r from-brand to-violet-400" />
        </div>
      </div>
    </div>
  );
}
