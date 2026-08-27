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
        <h2 id="sc-challenges" className="text-2xl font-bold text-white sm:text-3xl">
          {ja(`${industry.name}でよくある課題`)}
        </h2>
        <p className="mt-3 text-sm text-slate-400">{ja(`想定：${industry.customer}`)}</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {industry.challenges.map((c) => (
            <div key={c} className="panel flex gap-3 p-5">
              <Icon name="bolt" className="mt-0.5 size-4 shrink-0 text-rose-300" />
              <p className="min-w-0 text-sm leading-relaxed text-slate-300">{ja(c)}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {industry.outcomes.map((o) => (
            <div key={o.label} className="panel panel-corners p-5">
              <p className="text-xs tracking-wider text-slate-500">{ja(o.label)}</p>
              <p className="mt-1.5 font-bold text-brand-light">{ja(o.value)}</p>
            </div>
          ))}
        </div>
        {/* 誇張しないための注記。数値を実績として見せないこと */}
        <p className="mt-4 text-xs leading-relaxed text-slate-500">{ja(OUTCOME_NOTE)}</p>
      </section>

      {/* ---------- この職種での使い方（デモつき） ---------- */}
      <section aria-labelledby="sc-picks">
        <h2 id="sc-picks" className="text-2xl font-bold text-white sm:text-3xl">
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
        <h2 id="sc-config" className="text-2xl font-bold text-white sm:text-3xl">
          {ja(generated ? "この職種向けに組み立てた設定" : "この職種に合わせている設定")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          {ja(
            "デモは共通の仕組みですが、扱うデータは職種に合わせて差し替えています。上のデモの中で実際に使われている内容です。",
          )}
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="panel p-6">
            <p className="eyebrow mb-4">3D / 表示する対象</p>
            <p className="font-bold text-white">{ja(industry.product.name)}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{ja(industry.product.note)}</p>
          </div>

          <div className="panel p-6">
            <p className="eyebrow mb-4">連携先システム</p>
            <ul className="space-y-2">
              {[...BASE_NODES, ...industry.systems].map((s) => (
                <li key={s.key} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Icon name={s.icon} className="size-4 shrink-0 text-brand" />
                  <span className="min-w-0">{ja(s.label)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel overflow-hidden lg:col-span-2">
            <p className="eyebrow px-6 pt-6 pb-4">扱うデータ（システム連携デモの中身）</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-y border-white/10">
                    <th className="px-6 py-2.5 font-bold text-brand-light">名称</th>
                    <th className="px-4 py-2.5 font-bold text-brand-light">区分</th>
                    <th className="px-4 py-2.5 text-right font-bold text-brand-light">金額</th>
                    <th className="px-6 py-2.5 text-right font-bold text-brand-light">在庫・枠</th>
                  </tr>
                </thead>
                <tbody>
                  {industry.catalog.map((c) => (
                    <tr key={c.sku} className="border-b border-white/5 last:border-0">
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
