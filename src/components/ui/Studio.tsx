import type { ReactNode } from "react";
import Link from "next/link";

import { Figure, type FigureName } from "@/components/ui/Figure";
import { jaNode } from "@/lib/typography";

/**
 * 下層ページを組み立てるための部品。
 *
 * トップページ（`HomeReframed.tsx`）で決めた語彙を、そのまま下層でも使えるように
 * 切り出したものです。ページごとにレイアウトを考え直すのではなく、
 * **同じ4種類のブロックの並べ方だけを変える**ことで、サイト全体の統一を保ちます。
 *
 *   PageHero    … 画面いっぱいの入口。大きな見出し・短い一文・大きなボタン
 *   FlightList  … 01/02/03… の縦連続。左右交互に絵と文字を振る（トップと同じ）
 *   ModuleBoard … 1pxの隙間で連結した盤（トップの LIVE MODULES と同じ）
 *   StatRow     … 数字だけを大きく置く行
 *   ClosingCta  … 締めの一枚（トップの ai-final と同じ）
 *
 * 文章の量について：
 * この案は「余白と大きな文字」で語る設計なので、各ブロックの本文は
 * **2〜3行に収まる長さ**で書くこと。説明を足したくなったら、下層ページか
 * デモへのリンクに逃がす。ブロックの中に段落を積み上げない。
 */

/* ------------------------------------------------------------------ *
 * ページの入口
 * ------------------------------------------------------------------ */

export type HeroAction = { href: string; label: string; primary?: boolean };

/**
 * 下層ページの入口。トップのヒーローと同じ寸法・同じ間合いで、
 * 「英字ラベル → 大きな見出し → 一文 → 大きなボタン」だけを置きます。
 *
 * ここに要点や箇条書きを足さないこと。ページの中身は下のブロックが担当します。
 */
export function PageHero({
  kicker,
  title,
  lead,
  actions = [],
  figure,
  note,
}: {
  /** 英字ラベル（display フォント） */
  kicker: string;
  /** 大きな見出し。1〜2行で切れる長さにする */
  title: ReactNode;
  /** 一文だけのリード */
  lead?: ReactNode;
  actions?: HeroAction[];
  /** 右に置く図形。ページごとに固有のものを指定する（Figure.tsx） */
  figure: FigureName;
  /** ボタンの下に添える短い注記（任意） */
  note?: string;
}) {
  return (
    <section className="studio-hero">
      <div className="ai-stars" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <i key={i} />
        ))}
      </div>

      <div className="studio-hero-inner">
        <div className="studio-hero-copy">
          <p className="eyebrow">{kicker}</p>
          {/* ファーストビューは reveal を使わない（JSを待たずに描画してLCPを早める） */}
          <h1>{jaNode(title)}</h1>
          {lead ? <p className="speakable studio-hero-lead">{jaNode(lead)}</p> : null}

          {actions.length > 0 ? (
            <div className="studio-actions">
              {actions.map((a) => (
                <Link
                  key={a.href + a.label}
                  href={a.href}
                  className={`ai-btn ${a.primary ? "ai-btn-solid" : "ai-btn-line"} studio-btn-lg`}
                >
                  {a.label} <span aria-hidden>↗</span>
                </Link>
              ))}
            </div>
          ) : null}

          {note ? <p className="studio-hero-note">{note}</p> : null}
        </div>

        <Figure name={figure} className="studio-hero-art" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 01/02/03… の縦連続
 * ------------------------------------------------------------------ */

export type FlightItem = {
  /** 英字の小見出し（OBSERVE / PROTOTYPE …） */
  en: string;
  /** 大きな見出し。1〜2行 */
  title: string;
  /** 2〜3行の説明 */
  body: string;
  /** 続きを読ませる先（任意） */
  href?: string;
  more?: string;
  /** この段の図形。段ごとに違う形にする（使い回さない） */
  figure: FigureName;
};

/**
 * トップの ONE CONTINUOUS FLIGHT と同じ縦連続。
 * 左右交互に絵と文字を振り、番号を追って読ませます。
 */
export function FlightList({
  label,
  count,
  items,
}: {
  /** 左上の英字ラベル */
  label: string;
  /** 右上に出す進行表示（省略すると 01—0N を自動で作る） */
  count?: string;
  items: FlightItem[];
}) {
  return (
    <section className="ai-flight studio-flight">
      <header>
        <span>{label}</span>
        <b>{count ?? `SCROLL / 01—0${items.length}`}</b>
      </header>
      {items.map((item, i) => (
        <article key={item.title} data-reveal>
          <Figure name={item.figure} />
          <div>
            <p className="ai-flight-label">
              <b>{String(i + 1).padStart(2, "0")}</b>
              {item.en}
            </p>
            <h2>{jaNode(item.title)}</h2>
            <p>{jaNode(item.body)}</p>
            {item.href ? (
              <Link href={item.href} className="ai-flight-more">
                {item.more ?? "くわしく見る"} <span aria-hidden>↗</span>
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * モジュール盤
 * ------------------------------------------------------------------ */

export type ModuleItem = {
  /** セルの見出し（短く） */
  title: string;
  /** 1行の補足 */
  note?: string;
  href?: string;
};

/**
 * 1pxの隙間で連結した盤。隙間の紫がそのまま罫線に見えます。
 * 一覧をカードで散らかさず、一枚の計器盤として見せるためのブロック。
 */
export function ModuleBoard({
  label,
  title,
  lead,
  items,
  prefix = "MOD",
}: {
  label: string;
  title: ReactNode;
  lead?: string;
  items: ModuleItem[];
  /** セル左上の英字（MOD_01 / SVC_01 など） */
  prefix?: string;
}) {
  return (
    <section className="ai-console studio-board">
      <div data-reveal>
        <p className="ai-console-label">{label}</p>
        <h2>{jaNode(title)}</h2>
        {lead ? <p>{jaNode(lead)}</p> : null}
      </div>
      <div className="ai-console-grid" data-reveal>
        {items.map((m, i) => {
          const cell = (
            <article>
              <span>
                {prefix}_{String(i + 1).padStart(2, "0")}
              </span>
              <i aria-hidden />
              <b>{jaNode(m.title)}</b>
              <small>{m.note ?? "READY"}</small>
            </article>
          );
          return m.href ? (
            <Link key={m.title} href={m.href}>
              {cell}
            </Link>
          ) : (
            <div key={m.title}>{cell}</div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 数字の行
 * ------------------------------------------------------------------ */

/** 大きな数字だけを並べる行。説明は1語だけ添える。 */
export function StatRow({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section className="studio-stats" data-reveal>
      {items.map((s) => (
        <div key={s.label}>
          <b>{s.value}</b>
          <span>{s.label}</span>
        </div>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 締め
 * ------------------------------------------------------------------ */

/** ページの締め。トップの ai-final と同じ形で、次の一歩だけを置く。 */
export function ClosingCta({
  title,
  lead,
  action,
  secondary,
}: {
  title: ReactNode;
  lead?: string;
  action: HeroAction;
  secondary?: HeroAction;
}) {
  return (
    <section className="ai-final studio-final">
      <div className="chrome-core mini" aria-hidden>
        <i />
        <i />
      </div>
      <h2>{jaNode(title)}</h2>
      {lead ? <p>{lead}</p> : null}
      <div className="studio-actions">
        <Link href={action.href} className="ai-btn ai-btn-solid studio-btn-lg">
          {action.label} <span aria-hidden>↗</span>
        </Link>
        {secondary ? (
          <Link href={secondary.href} className="ai-btn ai-btn-line studio-btn-lg">
            {secondary.label} <span aria-hidden>↗</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
