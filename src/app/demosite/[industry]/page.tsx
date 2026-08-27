import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import "../demosite.css";

import { demoSiteNav, siteDemoPicks } from "@/lib/demoSite";
import { demoSites, getDemoSite } from "@/lib/demoSiteData";
import { getIndustry } from "@/lib/showcaseData";
import { demoPropsFor } from "@/lib/demoProps";
import { siteConfig } from "@/lib/site";
import { DemoSiteFeature } from "@/components/demosite/DemoSiteFeature";
import { DemoSiteForm } from "@/components/demosite/DemoSiteForm";

/**
 * 職種別のデモサイト（`/demosite/<職種>`）。
 *
 * ここは**お客様のホームページそのもの**です。エビスソフトのヘッダー・フッター・
 * 3D背景は載せません（`app/(chrome)` の外にあるため、そもそも配信されません）。
 *
 * 【検索エンジンには載せません】
 * 架空の事業者のページなので `noindex` にし、サイトマップにも入れません。
 * 実在しない会社が検索結果に出ると、見る人にとって害になるためです。
 * 同じ理由で、**LocalBusiness などの構造化データは出力しません**
 * （架空の事業者を実在の事業者として機械可読な形で宣言することになるため）。
 * 職種の説明ページ `/showcase/<職種>` のほうを検索対象にしています。
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return demoSites.map((d) => ({ industry: d.industry }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string }>;
}): Promise<Metadata> {
  const { industry } = await params;
  const site = getDemoSite(industry);
  if (!site) return {};

  return {
    // お客様のサイトそのものに見せるため、当社名を付ける共通テンプレートを打ち消す
    title: { absolute: `${site.brand}｜${site.brandNote}` },
    description: `${site.lead}※これは${siteConfig.name}が制作したデモサイトです。実在の事業者ではありません。`,
    alternates: { canonical: `/demosite/${site.industry}` },
    // 架空の事業者のページなので、検索結果には出さない
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
    openGraph: {
      type: "website",
      title: `${site.brand}（デモサイト）｜${siteConfig.name}`,
      description: site.lead,
    },
  };
}

/** 金額の表示（0円のものは「—」ではなく職種に合わせた表現にする） */
function yen(price: number): string {
  return price > 0 ? `¥${price.toLocaleString("ja-JP")}` : "要問い合わせ";
}

