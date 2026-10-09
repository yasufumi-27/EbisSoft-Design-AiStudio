import Link from "next/link";
import { jaNode } from "@/lib/typography";
import styles from "./StudioHome.module.css";

const tasks = [
  { title: "朝の確認を、ひとつに。", body: "今日の予定、重要メール、判断待ちの事項をまとめて報告。報告の時間や優先順位を、社長の仕事の進め方に合わせます。" },
  { title: "商談の前に、要点を。", body: "過去のやり取りや共有資料から、相手先の情報と前回の決定事項を整理。参照元を添えて、会議前の確認を支えます。" },
  { title: "指示と宿題を、忘れずに。", body: "会議メモや指示の記録から、担当者・期限・未対応事項を整理。登録された情報をもとに、確認すべきタスクをまとめます。" },
  { title: "メールと日程調整を支援。", body: "返信の下書きや日程候補を作成。外部への送信や予定の確定・変更は、社長や担当者の承認を挟む形で設計します。" },
  { title: "社員の日常業務にも。", body: "メールの下書き、議事録の要約、タスク整理も支援。社長ひとりの業務から、社内の業務支援へ広げられます。" },
  { title: "必要な社内資料を、すぐに。", body: "閲覧権限のあるマニュアルやFAQから必要な情報を検索。参照元を添えて、担当者が確認しやすい回答を返します。" },
];

export function AiAssistant({ compact = false }: { compact?: boolean }) {
  return (
    <section id="ai-assistant" className={styles.services} aria-labelledby="ai-assistant-title">
      <div className={styles.sectionRow}>
        <div>
          <p className={styles.eyebrow}>AI EXECUTIVE ASSISTANT</p>
          <h2 id="ai-assistant-title">{jaNode("社長のそばに、")}<br />{jaNode("専属のAI秘書を。")}</h2>
        </div>
        <p>{jaNode("毎日の確認と準備を支えて、")}<br />{jaNode("経営判断と、人に会う時間をつくる。")}</p>
      </div>
      <div className={styles.serviceGrid}>
        {(compact ? tasks.slice(0, 3) : tasks).map((task) => (
          <article key={task.title} className={styles.serviceCard}>
            <h3>{jaNode(task.title)}</h3>
            <p>{jaNode(task.body)}</p>
          </article>
        ))}
      </div>
      {compact ? (
        <Link prefetch={false} href="/ai#ai-assistant" className={styles.textLink}>{jaNode("AI社長秘書・業務向けAI秘書について")}<span aria-hidden="true">↗</span></Link>
      ) : (
        <>
          <div className={styles.sectionHeading}>
            <h3>{jaNode("ひとつの業務から、無理なく導入。")}</h3>
            <p>{jaNode("まずは朝の報告や商談準備から。メール・カレンダー・チャットとの連携は、API・契約プラン・権限を確認してご提案します。")}</p>
            <p>{jaNode("参照できる情報、操作履歴、データの保存先も導入前に整理。重要な内容は人が確認し、経営判断は社長が行う運用を基本にします。")}</p>
            <p>{jaNode("費用・期間は対象業務と連携範囲に応じて個別見積もり。開発費・運用費・AIや外部サービスの利用料をあわせてご案内します。")}</p>
          </div>
          <Link prefetch={false} href="/contact" className={styles.primary}>{jaNode("AI社長秘書について相談する")}<span aria-hidden="true">↗</span></Link>
        </>
      )}
    </section>
  );
}
