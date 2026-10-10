/** Estimate for a one-person, one-mail-service, one-calendar-service setup.
 * Labor hours are planning estimates, not recorded project results.
 * 12,500 JPY/hour and 100,000 JPY/month supplied by the business owner.
 */
export const secretaryPricing = {
  hourlyRateYen: 12_500,
  monthlyMaintenanceYen: 100_000,
  labor: [
    { label: "共通設計・連携設定", hours: 16 },
    { label: "朝の報告", hours: 12 },
    { label: "日程調整", hours: 20 },
    { label: "議事録と宿題の整理", hours: 16 },
    { label: "試行・調整・納品", hours: 16 },
  ],
  includedTaskNumbers: ["01", "03", "05"],
} as const;
export const secretaryEstimatedHours = secretaryPricing.labor.reduce((sum, item) => sum + item.hours, 0);
export const secretaryInitialYen = secretaryEstimatedHours * secretaryPricing.hourlyRateYen;
export const secretaryInitialLabel = `${secretaryInitialYen / 10_000}万円`;
export const secretaryMonthlyLabel = `${secretaryPricing.monthlyMaintenanceYen / 10_000}万円`;

/** First-party service scope and sample scenarios; no customer results are claimed. */
export const secretaryFaqs = [
  { question: "AI秘書とは何ですか？", answer: "AI秘書は、メールや予定、議事録、社内資料をもとに、情報の整理・検索・下書きを支援する仕組みです。エビスソフトでは、社長や担当者の業務、利用中のツール、確認のルールに合わせて設計・開発します。" },
  { question: "社長秘書としてAIを使えますか？", answer: "朝の予定と重要メールの整理、商談前の資料準備、会議で決まった宿題の管理、返信の下書きなどを支援できます。重要とみなす情報や報告のタイミングを社長の仕事に合わせ、判断が必要な事項は社長や担当者に戻します。" },
  { question: "秘書業務をAIに任せると、何が変わりますか？", answer: "複数の画面や資料を行き来して確認する作業を、要点と参照元をまとめて確認する流れに変えられます。どれだけ時間を減らせるかは業務や資料の状態で異なるため、試行で確認してから対象を広げます。" },
  { question: "AI秘書の開発・導入には、いくらかかりますか？", answer: `初期費用の目安は${secretaryInitialLabel}〜（税別）、運用保守は月額${secretaryMonthlyLabel}（税別）です。基本構成には「朝の報告」「日程調整」「議事録と宿題の整理」の3機能を含みます。1人分、メール・カレンダー各1サービス、既存の会議メモや文字起こしデータの利用を想定した概算です。連携先や対象業務により正式なお見積もりを提示します。追加機能、AI・外部サービスの利用料は別途です。` },
  { question: "導入までの期間はどのくらいですか？", answer: "連携するサービスのAPI・契約・権限、対象データの準備状況によって変わります。ヒアリング後に、ひとつの業務で試す範囲と期間を提示し、試行・評価・本導入の順に進めます。" },
  { question: "今使っているメールやカレンダーと連携できますか？", answer: "ご利用中のサービスに提供されているAPI、契約プラン、管理者の設定とアクセス権限を確認して判断します。連携できる情報と操作範囲を確認してから、具体的な構成をご提案します。" },
  { question: "メール送信や予定変更を自動で行いますか？", answer: "外部への送信、予定の確定・変更、社外への共有は、人の承認を挟む設計を基本にします。誰が承認し、どの操作を許可するかを導入前に定めます。" },
  { question: "社内情報や個人情報は、どう扱いますか？", answer: "参照できる資料、利用者の権限、データの保存先・保持期間、利用するAIサービスへの送信範囲を事前に整理します。業務に不要な情報は対象に含めず、回答と操作の履歴を確認できる構成を検討します。AIの出力には誤りが含まれる可能性があるため、重要な内容は担当者が確認します。" },
];
export const secretaryTasks = [
  { number: "01", title: "朝の報告", body: "今日の予定、重要メール、判断待ちの事項を整理。報告の時間と優先順位を、社長の仕事に合わせます。", output: "予定・要点・要確認事項" },
  { number: "02", title: "メールの下書き", body: "受信内容と過去のやり取りをもとに返信案を作成。宛先・内容を確認してから送信する流れを設計します。", output: "要約・返信案・参照元" },
  { number: "03", title: "日程調整", body: "カレンダーの空き時間と参加者の条件を照合して候補を整理。登録や変更は承認を挟みます。", output: "候補日時・確認する条件" },
  { number: "04", title: "商談・会議の準備", body: "共有資料と前回の記録から、相手先の情報、決定事項、今回確認したい点をまとめます。", output: "事前メモ・資料のリンク" },
  { number: "05", title: "議事録と宿題の整理", body: "会議メモや文字起こしから、決定事項・担当者・期限を抽出。担当が曖昧な事項も確認項目に残します。", output: "議事録・担当者・期限" },
  { number: "06", title: "社内資料の検索", body: "閲覧権限のあるマニュアルやFAQから必要な情報を検索。参照元を添えて、確認しやすい回答を返します。", output: "根拠のある回答・資料名" },
];
