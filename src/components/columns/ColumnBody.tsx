import Link from "next/link";

import type { ColumnBlock } from "@/lib/columns";
import { Icon } from "@/components/ui/icons";
import { ja } from "@/lib/typography";

/**
 * コラム本文のレンダラー。
 *
 * 記事はサーバー側で組み立てるので、本文はすべて初期HTMLに含まれます
 * （AIクローラーはJavaScriptを実行しないことがあるため、本文をJSに載せない）。
 * H2 には id を振り、目次・URLのアンカー・構造化データから参照できるようにしています。
 */
export function ColumnBody({ blocks }: { blocks: ColumnBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ColumnBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          id={block.id}
          className="!mt-14 border-l-2 border-brand pl-4 text-2xl font-bold text-white sm:text-[1.7rem]"
        >
          {ja(block.text)}
        </h2>
      );

    case "h3":
      return <h3 className="!mt-10 text-lg font-bold text-white">{ja(block.text)}</h3>;

    case "p":
      // 本文の段落は、AIの抜き出し単位そのもの。speakable を付けて読み上げ対象にする
      return (
        <p className="speakable text-[15px] leading-[1.95] text-slate-300">{ja(block.text)}</p>
      );

    case "ul":
      return (
        <ul className="space-y-3">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-slate-300">
              <Icon name="check" className="mt-1.5 size-4 shrink-0 text-brand" />
              <span className="min-w-0">{ja(item)}</span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="space-y-4">
          {block.items.map((item, i) => (
            <li key={item.title} className="panel flex gap-4 p-5">
              <span className="font-display grid size-8 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/10 text-sm font-bold text-brand-light">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-white">{ja(item.title)}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{ja(item.body)}</p>
              </div>
            </li>
          ))}
        </ol>
      );

    case "table":
      return (
        <figure>
          {/* 狭い画面では表だけを横スクロールさせる（ページ本体は横に溢れさせない） */}
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              {block.caption ? (
                <caption className="px-5 pt-5 text-left text-xs text-slate-500">
                  {ja(block.caption)}
                </caption>
              ) : null}
              <thead>
                <tr className="border-b border-white/10">
                  {block.head.map((h) => (
                    <th key={h} className="px-5 py-3 font-bold text-brand-light">
                      {ja(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr key={row.join("|")} className="border-b border-white/5 last:border-0">
                    {row.map((cell, i) => (
                      <td
                        key={i}
                        className={`px-5 py-3 align-top ${
                          i === 0 ? "font-medium text-white" : "text-slate-300"
                        }`}
                      >
                        {ja(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );

    case "note":
      return (
        <aside className="panel panel-corners border-gold/20 bg-gold/[0.04] p-5">
          <p className="flex items-center gap-2 font-bold text-gold-light">
            <Icon name="shield" className="size-4 shrink-0" />
            <span className="min-w-0">{ja(block.title)}</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{ja(block.body)}</p>
        </aside>
      );

    case "link":
      return (
        <aside className="panel panel-hover p-5">
          <p className="text-sm leading-relaxed text-slate-400">{ja(block.body)}</p>
          <Link
            prefetch={false}
            href={block.href}
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-light hover:text-brand"
          >
            {ja(block.label)}
            <Icon name="arrowRight" className="size-4" />
          </Link>
        </aside>
      );
  }
}
