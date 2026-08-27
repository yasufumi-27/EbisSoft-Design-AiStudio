import Link from "next/link";
import { SmartLink } from "@/components/ui/SmartLink";
import { siteConfig } from "@/lib/site";
import { nav, subNav } from "@/lib/nav";
import { capabilities } from "@/lib/content";
import { Logo } from "@/components/site/Logo";
import { Icon } from "@/components/ui/icons";
import { ja } from "@/lib/typography";

const year = new Date().getFullYear();

/**
 * サイト共通フッター。所在地・対応エリア・所属団体を明記しローカルSEOに対応。
 * 電話番号とメールアドレスは、お問い合わせ導線（ContactCta / /contact）に集約しています。
 */
export function SiteFooter() {
  const { contact } = siteConfig;

  return (
    <footer className="relative border-t border-white/5 bg-ink-2/80 text-slate-300 backdrop-blur-md">
      {/* 上辺の発光ライン */}
      <div aria-hidden className="divider-glow absolute inset-x-0 top-0" />

      <div className="gutter-x mx-auto w-full max-w-6xl py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* ブランド */}
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              {ja(siteConfig.legalName)}は、{ja(siteConfig.contact.address.locality)}
              {ja("のAI活用型Web制作・組み込みソフトウェア開発事業者です（")}
              {ja(siteConfig.memberOf.map((m) => m.name).join("・"))}
              {ja(
                "所属）。生成AIを制作フローに組み込み、最速で高性能なサイトを構築。3DCG・AIチャットボット・システム連携から、マイコン・IoT機器の開発まで対応します。",
              )}
            </p>
          </div>

          {/* サイトメニュー */}
          <nav className="lg:col-span-3" aria-label="フッターナビゲーション">
            <h2 className="font-display text-xs font-bold tracking-[0.3em] text-brand uppercase">
              Menu
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {nav.map((item) => (
                <li key={item.href}>
                  <SmartLink
                    href={item.href}
                    className="text-slate-400 transition-colors hover:text-brand-light"
                  >
                    {item.label}
                  </SmartLink>
                </li>
              ))}
              {subNav.map((item) => (
                <li key={item.href}>
                  <Link
                    prefetch={false}
                    href={item.href}
                    className="text-slate-400 transition-colors hover:text-brand-light"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="font-display mt-8 text-xs font-bold tracking-[0.3em] text-brand uppercase">
              Demo
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link prefetch={false} href="/demo" className="text-slate-400 transition-colors hover:text-brand-light">
                  できること一覧
                </Link>
              </li>
              {capabilities.map((c) => (
                <li key={c.slug}>
                  {/* フッターは全ページに出るため、ここからの先読みは行わない
                      （15ページ分のRSCペイロードを毎回取得すると通信量が跳ね上がる） */}
                  <Link
                    prefetch={false}
                    href={`/demo/${c.slug}`}
                    className="text-slate-400 transition-colors hover:text-brand-light"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 会社情報・NAP */}
          <div className="lg:col-span-4">
            <h2 className="font-display text-xs font-bold tracking-[0.3em] text-brand uppercase">
              Company
            </h2>
            <address className="mt-4 space-y-3 text-sm text-slate-400 not-italic">
              <p className="font-medium text-slate-200">{siteConfig.legalName}</p>
              <p className="flex items-start gap-2.5">
                <Icon name="pin" className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>
                  〒{contact.address.postalCode}
                  <br />
                  {contact.address.region}
                  {ja(contact.address.locality)}
                  {ja(contact.address.street)}
                </span>
              </p>
              <p className="flex items-start gap-2.5">
                <Icon name="globe" className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>{ja(siteConfig.areaServed)}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Icon name="award" className="size-4 shrink-0 text-gold" />
                <span>{ja(siteConfig.memberOf.map((m) => m.name).join("・") + "所属")}</span>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 sm:flex-row">
          <p className="font-display tracking-widest">
            © {year} {siteConfig.legalName}
          </p>
          <ul className="flex flex-wrap justify-center gap-6">
            <li>
              <Link prefetch={false} href="/company" className="transition-colors hover:text-slate-300">
                会社概要
              </Link>
            </li>
            <li>
              <Link prefetch={false} href="/privacy" className="transition-colors hover:text-slate-300">
                プライバシーポリシー
              </Link>
            </li>
            <li>
              {/* ページではなくテキストファイルのため、next/link を使わず basePath を明示的に付与 */}
              <a
                href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/llms.txt`}
                className="transition-colors hover:text-slate-300"
              >
                llms.txt
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
