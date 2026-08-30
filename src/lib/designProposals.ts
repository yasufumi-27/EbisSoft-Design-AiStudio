/**
 * デザイン案15種の単一情報源。
 *
 * もとになっているのは、検討用に別途つくった15案のプレビュー
 * （`EbisSoft-Design-Proposals` リポジトリ）です。配色・字面・角の丸み・
 * 罫線の濃さといった「その案らしさ」を決めている値を、案ごとに抜き出しています。
 *
 * 使い先は2つ：
 *   1. できることのデモ（`/demo/<slug>`）… 15のデモに15案を**1対1**で割り当てる
 *   2. 職種別デモサイト（`/demosite/<職種>`）… 職種ごとに案を割り当てる
 *
 * どちらも「その案でこの画面を作るとこうなる」という見本なので、
 * サイト本体（03 AI STUDIO で統一）とは意図的に違う見た目になります。
 * どの案かは画面上に必ず出すこと（見ている人が混乱しないように）。
 *
 * ※ ここで定義するのは**見た目のトークンだけ**です。デモの機能・文言・
 *    掲載内容は案によって変わりません（`content.ts` / `demoSiteData.ts` が持つ）。
 */

/** 15案のID。CSSのクラス名（`dp-<id>` / `ds-<id>`）にもそのまま使う */
export type ProposalId =
  | "lumora"
  | "baseline"
  | "ai-studio"
  | "codescan"
  | "laocoon"
  | "wanderlust"
  | "soda"
  | "vesper"
  | "new-era"
  | "stride"
  | "loopstack"
  | "auralis"
  | "altitude"
  | "forma"
  | "vexon";

export type Proposal = {
  id: ProposalId;
  /** 一覧での通し番号（"01"〜"15"） */
  no: string;
  /** 案の名前（英字） */
  name: string;
  /** 案の性格（日本語の一言） */
  jp: string;
  /** 何をどう見せる案なのか */
  note: string;
  /** 明るい面を基調にする案かどうか（文字色・影の付け方が変わる） */
  light: boolean;
  tokens: {
    /** 地の色 */
    bg: string;
    /** ひと段沈めた（または浮かせた）面 */
    surface: string;
    /** さらに一段の面。表のヘッダーや押し込み状態に使う */
    surface2: string;
    /** 罫線 */
    line: string;
    /** 本文の色 */
    ink: string;
    /** 補助テキストの色 */
    muted: string;
    /** 主アクセント */
    accent: string;
    /** 主アクセントの上に乗る文字の色 */
    accentInk: string;
    /** 副アクセント（状態表示・第2の強調） */
    accent2: string;
    /** 角の丸み */
    radius: string;
    /** 見出しの書体 */
    headFont: string;
    /** 見出しの字送り */
    headSpacing: string;
    /** 見出しの太さ */
    headWeight: string;
    /** 英字ラベルの字送り（案ごとの「密度」がいちばん出るところ） */
    labelSpacing: string;
  };
};

/** 明朝・セリフ（和欧混植）。石碑や紙面の質感を出す案で使う */
const SERIF = '"Hiragino Mincho ProN", "Yu Mincho", Georgia, serif';
/** 等幅。端末・計器の質感を出す案で使う */
const MONO = '"SFMono-Regular", Menlo, Consolas, "Courier New", monospace';
/** 既定のサンセリフ（サイト本体と同じ） */
const SANS = "var(--font-geist-sans), system-ui, sans-serif";
/** 幾何学サンセリフ。近未来寄りの案の見出しに使う */
const DISPLAY = "var(--font-orbitron), var(--font-geist-sans), system-ui, sans-serif";

