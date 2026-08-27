import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { inquiryNotes } from "@/lib/inquiry";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Icon } from "@/components/ui/icons";
import { InquiryForm } from "@/components/sections/InquiryForm";
import { ja } from "@/lib/typography";

const title = "お問い合わせ・無料相談";
const description =
  "エビスソフトへのご相談はこちらから。ご予算・ページ数・必要な機能を選択式でお伝えいただけます。分からない項目は空欄で構いません。初回のご相談・お見積もりは無料です。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/contact`,
    title: `${title}｜${siteConfig.name}`,
    description,
  },
};

const crumbs = [
  { name: "ホーム", path: "/" },
  { name: "お問い合わせ", path: "/contact" },
];

const { contact } = siteConfig;

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/contact",
            name: `${title}｜${siteConfig.name}`,
            description,
          }),
          breadcrumbJsonLd(crumbs),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        eyebrow="Contact"
        title={
          <>
            <span className="text-gradient">お問い合わせ</span>
          </>
        }
        lead="細かい仕様が決まっていなくても大丈夫です。ご予算は目安で構いません。実現方法と費用のすり合わせは、打ち合わせで一緒に行います。"
      >
        <ul className="mt-8 grid gap-2.5">
          {inquiryNotes.map((n) => (
            <li key={n} className="flex gap-2.5 text-sm text-slate-300">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-brand" />
              <span className="min-w-0">{ja(n)}</span>
            </li>
          ))}
        </ul>
      </PageHeader>

      <section className="pb-20 sm:pb-28">
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* フォーム本体 */}
            <div className="lg:col-span-2" data-reveal>
              <InquiryForm />
            </div>

            {/* 直接の連絡先・補足（サイドバー） */}
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" data-reveal>
              <div className="panel panel-corners p-6">
                <h2 className="text-base font-bold text-white">直接ご連絡いただいても</h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {ja("フォームが面倒な場合は、こちらへ直接どうぞ。")}
                </p>

                <a
                  href={`tel:${contact.telephone}`}
                  className="group mt-5 flex items-center gap-3 text-slate-200 transition-colors hover:text-white"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/5 transition-all group-hover:border-brand/50 group-hover:shadow-[0_0_16px_rgba(182, 126, 255,0.3)]">
                    <Icon name="phone" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] text-slate-500">お電話</span>
                    <span className="font-display block text-base font-bold tracking-wide">
                      {contact.telephoneDisplay}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {contact.openingHoursDisplay}
                    </span>
                  </span>
                </a>

                <a
                  href={`mailto:${contact.email}`}
                  className="group mt-4 flex items-center gap-3 text-slate-200 transition-colors hover:text-white"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/5 transition-all group-hover:border-brand/50 group-hover:shadow-[0_0_16px_rgba(182, 126, 255,0.3)]">
                    <Icon name="mail" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] text-slate-500">メール</span>
                    <span className="block truncate text-sm font-bold">{contact.email}</span>
                  </span>
                </a>
              </div>

              <div className="panel p-6">
                <h2 className="text-base font-bold text-white">ご相談後の流れ</h2>
                <ol className="mt-4 space-y-4">
                  {[
                    ["2営業日以内にご返信", "内容を拝見し、確認したい点をお送りします。"],
                    ["オンラインで打ち合わせ", "30〜60分。目的と優先順位をすり合わせます。"],
                    ["構成案とお見積もり", "予算内に収める案もあわせてご提示します。"],
                  ].map(([t, b], i) => (
                    <li key={t} className="flex gap-3">
                      <span className="font-display grid size-6 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/10 text-[11px] font-bold text-brand-light">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-white">{ja(t)}</span>
                        <span className="block text-xs text-slate-500">{ja(b)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-500">
                  {ja("ここまですべて無料です。お見積もりの内容にご納得いただけない場合、お断りいただいて構いません。")}
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
