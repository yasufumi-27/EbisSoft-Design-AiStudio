import { jaNode } from "@/lib/typography";
import { CharacterPortrait, type Character } from "./CharacterGuide";
import { Figure, type FigureName } from "@/components/ui/Figure";
import styles from "./CharacterStage.module.css";

/** A large character-led visual shared by service pages and individual demos. */
export function CharacterStage({ character = "chroma", figure = "ai-hero", priority = false }: { character?: Character; figure?: FigureName; priority?: boolean }) {
  const manager = character === "ebisu";
  return <div className={styles.stage} data-motion-section aria-label={manager ? "マネージャーのエビスさんがご案内" : "AI広報のクロマがご案内"}>
    <div className={styles.orbits} aria-hidden="true"><i/><i/><i/></div>
    <Figure name={figure} className={styles.figure}/>
    <div className={styles.card} data-tilt="soft">
      <CharacterPortrait character={character} priority={priority} sizes="(max-width: 700px) 112px, (max-width: 900px) 200px, 240px"/>
      <div className={styles.caption}><span>{jaNode(manager ? "YOUR PROJECT PARTNER" : "YOUR AI GUIDE")}</span><b>{jaNode(manager ? "エビスさん" : "クロマ")}<small>{jaNode(manager ? "マネージャー" : "AI広報")}</small></b></div>
    </div>
    <div className={styles.partner}><CharacterPortrait character={manager ? "chroma" : "ebisu"} avatar decorative sizes="(max-width: 700px) 64px, 92px"/><span>{jaNode(manager ? "クロマと一緒に" : "エビスさんと一緒に")}<b>{jaNode(manager ? "アイデアを、形に。" : "新しい可能性を、案内します。")}</b></span></div>
    <span className={styles.spark} aria-hidden="true">＋</span><span className={styles.spark} aria-hidden="true">＋</span>
  </div>;
}
