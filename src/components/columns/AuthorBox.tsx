import Link from "next/link";

import { author, authorDisplayName } from "@/lib/author";
import { siteConfig } from "@/lib/site";
import { Icon } from "@/components/ui/icons";
import { CompanyLogo } from "@/components/site/CompanyLogo";
import { ja } from "@/lib/typography";

/**
 * 記事の署名欄（E-E-A-T）。
 *
 * 「誰が書いたか」と「なぜその人が書けるのか」を、記事の中に見える形で置きます。
 * 構造化データ（Article の author / publisher）と同じ内容にしているので、
 * 表示と機械可読データが食い違いません。
 */
export function AuthorBox() {
  return (
    <aside className="panel panel-corners p-6 sm:p-7" data-reveal>
      <p className="eyebrow mb-4">Author</p>

      <div className="flex flex-wrap items-center gap-4">
        <span className="shrink-0">
          <CompanyLogo className="size-14" alt="" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold text-white">
            {ja(authorDisplayName)}
            {author.personName ? (
              <span className="ml-2 text-sm font-normal text-slate-400">
                {ja(author.personRole)}
              </span>
            ) : null}
          </p>
          <p className="text-sm text-brand-light">
            {ja(
              `${siteConfig.contact.address.region}${siteConfig.contact.address.locality}／AI活用のWeb制作・組み込みソフトウェア開発`,
            )}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-slate-400">{ja(author.bio)}</p>

      <dl className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
        {author.credentials.map((c) => (
          <div key={c.label} className="min-w-0">
            <dt className="text-xs tracking-wider text-slate-500">{ja(c.label)}</dt>
            <dd className="mt-0.5 text-sm text-slate-300">
              <Link
                prefetch={false}
                href={c.href}
                className="transition-colors hover:text-brand-light"
              >
                {ja(c.value)}
              </Link>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 flex items-start gap-2 border-t border-white/10 pt-5 text-xs leading-relaxed text-slate-500">
        <Icon name="shield" className="mt-0.5 size-3.5 shrink-0 text-slate-600" />
        <span className="min-w-0">
          {ja(
            "記事中の数値は、当社が自社サイトを含む実際の制作で計測したものです。条件が変われば結果も変わるため、参考値としてお読みください。",
          )}
        </span>
      </p>
    </aside>
  );
}