export const proposals: Proposal[] = [
  {
    id: "lumora",
    no: "01",
    name: "Lumora",
    jp: "静謐なプロダクトスタジオ",
    note: "余白と巨大文字、流体的な光。作ったものを主役にして、UIは黙る。",
    light: false,
    tokens: {
      bg: "#0b0c0f",
      surface: "#17191d",
      surface2: "#202329",
      line: "rgba(238,234,226,0.16)",
      ink: "#eeeae2",
      muted: "#88898e",
      accent: "#cfd6a3",
      accentInk: "#0b0c0f",
      accent2: "#a19f94",
      radius: "0px",
      headFont: SANS,
      headSpacing: "-0.05em",
      headWeight: "500",
      labelSpacing: "0.18em",
    },
  },
  {
    id: "baseline",
    no: "02",
    name: "Baseline",
    jp: "信頼を積み上げるクラブ",
    note: "濃紺と生成り、端正なグリッド。長く付き合う相手としての品格。",
    light: false,
    tokens: {
      bg: "#082b4a",
      surface: "#0c3559",
      surface2: "#e9dfc4",
      line: "rgba(237,229,203,0.32)",
      ink: "#f0e8d2",
      muted: "#b6c7cc",
      accent: "#e9dfc4",
      accentInk: "#082b4a",
      accent2: "#c5e0de",
      radius: "0px",
      headFont: SERIF,
      headSpacing: "0.02em",
      headWeight: "400",
      labelSpacing: "0.16em",
    },
  },
  {
    id: "ai-studio",
    no: "03",
    name: "AI Studio",
    jp: "未来を試作するラボ",
    note: "クロームの核と紫の光。計器盤のような密度で、先進性を見せる。",
    light: false,
    tokens: {
      bg: "#07050e",
      surface: "#0c0815",
      surface2: "#151022",
      line: "rgba(182,126,255,0.27)",
      ink: "#f4effa",
      muted: "#a393af",
      accent: "#b67eff",
      accentInk: "#0b0711",
      accent2: "#aaffdc",
      radius: "0px",
      headFont: DISPLAY,
      headSpacing: "-0.045em",
      headWeight: "600",
      labelSpacing: "0.16em",
    },
  },
  {
    id: "codescan",
    no: "04",
    name: "Codescan",
    jp: "現場を見通す管制室",
    note: "映像壁と走査線。等幅の文字と緑の信号で、監視室の解像度を出す。",
    light: false,
    tokens: {
      bg: "#050706",
      surface: "#0a0f0c",
      surface2: "#101a14",
      line: "rgba(125,255,176,0.24)",
      ink: "#cfddd3",
      muted: "#6f8478",
      accent: "#7dffb0",
      accentInk: "#04140b",
      accent2: "#eaff7d",
      radius: "0px",
      headFont: MONO,
      headSpacing: "0.02em",
      headWeight: "600",
      labelSpacing: "0.2em",
    },
  },
  {
    id: "laocoon",
    no: "05",
    name: "Laocoon",
    jp: "技術を彫刻する工房",
    note: "青銅と火花。明朝の見出しで、削り出す仕事としての手触りを出す。",
    light: false,
    tokens: {
      bg: "#07161d",
      surface: "#0d2029",
      surface2: "#132b36",
      line: "rgba(234,219,200,0.22)",
      ink: "#eadbc8",
      muted: "#93a3a6",
      accent: "#c98b46",
      accentInk: "#07161d",
      accent2: "#e5b877",
      radius: "0px",
      headFont: SERIF,
      headSpacing: "0.04em",
      headWeight: "400",
      labelSpacing: "0.18em",
    },
  },
  {
    id: "wanderlust",
    no: "06",
    name: "Wanderlust",
    jp: "遠くまで伴走する開発",
    note: "風吹く大地と静かな朝。長い旅程として、道のりごと見せる。",
    light: false,
    tokens: {
      bg: "#151d20",
      surface: "#1d272a",
      surface2: "#263235",
      line: "rgba(238,233,220,0.18)",
      ink: "#eee9dc",
      muted: "#98a29b",
      accent: "#d9b382",
      accentInk: "#151d20",
      accent2: "#8fa38a",
      radius: "2px",
      headFont: SANS,
      headSpacing: "-0.02em",
      headWeight: "600",
      labelSpacing: "0.16em",
    },
  },
  {
    id: "soda",
    no: "07",
    name: "Soda",
    jp: "触れて選べるソフトウェア",
    note: "浮遊するプロダクトと味の切り替え。難しい技術ほど、触りたくなる形に。",
    light: true,
    tokens: {
      bg: "#ff6b75",
      surface: "#fff5f0",
      surface2: "#ffe3dd",
      line: "rgba(55,18,29,0.18)",
      ink: "#37121d",
      muted: "#7a4450",
      accent: "#77213a",
      accentInk: "#fff5f0",
      accent2: "#ffc83d",
      radius: "999px",
      headFont: SANS,
      headSpacing: "-0.03em",
      headWeight: "800",
      labelSpacing: "0.1em",
    },
  },
  {
    id: "vesper",
    no: "08",
    name: "Vesper",
    jp: "思考するインターフェース",
    note: "光の雲が知性へ変わる。対話そのものを主役に据える。",
    light: false,
    tokens: {
      bg: "#060713",
      surface: "#0c1024",
      surface2: "#131a33",
      line: "rgba(110,231,200,0.22)",
      ink: "#edf9f5",
      muted: "#8697a3",
      accent: "#6ee7c8",
      accentInk: "#04120e",
      accent2: "#9db8ff",
      radius: "999px",
      headFont: SANS,
      headSpacing: "-0.04em",
      headWeight: "600",
      labelSpacing: "0.16em",
    },
  },
  {
    id: "new-era",
    no: "09",
    name: "New Era",
    jp: "小さな光から大きな変化へ",
    note: "橙の一点と青の粒子。ひとつの課題から事業全体へ広がる筋を見せる。",
    light: false,
    tokens: {
      bg: "#020714",
      surface: "#071329",
      surface2: "#0f2144",
      line: "rgba(255,125,53,0.28)",
      ink: "#f1f5ff",
      muted: "#8592ac",
      accent: "#ff7d35",
      accentInk: "#1a0a02",
      accent2: "#4b8fff",
      radius: "0px",
      headFont: DISPLAY,
      headSpacing: "-0.045em",
      headWeight: "600",
      labelSpacing: "0.18em",
    },
  },
  {
    id: "stride",
    no: "10",
    name: "Stride",
    jp: "事業を前進させる技術",
    note: "深い青と光のフィラメント。正確さと勢いを、数値で示す。",
    light: false,
    tokens: {
      bg: "#031a49",
      surface: "#04225d",
      surface2: "#082e75",
      line: "rgba(124,196,255,0.26)",
      ink: "#eef5ff",
      muted: "#9db4d6",
      accent: "#7cc4ff",
      accentInk: "#031a49",
      accent2: "#5ee6a8",
      radius: "4px",
      headFont: SANS,
      headSpacing: "-0.04em",
      headWeight: "700",
      labelSpacing: "0.14em",
    },
  },
  {
    id: "loopstack",
    no: "11",
    name: "Loopstack",
    jp: "言葉の後ろで咲く仕組み",
    note: "黒い画布に咲くブルーム。言葉を大胆に置き、技術は背後で静かに働く。",
    light: false,
    tokens: {
      bg: "#030304",
      surface: "#0d0b10",
      surface2: "#171320",
      line: "rgba(255,255,255,0.18)",
      ink: "#ffffff",
      muted: "#8d8794",
      accent: "#e86ab5",
      accentInk: "#1a0410",
      accent2: "#c8ff4d",
      radius: "999px",
      headFont: SANS,
      headSpacing: "-0.06em",
      headWeight: "500",
      labelSpacing: "0.2em",
    },
  },
  {
    id: "auralis",
    no: "12",
    name: "Auralis",
    jp: "変化し続ける開発スタジオ",
    note: "銀色の空間と無数のビーズ。課題に合わせて姿を変えることを見せる。",
    light: true,
    tokens: {
      bg: "#d8dadb",
      surface: "#ffffff",
      surface2: "#eceeef",
      line: "rgba(21,23,25,0.18)",
      ink: "#151719",
      muted: "#5f6669",
      accent: "#2f3437",
      accentInk: "#ffffff",
      accent2: "#8b9296",
      radius: "999px",
      headFont: SANS,
      headSpacing: "-0.05em",
      headWeight: "600",
      labelSpacing: "0.16em",
    },
  },
  {
    id: "altitude",
    no: "13",
    name: "Altitude",
    jp: "視界の先まで見通す",
    note: "星空と山並み、暖色と寒色のインク。静かな自信で、先の運用まで描く。",
    light: false,
    tokens: {
      bg: "#071426",
      surface: "#0c1e35",
      surface2: "#132a46",
      line: "rgba(242,238,226,0.2)",
      ink: "#f2eee2",
      muted: "#8fa0b3",
      accent: "#e8a33d",
      accentInk: "#071426",
      accent2: "#6fa8dc",
      radius: "2px",
      headFont: SANS,
      headSpacing: "-0.035em",
      headWeight: "600",
      labelSpacing: "0.18em",
    },
  },
  {
    id: "forma",
    no: "14",
    name: "Forma",
    jp: "相談から形が立ち上がる",
    note: "ラベンダーの谷と段階的なフォーム。曖昧な相談を、形にしていく過程を見せる。",
    light: true,
    tokens: {
      bg: "#b6a2ee",
      surface: "#f4f1ff",
      surface2: "#e3ddfa",
      line: "rgba(37,23,68,0.18)",
      ink: "#251744",
      muted: "#5c4f80",
      accent: "#4a2fa8",
      accentInk: "#f4f1ff",
      accent2: "#ffb37a",
      radius: "12px",
      headFont: SANS,
      headSpacing: "-0.04em",
      headWeight: "700",
      labelSpacing: "0.14em",
    },
  },
  {
    id: "vexon",
    no: "15",
    name: "Vexon",
    jp: "データを競争力へ変える",
    note: "端末の緑と高密度なデータ表示。ノイズを削り、信号だけを残す。",
    light: false,
    tokens: {
      bg: "#020304",
      surface: "#060b08",
      surface2: "#0b140f",
      line: "rgba(0,255,156,0.22)",
      ink: "#effff6",
      muted: "#6f8a7c",
      accent: "#00ff9c",
      accentInk: "#01130a",
      accent2: "#7de3ff",
      radius: "0px",
      headFont: MONO,
      headSpacing: "0.01em",
      headWeight: "600",
      labelSpacing: "0.22em",
    },
  },
];

