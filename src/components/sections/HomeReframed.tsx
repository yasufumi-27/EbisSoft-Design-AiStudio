import Link from "next/link";
import { CharacterGuide, CharacterPortrait } from "@/components/characters/CharacterGuide";
import { capabilities } from "@/lib/content";
import { Icon } from "@/components/ui/icons";
import { StudioMotion, StudioParticleField } from "./StudioMotion";
import { StudioPreview } from "./StudioPreview";
import styles from "./StudioHome.module.css";

const services = [
  { no: "01", en: "AI DEVELOPMENT", title: <>AIを、<br/>仕事のパートナーに。</>, body: "社内の知識で答えるチャットボット。話しかけて使える音声AI。現場に合わせたAIを、設計から実装まで。", href: "/ai", more: "AI活用について", icon: "sparkles", tags: ["RAG・チャットボット", "音声AI", "AIエージェント"] },
  { no: "02", en: "WEB EXPERIENCE", title: <>見た目の、その先の<br/>成果まで。</>, body: "伝わるデザインと、使いやすい仕組み。コーポレートサイトからWebアプリまで、公開後の運用も見据えてつくります。", href: "/web", more: "Web制作について", icon: "layout", tags: ["Webサイト・EC", "Webアプリ", "SEO・AI検索対策"] },
  { no: "03", en: "EMBEDDED SYSTEMS", title: <>小さな機器から、<br/>大きな仕組みへ。</>, body: "ファームウェア、通信、クラウド連携。機器の中とWebの向こうをつなぎ、現場で動くシステムを実装します。", href: "/embedded", more: "組み込み開発について", icon: "cpu", tags: ["C / C++・RTOS", "BLE・Wi-Fi・CAN", "IoT・クラウド連携"] },
] as const;
const moduleSlugs = ["ai-chatbot", "voice", "3dcg", "ar", "insight", "integration"];
const moduleDescriptions = ["知りたいことに、自然な言葉で。", "話しかけるだけで、もっと直感的に。", "ブラウザの中で、立体を自由に。", "その場所に置いて、確かめる。", "使われ方を知り、次の改善へ。", "別々の仕組みを、ひとつの流れに。"];

