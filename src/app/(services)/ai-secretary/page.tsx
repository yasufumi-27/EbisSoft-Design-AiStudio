import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { CompanyLogo } from "@/components/site/CompanyLogo";
import { breadcrumbJsonLd, faqJsonLd, webPageJsonLd } from "@/lib/jsonld";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { socialMetadata } from "@/lib/socialMetadata";
import { secretaryFaqs, secretaryTasks, secretaryPricing, secretaryInitialYen, secretaryInitialLabel, secretaryMonthlyLabel } from "@/lib/ai-secretary";
import styles from "./secretary.module.css";

const title = "AI秘書の開発・導入｜社長秘書の業務をAIで支援";
const description = `AI秘書の開発・導入は初期費用の目安${secretaryInitialLabel}〜、運用保守は月額${secretaryMonthlyLabel}（いずれも税別）。朝の報告・日程調整・議事録と宿題の整理の3機能を基本構成に含みます。御社の業務に合わせて、連携・権限・承認まで設計するエビスソフトのAI秘書サービス。`;
const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const href = (path: string) => `${prefix}${path}`;
const crumbs = [{ name: "ホーム", path: "/" }, { name: "AI秘書", path: "/ai-secretary" }];

export const metadata: Metadata = {
  title, description,
  keywords: ["AI秘書", "秘書 AI", "AI社長秘書", "AI秘書 開発", "AI秘書 導入", "秘書業務 AI", "AI秘書 費用"],
  alternates: { canonical: absoluteUrl("/ai-secretary") },
  openGraph: { ...socialMetadata.openGraph, type: "website", url: absoluteUrl("/ai-secretary"), title: `${title}｜${siteConfig.name}`, description },
  twitter: { ...socialMetadata.twitter, title: `${title}｜${siteConfig.name}`, description },
};

