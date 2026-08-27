/**
 * GA4 のイベント送信ユーティリティ。
 *
 * クライアントコンポーネントから呼ぶための小さな関数だけを置いています
 * （`content.ts` などの重いモジュールは絶対に import しないこと。初期JSに載ります）。
 *
 * GA4 が未設置（NEXT_PUBLIC_GA_ID 未設定）や、プレビュー環境・広告ブロッカー配下では
 * `window.gtag` が存在しないため、その場合は何もせず静かに戻ります。
 * 計測できないことで機能が壊れてはいけないので、例外も投げません。
 */

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: "event" | "config" | "js", ...args: unknown[]) => void;
  }
}

/**
 * GA4 へイベントを送る。
 *
 * イベント名は GA4 の推奨イベント名を優先して使うこと（管理画面で自動的に意味を持つため）。
 * - `generate_lead` … お問い合わせ送信が成功した（＝このサイトの最重要コンバージョン）
 * - `contact_tap`   … 電話・メールリンクのタップ（推奨イベントに該当がないので独自名）
 */
export function trackEvent(name: string, params: GtagParams = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params);
  } catch {
    // 計測の失敗でユーザーの操作を止めない
  }
}
