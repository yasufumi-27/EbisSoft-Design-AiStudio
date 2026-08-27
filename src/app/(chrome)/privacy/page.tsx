import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { Section } from "@/components/ui/Section";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ja } from "@/lib/typography";

const title = "プライバシーポリシー";
const description = `${siteConfig.legalName}における個人情報の取り扱い、利用目的、第三者提供、アクセス解析ツールの利用についてご説明します。`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const crumbs = [
  { name: "ホーム", path: "/" },
  { name: "プライバシーポリシー", path: "/privacy" },
];

const { contact } = siteConfig;

const sections: { heading: string; body: string[] }[] = [
  {
    heading: "1. 個人情報の定義",
    body: [
      "本ポリシーにおける「個人情報」とは、個人情報の保護に関する法律に定める個人情報、すなわち生存する個人に関する情報であって、氏名・生年月日・その他の記述等により特定の個人を識別できるもの（他の情報と容易に照合でき、それにより特定の個人を識別できるものを含みます）を指します。",
    ],
  },
  {
    heading: "2. 取得する情報",
    body: [
      "当社は、お問い合わせフォームのご利用時に、お名前・会社名・メールアドレス・電話番号・お問い合わせ内容などをご入力いただく場合があります。",
      "また、サイトの利用状況を把握するため、アクセス解析ツールを通じて、ブラウザの種類・参照元URL・閲覧ページ・IPアドレス等の情報を自動的に取得することがあります。これらの情報に個人を特定する情報は含まれません。",
    ],
  },
  {
    heading: "3. 利用目的",
    body: [
      "取得した個人情報は、以下の目的で利用します。",
      "（1）お問い合わせ・ご相談への回答、お見積もりのご提示のため\n（2）ご契約いただいた業務の遂行、および関連するご連絡のため\n（3）サービスの品質向上、およびWebサイトの改善のため\n（4）法令に基づく対応のため",
    ],
  },
  {
    heading: "4. 第三者への提供",
    body: [
      "当社は、次の場合を除き、あらかじめご本人の同意を得ることなく個人情報を第三者に提供しません。",
      "（1）法令に基づく場合\n（2）人の生命・身体・財産の保護のために必要があり、ご本人の同意を得ることが困難な場合\n（3）業務の遂行に必要な範囲で、機密保持義務を課した委託先に提供する場合",
    ],
  },
  {
    heading: "5. 生成AI・外部サービスの利用について",
    body: [
      "当社は制作業務において生成AIを活用していますが、お客様からお預かりした機密情報・個人情報を、学習に利用される設定の外部サービスへ入力することはありません。AIを利用する場合は、入力データが学習に利用されない設定・契約のサービスを使用します。",
      "AIチャットボット等をお客様のサイトに構築する場合は、利用するAIサービス、データの保存期間、学習利用の有無について、事前に明示のうえ合意いただきます。",
    ],
  },
  {
    heading: "6. アクセス解析ツールについて",
    body: [
      "当社サイトでは、サイトの利用状況を把握するために Google LLC が提供する Google アナリティクス（GA4）を利用しています。同ツールはCookieを使用してアクセス情報を収集しますが、収集される情報は匿名であり、個人を特定するものではありません。",
      "Cookieの無効化はブラウザの設定から行えます。また、Google が提供するオプトアウトアドオンを導入することでも収集を停止できます。収集される情報の取り扱いについては、Google のプライバシーポリシーをご確認ください。",
    ],
  },
  {
    heading: "7. 個人情報の管理",
    body: [
      "当社は、個人情報の漏えい・滅失・毀損を防止するため、通信の暗号化（常時SSL）をはじめとする必要かつ適切な安全管理措置を講じます。また、個人情報を取り扱う従業者および委託先に対して、必要かつ適切な監督を行います。",
    ],
  },
  {
    heading: "8. 開示・訂正・削除のご請求",
    body: [
      "ご本人から個人情報の開示・訂正・利用停止・削除をご希望の場合は、下記の窓口までご連絡ください。ご本人であることを確認のうえ、法令に従い速やかに対応します。",
    ],
  },
  {
    heading: "9. 本ポリシーの変更",
    body: [
      "当社は、法令の改正やサービス内容の変更に応じて、本ポリシーを予告なく変更することがあります。変更後の内容は、本ページに掲載した時点から効力を生じるものとします。",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/privacy",
            name: `${title}｜${siteConfig.name}`,
            description,
          }),
          breadcrumbJsonLd(crumbs),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHeader
        eyebrow="Privacy Policy"
        title="プライバシーポリシー"
        lead={`${siteConfig.legalName}（以下「当社」）は、お客様の個人情報の重要性を認識し、以下のとおり個人情報保護方針を定め、その適切な取り扱いに努めます。`}
      />

      <Section>
        <div className="panel panel-corners mx-auto max-w-3xl p-7 sm:p-10" data-reveal>
          <div className="space-y-9">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-lg font-bold text-white">{ja(s.heading)}</h2>
                {s.body.map((p) => (
                  <p
                    key={p.slice(0, 20)}
                    className="mt-3 text-sm leading-relaxed whitespace-pre-line text-slate-400"
                  >
                    {ja(p)}
                  </p>
                ))}
              </section>
            ))}

            <section className="border-t border-white/10 pt-8">
              <h2 className="text-lg font-bold text-white">お問い合わせ窓口</h2>
              <address className="mt-3 space-y-1 text-sm leading-relaxed text-slate-400 not-italic">
                <p className="text-slate-200">{siteConfig.legalName}</p>
                <p>
                  〒{contact.address.postalCode} {contact.address.region}
                  {ja(contact.address.locality)}
                  {ja(contact.address.street)}
                </p>
                <p>
                  電話：
                  <a href={`tel:${contact.telephone}`} className="hover:text-brand-light">
                    {contact.telephoneDisplay}
                  </a>
                  （{contact.openingHoursDisplay}）
                </p>
                <p>
                  メール：
                  <a href={`mailto:${contact.email}`} className="hover:text-brand-light">
                    {contact.email}
                  </a>
                </p>
              </address>
            </section>
          </div>
        </div>
      </Section>
    </>
  );
}