export default function SecretaryPage() {
  return (
    <div className={styles.page}>
      <JsonLd data={[
        webPageJsonLd({ path: "/ai-secretary", name: `${title}｜${siteConfig.name}`, description }),
        breadcrumbJsonLd(crumbs), faqJsonLd(secretaryFaqs),
        { "@context": "https://schema.org", "@type": "Service", "@id": `${absoluteUrl("/ai-secretary")}#service`, name: "AI秘書の開発・導入", serviceType: "AI秘書・AI社長秘書の受託開発", description, url: absoluteUrl("/ai-secretary"), provider: { "@type": "Organization", name: siteConfig.legalName, url: siteConfig.homeUrl }, areaServed: "日本", offers: [
          { "@type": "Offer", name: "初期費用（3機能の基本構成）", priceSpecification: { "@type": "PriceSpecification", minPrice: secretaryInitialYen, priceCurrency: "JPY", valueAddedTaxIncluded: false }, description: "朝の報告・日程調整・議事録と宿題の整理。1人分、メール・カレンダー各1サービスを想定した概算。正式見積もりは連携範囲を確認して提示。", url: `${absoluteUrl("/ai-secretary")}#cost` },
          { "@type": "Offer", name: "運用保守（月額）", priceSpecification: { "@type": "UnitPriceSpecification", price: secretaryPricing.monthlyMaintenanceYen, priceCurrency: "JPY", valueAddedTaxIncluded: false, unitText: "月" }, description: "運用保守の月額費用。追加開発・AIや外部サービスの利用料は別途。" },
        ], availableChannel: { "@type": "ServiceChannel", serviceUrl: absoluteUrl("/contact") } },
      ]} />
      <a className={styles.skip} href="#main">本文へ移動する</a>
      <header className={styles.header}>
        <a href={href("/")} className={styles.brand} aria-label="YEBISU SOFT（エビスソフト）ホームへ"><CompanyLogo alt="" /><span>YEBISU <b>SOFT</b></span></a>
        <nav aria-label="サービスナビゲーション"><a href={href("/ai")}>AI活用</a><a href={href("/company")}>会社概要</a><a className={styles.headerCta} href={href("/contact")}>無料で相談する <span aria-hidden="true">↗</span></a></nav>
      </header>
      <main id="main">
        <nav className={styles.crumbs} aria-label="パンくず"><a href={href("/")}>ホーム</a><span aria-hidden="true">/</span><span aria-current="page">AI秘書</span></nav>
        <section className={styles.hero} aria-labelledby="secretary-title">
          <div>
            <p className={styles.eyebrow}>YOUR WORK, WITH AI</p>
            <h1 id="secretary-title">AI秘書で、<br /><span>仕事に余白を。</span></h1>
            <p className={styles.heroLead}>朝の確認、メール、会議の準備。<br />毎日の細かな仕事を、御社に合ったAI秘書が支える。</p>
            <p className={styles.heroText}>社長専属の秘書から、社員の業務サポートまで。使っているツールと仕事の進め方に合わせて、AI秘書を設計・開発します。</p>
            <div className={styles.actions}><a className={styles.primary} href={href("/contact")}>AI秘書の導入を相談する <span aria-hidden="true">↗</span></a><a className={styles.secondary} href="#use-cases">できることを見る <span aria-hidden="true">↓</span></a></div>
            <p className={styles.note}>初回相談・お見積もり無料 ／ オンライン相談対応</p>
            <p className={styles.heroPrice}><a href="#cost">初期費用の目安 {secretaryInitialLabel}〜 ／ 運用保守 月額{secretaryMonthlyLabel}</a><small>税別・AI等の利用料は別途</small></p>
          </div>
          <aside className={styles.brief} aria-label="AI秘書の朝の報告イメージ">
            <div className={styles.briefTop}><span>YOUR DAILY BRIEF</span><span className={styles.status}>確認用</span></div>
            <p className={styles.briefGreeting}>おはようございます。<br /><strong>今日の要点を、まとめました。</strong></p>
            <ol className={styles.timeline}><li><time>09:30</time><div><b>チームミーティング</b><span>前回の決定事項を確認</span></div></li><li><time>13:00</time><div><b>A社との商談</b><span>共有資料と確認事項を整理</span></div></li><li><time>16:00</time><div><b>提案書の確認</b><span>担当者からの判断待ち事項</span></div></li></ol>
            <div className={styles.draft}><span>メールの返信案</span><p>日程調整の候補を用意しました。<br /><b>送信前に内容をご確認ください。</b></p><span className={styles.approval}>担当者の承認待ち</span></div>
            <p className={styles.sample}>導入検討用の画面イメージ・架空データ</p>
          </aside>
        </section>
        <div className={styles.toc}><span>このページで分かること</span><a href="#about">AI秘書とは</a><a href="#use-cases">できること</a><a href="#executive">社長秘書</a><a href="#design">安全な設計</a><a href="#cost">費用・導入</a><a href="#faq">FAQ</a></div>
        <section id="about" className={styles.section}>
          <p className={styles.eyebrow}>WHAT IS AN AI SECRETARY?</p><h2>AI秘書とは？<br /><span>情報を、次の行動につなぐ仕組み。</span></h2>
          <p className={`${styles.intro} speakable`}>AI秘書は、メール・予定・議事録・社内資料をもとに、情報の整理、検索、下書きを支援する仕組みです。秘書業務にAIを取り入れ、確認や準備にかかる手間を減らすことを目指します。</p>
          <div className={styles.three}><article><span>01 / CONTEXT</span><h3>業務を理解する</h3><p>参照してよい情報と、仕事の進め方を整理します。</p></article><article><span>02 / SUPPORT</span><h3>要点をまとめる</h3><p>必要な情報、候補、下書きを確認しやすい形にします。</p></article><article><span>03 / APPROVAL</span><h3>人が決める</h3><p>重要な判断や外部への送信は、担当者が確認します。</p></article></div>
        </section>
        <section id="use-cases" className={styles.section}>
          <p className={styles.eyebrow}>WHAT YOUR AI SECRETARY CAN DO</p><h2>AI秘書に任せたい、<br /><span>6つの仕事。</span></h2><p className={styles.intro}>必要な機能を選び、ひとつの業務から試せます。連携先・権限・データの準備状況を確認して、実現する範囲を決めます。</p>
          <div className={styles.taskGrid}>{secretaryTasks.map(task => <article key={task.number}><span className={styles.number}>{task.number}</span><h3>{task.title}</h3><span className={styles.planTag}>{secretaryPricing.includedTaskNumbers.some(number => number === task.number) ? "基本構成に含む" : "追加機能・別途見積もり"}</span><p>{task.body}</p><small>{task.output}</small></article>)}</div>
        </section>
        <section id="executive" className={`${styles.section} ${styles.executive}`}>
          <div><p className={styles.eyebrow}>AI EXECUTIVE ASSISTANT</p><h2>社長のそばに、<br /><span>専属のAI秘書を。</span></h2></div>
          <div><p>複数の画面を開いて予定を確認し、メールを読み、会議の記録を探す。その準備をAI社長秘書が支えて、経営判断と人に会う時間をつくります。</p><ul><li>朝の予定と重要メールを、ひとつの報告に</li><li>商談前に、前回のやり取りと確認事項を整理</li><li>指示・担当者・期限を、振り返れる形に</li></ul><p className={styles.note}>報告のタイミング・形式・優先順位は、社長の仕事の進め方に合わせて設計します。</p></div>
        </section>
        <section id="design" className={styles.section}>
          <p className={styles.eyebrow}>BUILT FOR YOUR BUSINESS</p><h2>便利さと、<br /><span>確認できる仕組みを一緒に。</span></h2>
          <div className={styles.designGrid}><article><h3>参照できる情報を決める</h3><p>利用者の権限、対象資料、データの保存先・保持期間を整理。業務に必要な範囲から連携します。</p></article><article><h3>根拠をたどれる回答に</h3><p>社内資料の検索は参照元を添える構成を検討。情報が足りない場合は確認事項として戻します。</p></article><article><h3>送信・変更には承認を</h3><p>メール送信、予定の確定・変更、社外共有は人が確認。許可する操作と、承認する担当者を明確にします。</p></article><article><h3>使いながら確かめる</h3><p>回答の正確さ、確認の手間、処理時間を試行で評価。誤回答や連携エラーの扱いも確認します。</p></article></div>
          <p className={styles.limit}>AIの出力には誤りが含まれる可能性があります。重要な内容は担当者が確認し、経営判断は人が行う運用を組み込みます。利用するAIサービスのデータ取り扱いも、導入前に確認します。</p>
        </section>
        <section id="cost" className={styles.section}>
          <p className={styles.eyebrow}>START SMALL, BUILD TOGETHER</p><h2>AI秘書の費用と、<br /><span>導入までの進め方。</span></h2>
          <div className={styles.cost}>
            <div>
              <span>初期費用の目安</span>
              <h3 className={styles.price}>{secretaryInitialLabel}<small>〜（税別）</small></h3>
              <p>「朝の報告」「日程調整」「議事録と宿題の整理」の3機能を基本構成に含みます。共通の設計・連携設定・試行・調整・納品も含めた概算です。</p>
              <ul className={styles.included}><li>朝の予定・重要メールをまとめる報告</li><li>候補日時の整理と、承認を挟む予定登録</li><li>会議メモ・文字起こしから議事録とタスクを整理</li></ul>
            </div>
            <div>
              <span>運用保守</span>
              <h3 className={styles.price}>月額{secretaryMonthlyLabel}<small>（税別）</small></h3>
              <p>連携の保守、運用上の不具合対応、設定調整など。対象範囲と対応方法は、ご契約前に確認します。</p>
              <ul><li><b>追加機能・追加開発</b><span>メールの返信案、商談準備、社内資料検索などは別途お見積もり</span></li><li><b>AI・外部サービス利用料</b><span>AIの利用量、メール・カレンダー等の契約に応じて別途</span></li></ul>
            </div>
          </div>
          <p className={styles.note}>基本構成は1人分、メール・カレンダー各1サービス、既存の会議メモ・文字起こしデータの利用を想定しています。複数人・複数サービスの連携、録音・自動文字起こし、独自画面や複雑な権限設定などは別途ご相談ください。正式な金額・納期は対象業務と連携先を確認して提示します。</p>
          <ol className={styles.steps}><li><b>01</b><div><h3>業務を伺う</h3><p>任せたい仕事、今使っているツール、困っている点を整理します。</p></div></li><li><b>02</b><div><h3>小さく試す</h3><p>対象データ・権限・承認を決め、ひとつの業務で使い勝手を確認します。</p></div></li><li><b>03</b><div><h3>評価して導入する</h3><p>精度と確認負担を評価。運用方法を決めて対象業務を広げます。</p></div></li></ol>
          <p className={styles.note}>連携の可否は、各サービスのAPI・契約プラン・管理者設定を確認して判断します。Webサイト制作の料金プランとは別のお見積もりです。</p>
        </section>
        <section id="experience" className={styles.section}>
          <p className={styles.eyebrow}>MEET THE TEAM BEHIND IT</p><h2>設計から実装まで、<br /><span>エビスソフトが担当します。</span></h2>
          <p className={styles.intro}>京都市伏見区を拠点に、Web制作・AI機能開発・組み込みソフトウェア開発を手がけています。御社の業務と既存システムを確認し、連携・承認・運用まで一緒に設計します。</p>
          <div className={styles.proof}><div><h3>仕組みはデモで確認できます</h3><p>当サイトでは、文書検索にもとづく回答や音声入力などの個別デモを公開しています。AI秘書の導入検討時は、連携先と対象資料に合わせて試行環境を作り、実際の業務で評価します。</p><div className={styles.textLinks}><a href={href("/demo/ai-chatbot")}>文書検索のデモ <span aria-hidden="true">↗</span></a><a href={href("/demo/voice")}>音声入力のデモ <span aria-hidden="true">↗</span></a></div><p className={styles.note}>文書検索デモはブラウザ内の検索処理とサンプル資料で動作します。実案件では対象資料とAIサービスを選定して構築します。</p></div><div><h3>相談先が分かることも大切に</h3><p>{siteConfig.legalName}<br />〒{siteConfig.contact.address.postalCode}<br />{siteConfig.contact.address.region}{siteConfig.contact.address.locality}{siteConfig.contact.address.street}<br />{siteConfig.contact.openingHoursDisplay}</p><div className={styles.textLinks}><a href={href("/company")}>会社概要・代表者について <span aria-hidden="true">↗</span></a><a href={`tel:${siteConfig.contact.telephone}`}>{siteConfig.contact.telephoneDisplay}</a></div></div></div>
        </section>
        <section id="faq" className={styles.section}>
          <p className={styles.eyebrow}>FAQ</p><h2>AI秘書について、<br /><span>よくあるご質問。</span></h2>
          <div className={styles.faq}>{secretaryFaqs.map(faq => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">＋</span></summary><p>{faq.answer}</p></details>)}</div>
        </section>
        <section className={styles.closing} aria-labelledby="consult-title"><p className={styles.eyebrow}>LET’S MAKE YOUR WORK EASIER</p><h2 id="consult-title">その仕事、<br /><span>AI秘書に任せられるかも。</span></h2><p>「何から始める？」という相談から。<br />任せたい作業を、ひとつ教えてください。</p><a className={styles.primary} href={href("/contact")}>AI秘書について無料で相談する <span aria-hidden="true">↗</span></a></section>
        <aside className={styles.editorial} aria-label="掲載情報について"><p>提供・編集：エビスソフト ／ 内容確認：2026年10月10日</p><p>生成AIを活用して作成し、公開デモの実装とサービスの設計方針をもとに内容を整理しています。掲載する機能はご相談に応じた開発範囲の例です。画面イメージは架空データを使用しています。</p><p>連携サービスのデータ取り扱いを確認する一次資料：<a href="https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy">Microsoft公式：Copilotのデータ・プライバシー・セキュリティ</a>。Microsoft製品を用いる場合の確認資料であり、当サービス全体の仕様を示すものではありません。</p></aside>
      </main>
      <footer className={styles.footer}><a href={href("/")}>エビスソフト</a><nav aria-label="フッターナビゲーション"><a href={href("/ai")}>AI活用</a><a href={href("/company")}>会社概要</a><a href={href("/privacy")}>プライバシーポリシー</a><a href={href("/contact")}>お問い合わせ</a></nav><p>© 2026 {siteConfig.legalName}</p></footer>
    </div>
  );
}