/** Server-rendered content is composed inside the client motion controller. */
export function HomeReframed() {
  const modules = moduleSlugs.map(slug => capabilities.find(c => c.slug === slug)).filter(c => c !== undefined);
  return (
    <StudioMotion>
      <section data-motion-section className={styles.hero} aria-labelledby="home-title">
        <StudioParticleField/>
        <div className={styles.heroAura} aria-hidden="true"><i/><i/><i/></div>
        <svg className={styles.ribbon} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs><linearGradient id="studio-spectrum" x1="0" y1="0" x2="1" y2=".7"><stop stopColor="#6bc8fa"/><stop offset=".48" stopColor="#6885ef"/><stop offset="1" stopColor="#c296ff"/></linearGradient></defs>
          <g fill="none" stroke="url(#studio-spectrum)" strokeWidth=".7">
            {Array.from({ length: 44 }, (_, i) => <path key={i} opacity={.15 + (i % 7) * .055} d={`M -180 ${160+i*7} C 250 ${80+i*6}, 135 ${870-i*4}, 620 ${760-i*3} S 1020 ${80+i*4}, 1620 ${320+i*9}`} />)}
          </g>
        </svg>
        <p className={styles.eyebrow}>YEBISU SOFT · AI DEVELOPMENT STUDIO</p>
        <h1 id="home-title">そのアイデアに、<br/><span>動き出す力を。</span></h1>
        <p className={styles.heroLead}>AIも、Webも、機器の中のソフトウェアも。<br/>「こんなこと、できたら」を、使える仕組みに。</p>
        <div className={styles.actions}>
          <Link href="/demo" className={styles.primary} data-magnetic>できることを体験する <span aria-hidden="true">↗</span></Link>
          <Link href="/contact" className={styles.secondary} data-magnetic>無料で相談する <span aria-hidden="true">→</span></Link>
        </div>
        <div className={styles.heroFoot}>
          <span><i/>京都から、アイデアの実装まで。</span>
          <a href="#possibilities">できることを見てみる <span aria-hidden="true">↓</span></a>
          <span>AI / WEB / EMBEDDED</span>
        </div>
      </section>

      <section data-motion-section id="possibilities" className={styles.possibilities} aria-labelledby="possibilities-title">
        <div className={styles.sectionHeading} data-enter>
          <p className={styles.eyebrow}>POSSIBILITIES, MADE REAL</p>
          <h2 id="possibilities-title">いつもの仕事に、<br/><span>新しい可能性を。</span></h2>
          <p>技術の名前より、できるようになることから。</p>
        </div>
        <CharacterGuide character="chroma" compact>こんにちは、AI広報のクロマです！ 気になるシーンを選んで、仕事がどう変わるか見てみましょう。</CharacterGuide>
        <StudioPreview/>
      </section>

      <section data-motion-section className={styles.services} aria-labelledby="services-title">
        <div className={styles.sectionRow} data-enter><div><p className={styles.eyebrow}>OUR EXPERTISE</p><h2 id="services-title">つくる力を、ひとつに。</h2></div><p>AI・Web・組み込み。<br/>領域をつなぐことで、アイデアを実装する。</p></div>
        <div className={styles.serviceGrid}>
          {services.map((service, index) => <article key={service.no} className={styles.serviceCard} data-enter={index * 130} data-tilt>
            <div className={styles.serviceTop}><Icon name={service.icon}/><span>{service.no}</span></div>
            <p className={styles.eyebrow}>{service.en}</p><h3>{service.title}</h3><p>{service.body}</p>
            <ul>{service.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
            <Link href={service.href} className={styles.textLink}>{service.more}<span aria-hidden="true">↗</span></Link>
          </article>)}
        </div>
        <CharacterGuide character="ebisu" title="AIの速さに、人の確かさを。" href="/ai" linkLabel="開発への考え方">マネージャーのエビスさんです。制作には生成AIを活用し、設計方針・レビュー・公開判断は人が担当します。</CharacterGuide>
      </section>

      <section data-motion-section className={styles.demos} aria-labelledby="demos-title">
        <div className={styles.sectionRow} data-enter><div><p className={styles.eyebrow}>EXPLORE THE POSSIBILITIES</p><h2 id="demos-title">読むより、触れてみる。</h2></div><Link href="/demo" className={styles.textLink}>15領域のデモを見る <span aria-hidden="true">↗</span></Link></div>
        <div className={styles.demoGrid}>{modules.map((mod, i) => <Link key={mod.slug} href={`/demo/${mod.slug}`} className={styles.demoCard} data-enter={(i % 3) * 110} data-tilt>
          <div className={styles.demoArt} data-kind={i}><Icon name={mod.icon}/><span aria-hidden="true"/><span aria-hidden="true"/><div className={styles.energyBars} aria-hidden="true">{Array.from({length: 13}, (_, n) => <i key={n} style={{animationDelay: `${n * -.17}s`}}/>)}</div></div>
          <div className={styles.demoCardCopy}><h3>{mod.title}</h3><p>{moduleDescriptions[i]}</p><span className={styles.demoArrow} aria-hidden="true">↗</span></div>
        </Link>)}</div>
        <CharacterGuide character="chroma" title="次は、あなたの業種で見てみませんか？" href="/showcase" linkLabel="業種別デモサイトを見てみる">お店や会社のサイトになったら、どんな体験になる？ クロマと一緒に、実際に動くデモサイトをのぞいてみましょう。</CharacterGuide>
      </section>

      <section data-motion-section className={styles.final} aria-labelledby="home-cta-title">
        <div className={styles.teamWelcome} data-enter><CharacterPortrait character="chroma" avatar/><CharacterPortrait character="ebisu" avatar/><span>クロマとエビスさんが、ご案内します。</span></div>
        <p className={styles.eyebrow}>LET’S MAKE IT REAL</p>
        <div className={styles.finalOrbits} aria-hidden="true"><i/><i/><i/></div>
        <h2 id="home-cta-title" data-enter>まだ、アイデアの<br/>途中でも。</h2>
        <p>「こんなこと、できる？」から始めましょう。<br/>初回のご相談・お見積もりは無料です。</p>
        <Link href="/contact" className={styles.primary} data-magnetic>一緒に、考えてみる <span aria-hidden="true">↗</span></Link>
        <span className={styles.finalNote}>京都市伏見区 · エビスソフト · 京都商工会議所所属</span>
      </section>
    </StudioMotion>
  );
}
