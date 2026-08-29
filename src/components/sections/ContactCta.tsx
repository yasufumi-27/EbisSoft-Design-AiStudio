import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/icons";
import { siteConfig } from "@/lib/site";
import { ja } from "@/lib/typography";

const benefits = [
  "初回相談・お見積もりは無料",
  "選択式なので、入力は1〜2分",
  "予算は目安でOK。後から一緒に調整",
];

/**
 * トップページの最終CTA。
 * フォームは専用ページ（/contact）に置き、ここは遷移ボタンに徹する。
 * 長いフォームをトップに置くとページが重く読みにくくなるため、
 * 「相談する気になった人だけ」が次の画面へ進む設計にしています。
 */
export function ContactCta() {
  const { contact } = siteConfig;
  return (
    <section id="contact" className="relative scroll-mt-20 overflow-hidden">
      <div aria-hidden className="divider-glow absolute inset-x-0 top-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(182,126,255,0.12),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-8%] bottom-0 -z-10 size-[30rem] rounded-full bg-gold/10 blur-3xl"
      />

      <Container className="py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center" data-reveal>
          <p className="eyebrow justify-center">Contact</p>

          <h2 className="mt-5 text-3xl leading-tight font-bold tracking-tight text-white sm:text-5xl">
            {ja("まずは、やりたいことだけ")}
            <br className="sm:hidden" />
            {ja("お聞かせください")}
          </h2>

          <p className="speakable mx-auto mt-6 max-w-xl leading-relaxed text-slate-300">
            {ja(
              "決まっているのが「なんとなくの方向性」だけでも大丈夫です。ご予算・ページ数・必要な機能は、選択式でざっくり選ぶだけ。",
            )}
          </p>

          <div className="mt-10">
            <Link
              prefetch={false}
              href="/contact"
              className="btn btn-primary inline-flex h-14 items-center px-10 text-base"
            >
              {ja("お問い合わせフォームへ")}
              <Icon name="arrowRight" className="size-5" />
            </Link>
            <p className="mt-4 text-sm text-slate-500">{ja("入力は1〜2分ほどで終わります")}</p>
          </div>

          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-ink">
                  <Icon name="check" className="size-3.5" />
                </span>
                <span className="min-w-0">{ja(b)}</span>
              </li>
            ))}
          </ul>

          {/* 電話・メール派のための直通導線 */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-brand/20 pt-8">
            <a
              href={`tel:${contact.telephone}`}
              className="flex items-center gap-2.5 text-slate-300 transition-colors hover:text-white"
            >
              <Icon name="phone" className="size-4 text-gold" />
              <span className="font-display text-base font-bold tracking-wide">
                {contact.telephoneDisplay}
              </span>
              <span className="text-xs text-slate-500">{contact.openingHoursDisplay}</span>
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2.5 text-slate-300 transition-colors hover:text-white"
            >
              <Icon name="mail" className="size-4 text-gold" />
              <span className="text-sm">{contact.email}</span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
