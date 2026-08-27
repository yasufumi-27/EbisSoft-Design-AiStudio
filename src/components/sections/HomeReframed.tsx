import Link from "next/link";
import { capabilities } from "@/lib/content";

/**
 * トップページ：デザイン案 03「AI STUDIO」＝未来を試作するラボ。
 *
 * 提案案（/proposal/ai-studio）の構成をそのまま踏襲しています。
 *   ヒーロー（中央のクローム核を文字が囲む）
 *   → ONE CONTINUOUS FLIGHT（01〜04 の縦連続）
 *   → LIVE MODULES（できることのモジュール盤）
 *   → 締め（小さくなった核＋CTA）
 *
 * 本番と同じく、ここは「各ページの要約と入口」に徹しています。
 * 詳細は /ai・/web・/embedded に置き、トップでは飛ばし先だけを示します。
 *
 * 提案案からの意図的な変更は2点だけ（globals.css の同名ブロックにも記載）：
 *   1. H1 は日本語主体。英語は下の一行と各キッカーへ降ろした（AEO / LLMO 上、
 *      検索やAIの答えになるのは日本語の見出しのため）
 *   2. 数値は content.ts の実績値のみを使う。提案案にあった架空の指標は載せない
 */

/** ONE CONTINUOUS FLIGHT：01〜04。飛行の各段が、そのまま下層ページへの入口になる。 */
const flight = [
  {
    no: "01",
    en: "OBSERVE",
    title: "AIを、使う側でも作る側でもある。",
    body:
      "生成AIを制作フロー全体に組み込み、制作期間を従来の約1/3に短縮します。同時に、RAGチャットボットや音声AIといったAI機能そのものの受託開発も行います。設計方針・レビュー・公開判断は必ず人が担当します。",
    href: "/ai",
    more: "AI活用のすべて",
  },
  {
    no: "02",
    en: "PROTOTYPE",
    title: "事業の成果から、逆算してつくる。",
    body:
      "コーポレートサイト、LP、EC、Webアプリ。SEO / AEO / LLMO、表示速度、公開後の運用改善までを標準で含みます。小規模サイトは最短5日で公開できます。",
    href: "/web",
    more: "Web制作の対応範囲",
  },
  {
    no: "03",
    en: "INTEGRATE",
    title: "機器の中から、クラウドの先へ。",
    body:
      "C / C++によるファームウェア開発、RTOSの移植、I/Oドライバ、BLE・Wi-Fi・CANなどの通信。IoT機器のデータをWebで可視化するところまで、同じ体制で担当します。",
    href: "/embedded",
    more: "組み込み開発の受託範囲",
  },
  {
    no: "04",
    en: "EVOLVE",
    title: "できることは、すべて動かして確かめられる。",
    body:
      "3DCG・AR・AIチャットボット・音声AI・行動解析・システム連携など15領域を、主張ではなく実際に動くデモとして公開しています。職種別のデモサイトも用意しています。",
    href: "/demo",
    more: "実動デモを見る",
  },
] as const;

/** LIVE MODULES に並べるできること（content.ts の実装メニューから6つ） */
const moduleSlugs = ["ai-chatbot", "voice", "3dcg", "ar", "insight", "integration"] as const;

/** クロームの核（CSSのみで組み立てた多面体。3D背景とは別レイヤー） */
function ChromeCore({ mini = false }: { mini?: boolean }) {
  return (
    <div className={`chrome-core${mini ? " mini" : ""}`} aria-hidden>
      <i />
      <i />
    </div>
  );
}

export function HomeReframed() {
  const modules = moduleSlugs
    .map((slug) => capabilities.find((c) => c.slug === slug))
    .filter((c): c is (typeof capabilities)[number] => Boolean(c));

  return (
    <div className="ai-home">
      <section className="ai-hero" aria-labelledby="home-title">
        <div className="ai-stars" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <i key={i} />
          ))}
        </div>
        <ChromeCore />
        <div className="ai-hero-scrim" aria-hidden />

        <p className="ai-hero-kicker">YEBISU SOFT / APPLIED INTELLIGENCE LAB / KYOTO</p>
        {/* ファーストビューは reveal を使わない（JSを待たずに描画してLCPを早める） */}
        <h1 id="home-title">
          AIを、<em>実際の仕事</em>が
          <br />
          動く形にする。
        </h1>
        <p className="ai-hero-en">AI, SHAPED FOR REAL WORK.</p>

        <div className="ai-hero-actions">
          <Link href="/contact" className="ai-btn ai-btn-solid">
            無料で相談する <span aria-hidden>↗</span>
          </Link>
          <Link href="/demo" className="ai-btn ai-btn-line">
            動くデモを見る <span aria-hidden>↘</span>
          </Link>
        </div>

        <aside className="ai-hero-aside">
          <b>01 — INTELLIGENCE</b>
          <p>
            現場の知識とAIを接続し、使われる仕組みまで実装する。京都市伏見区から、Web・AI・組み込みを横断して。
          </p>
        </aside>
      </section>

      <section className="ai-flight" aria-labelledby="home-flight-title">
        <header>
          <span id="home-flight-title">ONE CONTINUOUS FLIGHT</span>
          <b>SCROLL / 01—04</b>
        </header>
        {flight.map((item, i) => (
          <article key={item.no} data-reveal>
            <div className={`ai-flight-object ai-flight-${i}`} aria-hidden />
            <div>
              <p className="ai-flight-label">
                <b>{item.no}</b>
                {item.en}
              </p>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <Link href={item.href} className="ai-flight-more">
                {item.more} <span aria-hidden>↗</span>
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="ai-console" aria-labelledby="home-console-title">
        <div data-reveal>
          <p className="ai-console-label">LIVE MODULES</p>
          <h2 id="home-console-title">
            AIを作る側の、
            <br />
            実装メニュー。
          </h2>
          <p>
            15領域すべてを、その場で操作できるデモとして公開しています。カタログではなく、動いているものを見て決めてください。
          </p>
        </div>
        <div className="ai-console-grid" data-reveal>
          {modules.map((mod, i) => (
            <Link key={mod.slug} href={`/demo/${mod.slug}`}>
              <article>
                <span>MOD_0{i + 1}</span>
                <i aria-hidden />
                <b>{mod.title}</b>
                <small>STATUS / READY</small>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section className="ai-final" aria-labelledby="home-cta-title">
        <ChromeCore mini />
        <h2 id="home-cta-title">
          できるかどうかの相談から、
          <br />
          始めてください。
        </h2>
        <p>初回のご相談・お見積もりは無料です。最短2営業日で構成案をご提示します。</p>
        <Link href="/contact" className="ai-btn ai-btn-solid">
          START A PROJECT <span aria-hidden>↗</span>
        </Link>
      </section>
    </div>
  );
}
