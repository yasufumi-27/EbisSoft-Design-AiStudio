"use client";

import Link from "next/link";

import { BASE_NODES, DEMO_META, OUTCOME_NOTE, type Industry } from "@/lib/showcase";
import { demoPropsFor } from "@/lib/demoProps";
import { LazyDemo } from "@/components/showcase/LazyDemo";
import { Icon } from "@/components/ui/icons";
import { ja } from "@/lib/typography";

/**
 * 職種別デモサイトの本体。
 *
 * 静的に用意した18職種（`/showcase/<slug>`）と、
 * その場で組み立てた職種（`/showcase/generate`）の**両方が同じ部品**を使います。
 * 生成側と既製側で見え方が変わらないので、「自動生成でもここまでできる」が伝わります。
 *
 * デモ本体は `LazyDemo` が持っていて、**起動ボタンを押すまで読み込みません**。
 */

export function ShowcaseBody({
  industry,
  generated = false,
  chatbotFaq,
}: {
  industry: Industry;
  /** その場で組み立てた職種のときに true（生成物であることを明示する） */
  generated?: boolean;
  /** その職種のデモサイトに載せているQ&A（チャットボットの知識源に使う） */
  chatbotFaq?: { q: string; a: string }[];
}) {
  return (
    <div className="space-y-16 sm:space-y-20">
      {/* ---------- 課題と狙う効果 ---------- */}
      <section aria-labelledby="sc-challenges">
        <p className="eyebrow">Challenges</p>
        <h2 id="sc-challenges" className="ai-linklist-title">
          {ja(`${industry.name}でよくある課題`)}
        </h2>
        <p className="mt-3 text-sm text-slate-400">{ja(`想定：${industry.customer}`)}</p>

        <div className="ai-facts mt-8">
          {industry.challenges.map((c, i) => (
            <article key={c}>
              <span>ISSUE_0{i + 1}</span>
              <p>{ja(c)}</p>
            </article>
          ))}
        </div>

        <div className="ai-facts mt-5">
          {industry.outcomes.map((o) => (
            <article key={o.label}>
              <span>{ja(o.label)}</span>
              <b>{ja(o.value)}</b>
            </article>
          ))}
        </div>
        {/* 誇張しないための注記。数値を実績として見せないこと */}
        <p className="mt-4 text-xs leading-relaxed text-slate-500">{ja(OUTCOME_NOTE)}</p>
      </section>

      {/* ---------- この職種での使い方（デモつき） ---------- */}
      <section aria-labelledby="sc-picks">
        <p className="eyebrow">How to use</p>
        <h2 id="sc-picks" className="ai-linklist-title">
          {ja(`${industry.name}なら、この機能をこう使えます`)}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          {ja(
            "それぞれ実際に動くデモを用意しています。ページを軽く保つため、起動ボタンを押したときに初めて読み込みます。",
          )}
        </p>

        <div className="mt-10 space-y-10">
          {industry.picks.map((p) => (
            <LazyDemo
              key={p.demo}
              slug={p.demo}
              title={p.title}
              scene={p.scene}
              effect={p.effect}
              demoProps={demoPropsFor(p.demo, industry, chatbotFaq)}
            />
          ))}
        </div>
      </section>

      {/* ---------- 職種に合わせた設定内容（生成結果の可視化） ---------- */}
      <section aria-labelledby="sc-config">
        <p className="eyebrow">Configuration</p>
        <h2 id="sc-config" className="ai-linklist-title">
          {ja(generated ? "この職種向けに組み立てた設定" : "この職種に合わせている設定")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          {ja(
            "デモは共通の仕組みですが、扱うデータは職種に合わせて差し替えています。上のデモの中で実際に使われている内容です。",
          )}
        </p>

        <div className="ai-facts ai-facts-2 mt-8">
          <article>
            <span>3D / 表示する対象</span>
            <b>{ja(industry.product.name)}</b>
            <p>{ja(industry.product.note)}</p>
          </article>

          <article>
            <span>連携先システム</span>
            <ul>
              {[...BASE_NODES, ...industry.systems].map((s) => (
                <li key={s.key}>{ja(s.label)}</li>
              ))}
            </ul>
          </article>

          <div className="panel overflow-hidden lg:col-span-2">
            <p className="eyebrow px-6 pt-6 pb-4">扱うデータ（システム連携デモの中身）</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-y border-brand/20">
                    <th className="px-6 py-2.5 font-bold text-brand-light">名称</th>
                    <th className="px-4 py-2.5 font-bold text-brand-light">区分</th>
                    <th className="px-4 py-2.5 text-right font-bold text-brand-light">金額</th>
                    <th className="px-6 py-2.5 text-right font-bold text-brand-light">在庫・枠</th>
                  </tr>
                </thead>
                <tbody>
                  {industry.catalog.map((c) => (
                    <tr key={c.sku} className="border-b border-brand/12 last:border-0">
                      <td className="px-6 py-2.5 text-white">{ja(c.name)}</td>
                      <td className="px-4 py-2.5 text-slate-400">{ja(c.category)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-300">
                        {c.price > 0 ? `¥${c.price.toLocaleString("ja-JP")}` : "—"}
                      </td>
                      <td
                        className={`px-6 py-2.5 text-right tabular-nums ${
                          c.stock === 0 ? "text-rose-300" : "text-slate-300"
                        }`}
                      >
                        {c.stock === 0 ? "在庫なし" : c.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 併せて効く機能 ---------- */}
      <section aria-labelledby="sc-also">
        <h2 id="sc-also" className="text-2xl font-bold text-white sm:text-3xl">
          {ja("併せて効く機能")}
        </h2>
        <p className="mt-3 text-sm text-slate-400">
          {ja("こちらは機能ごとの詳しいデモページで確認できます。")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {industry.alsoUseful.map((d) => (
            <Link
              prefetch={false}
              key={d}
              href={`/demo/${d}`}
              className="panel panel-hover flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300"
            >
              <Icon name={DEMO_META[d].icon} className="size-4 shrink-0 text-brand" />
              <span className="min-w-0">
                <span className="font-bold text-white">{ja(DEMO_META[d].label)}</span>
                <span className="ml-2 text-xs text-slate-500">{ja(DEMO_META[d].summary)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
