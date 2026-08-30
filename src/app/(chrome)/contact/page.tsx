import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/ui/Studio";
import { InquiryForm } from "@/components/sections/InquiryForm";

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

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          // 問い合わせ窓口のページであることを型で明示する（ContactPage）
          webPageJsonLd({
            path: "/contact",
            name: `${title}｜${siteConfig.name}`,
            description,
            type: "ContactPage",
          }),
          breadcrumbJsonLd(crumbs),
        ]}
      />

      <Breadcrumbs items={crumbs} />

      <PageHero
        kicker="Contact"
        figure="contact-hero"
        title={
          <>
            書けるところだけ、
            <br />
            書いて<em>ください</em>。
          </>
        }
        lead="選択項目はすべて「ざっくりの想定」で構いません。分からない項目は空欄のままで大丈夫です。"
        actions={[{ href: "#form", label: "フォームへ進む", primary: true }]}
        note="初回相談・お見積もり無料／2営業日以内にご返信"
      />

      {/* フォーム本体。連絡先の並記と送信後の案内もこの中に含まれる */}
      <div id="form" className="scroll-mt-20">
        <InquiryForm />
      </div>
    </>
  );
}
