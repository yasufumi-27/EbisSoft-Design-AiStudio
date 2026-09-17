"use client";
import { jaNode } from "@/lib/typography";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import styles from "./StudioHome.module.css";

const examples = [
  { label: "問い合わせを、もっとスムーズに", tag: "AI CHATBOT", title: "社内の知識が、答える力に。", description: "製品資料やマニュアルをもとに、質問への回答をサポート。探す時間を減らし、人は判断が必要な仕事へ。", href: "/demo/ai-chatbot", link: "AIチャットボットを試す", icon: "chat" },
  { label: "商品を、手に取るように", tag: "3D EXPERIENCE", title: "伝わるから、選びやすくなる。", description: "写真だけでは伝わりにくい形や色も、ブラウザで自由に確認。3DCGと商品カスタマイズで、選ぶ体験をつくります。", href: "/demo/configurator", link: "商品カスタマイズを試す", icon: "cube" },
  { label: "現場のデータを、ひとつに", tag: "CONNECTED SYSTEMS", title: "機器の向こうまで、つながる。", description: "センサーや機器から集めた情報を、Webで見える形へ。組み込み開発からクラウド連携まで、一貫して設計します。", href: "/demo/integration", link: "システム連携を試す", icon: "plug" },
] as const;

export function StudioPreview() {
  const [selected, setSelected] = useState(0);
  const item = examples[selected];
  return (
    <div className={styles.experience} data-enter>
      <div className={styles.choices} role="group" aria-label="活用シーンを選ぶ">
        {examples.map((example, index) => <button key={example.tag} type="button" aria-pressed={selected === index} aria-controls="studio-example" onClick={() => setSelected(index)}><Icon name={example.icon}/>{jaNode(example.label)}</button>)}
      </div>
      <div id="studio-example" className={styles.example} data-tilt="soft">
        <div className={styles.exampleCopy} aria-live="polite" aria-atomic="true">
          <p className={styles.eyebrow}>{jaNode(item.tag)}</p><h3>{jaNode(item.title)}</h3><p>{jaNode(item.description)}</p>
          <Link prefetch={false} href={item.href} className={styles.textLink}>{jaNode(item.link)}<span aria-hidden="true">↗</span></Link>
        </div>
        <div key={selected} className={`${styles.exampleVisual} ${styles[`scene${selected}`]}`}>
          <span className={styles.sampleLabel}>{jaNode("活用イメージ / サンプルデータ")}</span>
          {selected === 0 ? <div className={styles.chatWindow}>
            <div className={styles.windowBar}><span><Icon name="sparkles"/> Knowledge assistant</span><span className={styles.statusDot}>DEMO</span></div>
            <div className={styles.question}>この製品の初期設定を教えてください。</div>
            <div className={styles.typingDots} aria-hidden="true"><i/><i/><i/></div>
            <div className={styles.answer}><span className={styles.answerIcon}><Icon name="sparkles"/></span><div><b>{jaNode("マニュアルから、必要な手順を。")}</b><p>{jaNode("1. 電源とネットワークを接続")}<br/>{jaNode("2. 管理画面で機器を登録")}<br/>{jaNode("3. 接続状態を確認して、設定完了")}</p><span className={styles.source}><Icon name="check"/>{jaNode(" 参照：製品マニュアル p.12")}</span></div></div>
            <div className={styles.mockInput}>知りたいことを、いつもの言葉で。<Icon name="arrowRight"/></div>
          </div> : selected === 1 ? <div className={styles.productWindow}>
            <div className={styles.productTop}><span>PRODUCT EXPLORER</span><Icon name="cube"/></div>
            <div className={styles.productObject} aria-hidden="true"><div/><i/><span className={styles.productOrbit}/><span className={styles.productOrbit}/></div>
            <div className={styles.productBottom}><div><b>{jaNode("かたちも、質感も。")}</b><span>{jaNode("色や角度を変えて確認")}</span></div><div className={styles.swatches} aria-hidden="true"><i/><i/><i/></div></div>
          </div> : <div className={styles.systemWindow}>
            <div className={styles.windowBar}><span><Icon name="gauge"/>{jaNode(" 設備モニター")}</span><span className={styles.statusDot}>{jaNode("サンプル")}</span></div>
            <div className={styles.sensorStats}><div><span>{jaNode("室温")}</span><b>24.8<small> °C</small></b></div><div><span>{jaNode("湿度")}</span><b>46<small> %</small></b></div><div><span>{jaNode("接続機器")}</span><b>08<small>{jaNode(" 台")}</small></b></div></div>
            <svg className={styles.chart} viewBox="0 0 400 100" role="img" aria-label="センサーデータの推移イメージ"><path d="M0 25H400M0 55H400M0 85H400" stroke="#dce1ee" fill="none"/><path d="M0 76 28 66 55 72 83 45 110 53 138 31 166 40 193 25 221 39 249 16 276 32 304 27 332 44 360 25 400 18" fill="none" stroke="#657eeb" strokeWidth="3"/></svg>
            <div className={styles.connection}><span>{jaNode("機器")}</span><i/><span>{jaNode("クラウド")}</span><i/><span>Web</span></div>
          </div>}
        </div>
      </div>
    </div>
  );
}
