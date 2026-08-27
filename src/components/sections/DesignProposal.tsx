import Link from "next/link";

export const proposalVariants = ["editorial", "craft", "signal"] as const;
export type ProposalVariant = (typeof proposalVariants)[number];

const copy: Record<ProposalVariant, { label: string; title: string; accent: string; intro: string; tone: string }> = {
  editorial: { label: "A / EDITORIAL", title: "仕事の景色を、\n変える。", accent: "大胆に、静かに。", intro: "GetLayersのような強いタイポグラフィと余白で、エビスソフトの思想を印象づける案です。", tone: "proposal-editorial" },
  craft: { label: "B / CRAFT", title: "つくる人の\nそばにいる。", accent: "京都から、丁寧に。", intro: "紙・朱・生成りを基調に、京都のものづくりと人の温度を感じる、相談しやすい案です。", tone: "proposal-craft" },
  signal: { label: "C / SIGNAL", title: "複雑な未来を、\nシンプルに。", accent: "AI × WEB × IOT", intro: "AIや組み込み開発の専門性を、情報設計とモーションで明快に伝える、技術志向の案です。", tone: "proposal-signal" },
};

const links = [
  ["editorial", "A", "Editorial", "黒 × ライム"],
  ["craft", "B", "Craft", "生成り × 朱"],
  ["signal", "C", "Signal", "ネイビー × シアン"],
] as const;

export function DesignProposal({ variant }: { variant: ProposalVariant }) {
  const data = copy[variant];
  return (
    <div className={`design-proposal ${data.tone}`}>
      <div className="proposal-switcher" aria-label="デザイン案を切り替える">
        <Link href="/proposal" className="proposal-switcher-home">DESIGN STUDY / EBISU SOFT</Link>
        <div className="proposal-switcher-links">{links.map(([key, letter, title, color]) => <Link key={key} className={key === variant ? "is-current" : ""} href={`/proposal/${key}`}><b>{letter}</b><span>{title}</span><small>{color}</small></Link>)}</div>
      </div>
      <section className="proposal-hero">
        <div className="proposal-hero-copy">
          <p className="proposal-label">{data.label} / EBISU SOFT / KYOTO</p>
          <h1>{data.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
          <p className="proposal-accent">{data.accent}</p>
          <p className="proposal-intro">{data.intro}</p>
          <div className="proposal-actions"><Link href="/contact">この方向で相談する <span>↗</span></Link><Link href="/proposal">3案の比較に戻る</Link></div>
        </div>
        <div className="proposal-art" aria-hidden><div className="proposal-art-core">{variant === "editorial" ? "ES" : variant === "craft" ? "手" : "01"}</div><div className="proposal-art-ring ring-a" /><div className="proposal-art-ring ring-b" /><span className="proposal-art-note">{variant === "editorial" ? "MAKE IT MATTER" : variant === "craft" ? "SINCE / KYOTO" : "BUILD / CONNECT / GROW"}</span></div>
      </section>
      <section className="proposal-services"><p className="proposal-label">WHAT WE BUILD</p><div className="proposal-service-grid"><article><b>01</b><h2>Web & AI</h2><p>伝わるWebサイトと、仕事を軽くするAI。</p></article><article><b>02</b><h2>Embedded</h2><p>現場で動き続けるソフトウェア。</p></article><article><b>03</b><h2>Experience</h2><p>理解を生むデザインと体験。</p></article></div></section>
      <section className="proposal-footer"><p>エビスソフトは、問いを立てるところから伴走します。</p><Link href="/contact">まずは話してみる ↗</Link></section>
    </div>
  );
}

export function ProposalIndex() {
  return <div className="proposal-index"><p className="proposal-index-kicker">EBISU SOFT / DESIGN STUDY</p><h1>3つの方向から、<br /><em>エビスソフト</em>を考える。</h1><p>同じ事業内容を、異なる温度と見せ方でデザインしました。カードを選ぶと各案の詳細を確認できます。</p><div className="proposal-index-grid">{links.map(([key, letter, title, color]) => <Link key={key} href={`/proposal/${key}`} className={`proposal-index-card proposal-index-${key}`}><b>{letter}</b><span>{title}</span><small>{color}</small><i>↗</i></Link>)}</div><Link className="proposal-index-back" href="/">通常のトップページへ戻る</Link></div>;
}