const byId = new Map(proposals.map((p) => [p.id, p]));

/** IDから案を引く。見つからなければ 03 AI STUDIO（サイト本体の案）を返す */
export function proposalById(id: ProposalId | string): Proposal {
  return byId.get(id as ProposalId) ?? byId.get("ai-studio")!;
}

/**
 * できることのデモ → デザイン案（1対1）。
 *
 * 「その機能を見せるのに、いちばん強い案はどれか」で組んでいます。
 * 例：色を選ぶコンフィギュレーターは味を選ぶ Soda、行動解析は管制室の Codescan。
 */
export const demoProposal: Record<string, ProposalId> = {
  "3dcg": "lumora", // 作ったものを主役にする案。3Dの被写体が引き立つ
  configurator: "soda", // 触れて選ぶ・色が変わる、がそのまま案の主題
  animation: "loopstack", // 黒い画布に咲くブルーム＝動きの見せ場
  "ai-chatbot": "vesper", // 対話するインターフェースそのもの
  simulator: "stride", // 数値とダッシュボードの案
  recommend: "vexon", // データを競争力へ変える案
  ar: "auralis", // 課題に合わせて姿を変える＝現実に重ねる
  voice: "new-era", // 小さな一点の光が波として広がる
  multilingual: "wanderlust", // 遠くまで、国境を越えて
  "ai-agent": "ai-studio", // ラボでエージェントを試作する
  personalize: "forma", // 一人ひとりに合わせて形が立ち上がる
  insight: "codescan", // 行動を見通す管制室
  pwa: "altitude", // 電波の届かない先まで連れていく
  sns: "baseline", // 人が集まり続けるクラブ
  integration: "laocoon", // 噛み合わせを削り出す工房仕事
};

/**
 * 職種 → デザイン案。
 *
 * 職種18に対して案は15なので、3組だけ意図的に重ねています
 * （医療と介護、物流とSaaS、小売とアパレル。扱う情報の性格が近いため）。
 */
export const industryProposal: Record<string, ProposalId> = {
  retail: "soda",
  restaurant: "laocoon",
  clinic: "vesper",
  manufacturing: "codescan",
  realestate: "altitude",
  construction: "stride",
  school: "new-era",
  legal: "baseline",
  beauty: "loopstack",
  fitness: "auralis",
  hotel: "lumora",
  logistics: "vexon",
  auto: "ai-studio",
  agriculture: "wanderlust",
  bridal: "forma",
  care: "vesper", // 医院と同じ言語で束ねる
  saas: "vexon", // 物流と同じ「データ基盤」の言語
  apparel: "soda", // 小売と同じ「手に取る商材」の言語
};