export default async function DemoSitePage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  const site = getDemoSite(industry);
  const data = getIndustry(industry);
  if (!site || !data) notFound();

  const nav = demoSiteNav(site);
  // 中身まで職種のものになっているデモだけを載せる（siteDemoPicks のコメント参照）
  const demos = siteDemoPicks(data.picks);

  return (
    <div className="ds" data-theme={site.theme}>
      {/* ---------- デモであることの明示（全ページ共通・常時表示） ---------- */}
      <div className="ds-bar">
        <div className="ds-wrap ds-bar-inner">
          <span>
            <strong>これはデモサイトです。</strong>
            {site.brand}
            は架空の事業者で、住所・電話番号・お客様の声もすべて架空です。
            {siteConfig.name}が「{data.name}
            のホームページを作るとこうなる」を見せるために制作しました。
          </span>
          <a className="ds-bar-link" href={`${siteConfig.url}/showcase/${data.slug}`}>
            この構成の説明を見る →
          </a>
        </div>
      </div>

      {/* ---------- ヘッダー ---------- */}
      <header className="ds-header">
        <div className="ds-wrap ds-header-inner">
          <a href="#top" className="ds-brand">
            <b>{site.brand}</b>
            <span>{site.brandEn}</span>
          </a>

          <nav className="ds-nav" aria-label="サイト内">
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className="ds-header-cta">
            <span className="ds-tel">
              {site.tel}
              <small>お電話でのご相談</small>
            </span>
            <a href="#contact" className="ds-btn ds-btn--primary ds-btn--sm">
              {site.cta.primary}
            </a>
          </div>

          {/* スマートフォン用。JavaScriptを使わずに開閉する */}
          <details className="ds-menu">
            <summary>メニュー</summary>
            <div className="ds-menu-panel">
              <div className="ds-wrap">
                {nav.map((n) => (
                  <a key={n.id} href={`#${n.id}`}>
                    {n.label}
                  </a>
                ))}
                <a href="#contact">お問い合わせ</a>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main id="main">
        {/* ---------- ヒーロー ---------- */}
        <section className="ds-hero" id="top">
          <div className="ds-wrap ds-hero-grid">
            <div>
              <h1>
                {site.hero[0]}
                <br />
                {site.hero[1]}
              </h1>
              <p className="ds-hero-lead">{site.lead}</p>
              <div className="ds-hero-actions">
                <a href="#contact" className="ds-btn ds-btn--primary">
                  {site.cta.primary}
                </a>
                <a href="#menu" className="ds-btn ds-btn--ghost">
                  {site.cta.secondary}
                </a>
              </div>
              <ul className="ds-points">
                {site.heroPoints.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="ds-photo">
              <span>写真が入ります（本番ではお客様の素材に差し替え）</span>
            </div>
          </div>
        </section>

        {/* ---------- お知らせ ---------- */}
        <div className="ds-news">
          <div className="ds-wrap">
            <ul className="ds-news-list">
              {site.news.map((n) => (
                <li key={n.date}>
                  <time dateTime={n.date}>{n.date.replace(/-/g, ".")}</time>
                  <span className="ds-tag">{n.tag}</span>
                  <span style={{ minWidth: 0 }}>{n.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---------- 選ばれる理由 ---------- */}
        <section id="about" className="ds-section">
          <div className="ds-wrap">
            <div className="ds-head ds-head--center">
              <span className="ds-eyebrow">About us</span>
              <h2 className="ds-h2">選ばれている理由</h2>
              <p className="ds-lead">{data.customer}のために、次の3点を大切にしています。</p>
            </div>
            <div className="ds-grid ds-grid--3">
              {site.reasons.map((r, i) => (
                <div key={r.title} className="ds-card">
                  <span className="ds-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- メニュー（サービス一覧） ---------- */}
        <section id="menu" className="ds-section ds-section--alt">
          <div className="ds-wrap">
            <div className="ds-head">
              <span className="ds-eyebrow">Menu</span>
              <h2 className="ds-h2">{site.menuTitle}</h2>
              <p className="ds-lead">{site.menuLead}</p>
            </div>
            <div className="ds-menu-list">
              {data.catalog.map((c) => (
                <div key={c.sku} className="ds-menu-row">
                  <b>{c.name}</b>
                  <span className="ds-cat">{c.category}</span>
                  <span className="ds-price">
                    {yen(c.price)}
                    <small>{c.stock === 0 ? "／受付終了" : `／残り${c.stock}`}</small>
                  </span>
                </div>
              ))}
            </div>
            <p className="ds-lead" style={{ marginTop: "1.25rem" }}>
              在庫・残数は{data.systems[0]?.label ?? "基幹システム"}
              と連動する想定です。
            </p>
          </div>
        </section>

        {/* ---------- 実際に動く機能（このサイトの主役） ---------- */}
        <section id="feature" className="ds-section">
          <div className="ds-wrap">
            <div className="ds-head">
              <span className="ds-eyebrow">Web features</span>
              <h2 className="ds-h2">このサイトでできること</h2>
              <p className="ds-lead">{site.featureLead}</p>
            </div>
            <div className="ds-grid" style={{ gap: "1.25rem" }}>
              {demos.map((p) => (
                <DemoSiteFeature
                  key={p.demo}
                  slug={p.demo}
                  title={p.title}
                  scene={p.scene}
                  demoProps={demoPropsFor(p.demo, data, site.faq)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------- 事例 ---------- */}
        <section id="works" className="ds-section ds-section--alt">
          <div className="ds-wrap">
            <div className="ds-head">
              <span className="ds-eyebrow">Works</span>
              <h2 className="ds-h2">{site.worksTitle}</h2>
              <p className="ds-lead">{site.worksLead}</p>
            </div>
            <div className="ds-grid ds-grid--3">
              {site.works.map((w) => (
                <article key={w.title} className="ds-work">
                  <div className="ds-photo ds-photo--wide">
                    <span>写真が入ります</span>
                  </div>
                  <span className="ds-tag" style={{ marginTop: "0.9rem", display: "inline-block" }}>
                    {w.tag}
                  </span>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- お客様の声 ---------- */}
        <section className="ds-section">
          <div className="ds-wrap">
            <div className="ds-head ds-head--center">
              <span className="ds-eyebrow">Voice</span>
              <h2 className="ds-h2">お客様の声</h2>
              <p className="ds-lead">掲載している声は、デモ用に作成した架空のものです。</p>
            </div>
            <div className="ds-grid ds-grid--3">
              {site.voices.map((v) => (
                <blockquote key={v.name} className="ds-voice">
                  <p className="ds-stars" aria-label="5段階評価で5">
                    ★★★★★
                  </p>
                  <p>「{v.body}」</p>
                  <footer>{v.name}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- ご利用の流れ ---------- */}
        <section className="ds-section ds-section--alt">
          <div className="ds-wrap">
            <div className="ds-head">
              <span className="ds-eyebrow">Flow</span>
              <h2 className="ds-h2">ご利用の流れ</h2>
            </div>
            <ol className="ds-flow">
              {site.flow.map((f) => (
                <li key={f.title}>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- よくある質問 ---------- */}
        <section id="faq" className="ds-section">
          <div className="ds-wrap">
            <div className="ds-head">
              <span className="ds-eyebrow">FAQ</span>
              <h2 className="ds-h2">よくある質問</h2>
            </div>
            <div className="ds-faq">
              {site.faq.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- アクセス ---------- */}
        <section id="access" className="ds-section ds-section--alt">
          <div className="ds-wrap">
            <div className="ds-head">
              <span className="ds-eyebrow">Access</span>
              <h2 className="ds-h2">アクセス・営業情報</h2>
            </div>
            <div className="ds-grid ds-grid--2">
              <table className="ds-info">
                <tbody>
                  <tr>
                    <th>所在地</th>
                    <td>{site.info.address}</td>
                  </tr>
                  <tr>
                    <th>アクセス</th>
                    <td>{site.info.access}</td>
                  </tr>
                  <tr>
                    <th>営業時間</th>
                    <td>{site.info.hours}</td>
                  </tr>
                  <tr>
                    <th>定休日</th>
                    <td>{site.info.closed}</td>
                  </tr>
                  <tr>
                    <th>そのほか</th>
                    <td>{site.info.extra}</td>
                  </tr>
                </tbody>
              </table>
              <div className="ds-photo ds-photo--wide">
                <span>地図が入ります（本番ではGoogleマップを埋め込み）</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- お問い合わせ ---------- */}
        <section id="contact" className="ds-section">
          <div className="ds-wrap">
            <div className="ds-head">
              <span className="ds-eyebrow">Contact</span>
              <h2 className="ds-h2">お問い合わせ</h2>
              <p className="ds-lead">
                お電話（{site.tel}／{site.info.hours}）でも承ります。
              </p>
            </div>
            <div className="ds-grid ds-grid--2">
              <DemoSiteForm
                subjects={[site.cta.primary, site.cta.secondary, "料金について", "その他のご相談"]}
              />
              <div className="ds-card">
                <h3>この構成をご自身の事業で使うには</h3>
                <p>
                  このページは{siteConfig.name}
                  が制作したデモサイトです。文章・写真・メニューを
                  お客様の内容に差し替えれば、そのまま公開できる状態まで作り込んでいます。
                  上の「このサイトでできること」に並んでいる機能も、すべて実装済みのものです。
                </p>
                <p style={{ marginTop: "1rem" }}>
                  <a
                    className="ds-btn ds-btn--primary ds-btn--sm"
                    href={`${siteConfig.url}/contact`}
                    target="_blank"
                    rel="noopener"
                  >
                    {siteConfig.name}に相談する
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- フッター ---------- */}
      <footer className="ds-footer">
        <div className="ds-wrap">
          <div className="ds-footer-grid">
            <div>
              <h2>{site.brand}</h2>
              <p style={{ marginTop: "0.6rem" }}>{site.brandNote}</p>
              <p style={{ marginTop: "0.6rem" }}>{site.info.address}</p>
              <p>TEL {site.tel}</p>
            </div>
            <div>
              <h2>ページ</h2>
              <ul style={{ marginTop: "0.6rem" }}>
                {nav.map((n) => (
                  <li key={n.id}>
                    <a href={`#${n.id}`}>{n.label}</a>
                  </li>
                ))}
                <li>
                  <a href="#contact">お問い合わせ</a>
                </li>
              </ul>
            </div>
            <div>
              <h2>営業時間</h2>
              <p style={{ marginTop: "0.6rem" }}>{site.info.hours}</p>
              <p>定休日：{site.info.closed}</p>
              <p style={{ marginTop: "0.6rem" }}>{site.info.extra}</p>
            </div>
          </div>

          <p className="ds-footer-note">
            ※ このサイトは{siteConfig.name}（京都市伏見区）が制作した
            <b>デモサイト</b>です。
            {site.brand}
            は架空の事業者であり、掲載している住所・電話番号・お客様の声・実績は
            すべて架空のものです。実在の企業・団体とは関係ありません。
            <br />
            <Link href="/" prefetch={false}>
              {siteConfig.name}のサイトへ
            </Link>
            　／
            <Link href={`/showcase/${data.slug}`} prefetch={false}>
              {data.name}向けの機能の説明を見る
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
