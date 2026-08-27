"use client";

import { useState } from "react";

/**
 * デモサイトのお問い合わせフォーム。
 *
 * 見た目と入力の挙動は本番と同じですが、**送信はしません**（デモのため）。
 * 「動くように見えるのに何も起きない」を避けるため、送信すると
 * 何が起きるはずだったかをその場で表示します。
 */
export function DemoSiteForm({ subjects }: { subjects: string[] }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="ds-form-done" role="status">
        <b>送信されました（デモのため、実際には送信していません）。</b>
        <br />
        実案件では、この時点で ①お客様へ自動返信メール ②担当者へ通知 ③顧客管理システムへ登録
        までを自動で行います。迷惑メール対策と入力内容の検証も標準で実装します。
      </div>
    );
  }

  return (
    <form
      className="ds-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="ds-field">
        <label htmlFor="ds-name">お名前</label>
        <input id="ds-name" name="name" autoComplete="name" required />
      </div>
      <div className="ds-field">
        <label htmlFor="ds-email">メールアドレス</label>
        <input id="ds-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="ds-field">
        <label htmlFor="ds-subject">ご用件</label>
        <select id="ds-subject" name="subject" defaultValue={subjects[0]}>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="ds-field">
        <label htmlFor="ds-body">お問い合わせ内容</label>
        <textarea id="ds-body" name="body" rows={5} required />
      </div>
      <p className="ds-form-note">
        これはデモサイトのフォームです。入力された内容はどこにも送信・保存されません。
      </p>
      <div>
        <button type="submit" className="ds-btn ds-btn--primary">
          送信する
        </button>
      </div>
    </form>
  );
}
