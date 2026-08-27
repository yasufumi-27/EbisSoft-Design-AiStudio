/**
 * お問い合わせフォームの選択肢定義（/contact）。
 *
 * 方針：
 * - すべて「ざっくりの想定」で選べるようにし、必須にしない。
 *   決められない項目で手が止まって離脱するのが一番もったいないため、
 *   必須はお名前・メール・「やりたいこと」の3つだけ。
 * - 費用に効く項目（維持費・対応ブラウザ・フォームの要否）は、
 *   なぜ聞いているのかを help に添えて、選ぶ判断ができるようにする。
 * - 選択肢は画面表示とメール本文の双方から参照するため、ここに集約する。
 */

export type InquiryOption = { value: string; note?: string };

export type InquiryGroup = {
  /** input の name */
  id: string;
  /** 見出し */
  label: string;
  /** 補足（なぜ聞くのか・費用への影響） */
  help?: string;
  type: "single" | "multi";
  options: InquiryOption[];
};

export const inquiryGroups: InquiryGroup[] = [
  {
    id: "budget_build",
    label: "制作費のご予算",
    help: "目安で構いません。やりたいことを伺ったうえで、予算内に収まる進め方をご提案します。",
    type: "single",
    options: [
      { value: "〜30万円" },
      { value: "30〜60万円" },
      { value: "60〜120万円" },
      { value: "120〜300万円" },
      { value: "300万円〜" },
      { value: "まだ分からない・相談したい" },
    ],
  },
  {
    id: "budget_run",
    label: "月々の維持・運用費",
    help: "サーバー・ドメイン・保守・更新代行などの合計です。ここを抑えたい場合は、その前提で設計します。",
    type: "single",
    options: [
      { value: "できるだけ抑えたい（自社で運用）" },
      { value: "〜5,000円 / 月" },
      { value: "5,000〜15,000円 / 月" },
      { value: "15,000〜50,000円 / 月" },
      { value: "50,000円〜 / 月" },
      { value: "まだ分からない・相談したい" },
    ],
  },
  {
    id: "pages",
    label: "ページ数の想定",
    help: "あとから増やすこともできます。現時点のイメージで構いません。",
    type: "single",
    options: [
      { value: "1ページ（LP・1枚もの）" },
      { value: "2〜5ページ" },
      { value: "6〜10ページ" },
      { value: "11〜30ページ" },
      { value: "31ページ以上" },
      { value: "まだ分からない" },
    ],
  },
  {
    id: "devices",
    label: "対応したい端末",
    help: "特に指定がなければ、スマートフォンとPCの両対応で設計します。",
    type: "multi",
    options: [
      { value: "スマートフォン" },
      { value: "PC" },
      { value: "タブレット" },
      { value: "おまかせ" },
    ],
  },
  {
    id: "browsers",
    label: "対応したいブラウザ",
    help: "古い環境への対応は、検証の手間が増えるぶん費用に影響します。不要なら費用を抑えられます。",
    type: "multi",
    options: [
      { value: "Chrome" },
      { value: "Safari（iPhone含む）" },
      { value: "Edge" },
      { value: "Firefox" },
      { value: "古い環境（IE等）も必要", note: "費用増" },
      { value: "おまかせ（最新の主要ブラウザ）" },
    ],
  },
  {
    id: "contact_form",
    label: "お問い合わせフォームの要否",
    help: "フォームは迷惑メール対策と送信管理が必要になるため、月々の維持費に直結します。電話・メールのみで足りる場合は不要です。",
    type: "single",
    options: [
      { value: "必要" },
      { value: "不要（電話・メールの掲載のみ）" },
      { value: "相談したい" },
    ],
  },
  {
    id: "features",
    label: "実装したい機能",
    help: "気になるものをすべて選んでください。実現方法と概算費用をお伝えします。",
    type: "multi",
    options: [
      { value: "CMS（自分で更新したい）" },
      { value: "ブログ・お知らせ" },
      { value: "予約システム" },
      { value: "EC・オンライン決済" },
      { value: "会員登録・ログイン" },
      { value: "AIチャットボット" },
      { value: "音声AI（話して聞ける）" },
      { value: "3DCG・WebGL演出" },
      { value: "AR（実物大で置いてみる）" },
      { value: "商品カスタマイズ（色・仕様を選んで価格が変わる）" },
      { value: "料金シミュレーター・自動診断" },
      { value: "AIレコメンド（おすすめ表示）" },
      { value: "行動解析・A/Bテスト" },
      { value: "アニメーション演出" },
      { value: "SNS連携" },
      { value: "既存システムとの連携" },
      { value: "多言語・インバウンド対応" },
      { value: "アプリ化（PWA）・プッシュ通知" },
      { value: "AIエージェント対応（llms.txt・MCP）" },
      { value: "訪問者による表示の出し分け" },
      { value: "アクセス解析の設置" },
      { value: "メール配信・メルマガ" },
      { value: "まだ分からない" },
    ],
  },
  {
    id: "schedule",
    label: "公開したい時期",
    type: "single",
    options: [
      { value: "できるだけ早く" },
      { value: "1か月以内" },
      { value: "3か月以内" },
      { value: "半年以内" },
      { value: "まだ分からない" },
    ],
  },
  {
    id: "purpose",
    label: "サイトの主な目的",
    type: "multi",
    options: [
      { value: "問い合わせ・見込み客の獲得" },
      { value: "会社の信頼性を高める" },
      { value: "採用" },
      { value: "商品・サービスの販売" },
      { value: "既存サイトのリニューアル" },
      { value: "業務の効率化" },
      { value: "まだ分からない" },
    ],
  },
];

/** 送信前に必ず伝えたい、ハードルを下げるためのメッセージ */
export const inquiryNotes = [
  "選択項目はすべて「ざっくりの想定」で構いません。分からない項目は空欄のままで大丈夫です。",
  "ご予算は目安で結構です。やりたいことを優先して書いていただければ、実現方法と費用のすり合わせは打ち合わせで一緒に行います。",
  "初回のご相談・お見積もりは無料です。無理な営業はいたしません。",
];
