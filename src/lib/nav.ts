/**
 * サイトのナビゲーション項目。
 *
 * ※ content.ts から独立させている理由（表示速度に直結する）：
 *   ヘッダー（SiteHeader）はメニュー開閉のため "use client" のコンポーネントで、
 *   ここを content.ts から import すると、掲載コンテンツ 1800行ぶん（FAQ全文・料金・
 *   デモ説明など）がまとめて初期JSに載ってしまう（実測でgzip換算 約17KB）。
 *   ナビだけをこの小さなモジュールに分けておけば、その巻き添えが起きない。
 *   → 全ページ共通のクライアント側で使うデータは、ここに置くこと。
 */

export type NavItem = { label: string; href: string };

/**
 * グローバルナビ。並び順は「遷移してほしい優先度」そのものです。
 * 1. AI活用（最も見せたい強み） 2. Web制作（主力サービス） 3. 組み込み開発（相談を増やしたい領域）
 */
export const nav: NavItem[] = [
  { label: "AI活用", href: "/ai" },
  { label: "Web制作", href: "/web" },
  { label: "組み込み開発", href: "/embedded" },
  { label: "できること", href: "/demo" },
  { label: "デモサイト", href: "/showcase" },
  { label: "コラム", href: "/columns" },
  { label: "ご依頼・ご相談", href: "/request" },
  { label: "会社概要", href: "/company" },
];

/** フッター用の補助リンク（グローバルナビに載せない下層ページ）。 */
export const subNav: NavItem[] = [
  { label: "よくある質問", href: "/faq" },
  { label: "お問い合わせ", href: "/contact" },
  { label: "プライバシーポリシー", href: "/privacy" },
];
