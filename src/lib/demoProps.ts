import { BASE_NODES, type DemoSlug, type Industry } from "@/lib/showcase";

/**
 * デモ本体に渡す「職種別の中身」を1か所にまとめたもの。
 *
 * 職種ページ（`/showcase/<職種>`）とデモサイト（`/demosite/<職種>`）の
 * 両方から呼びます。**片方だけ職種対応が抜ける**ことを防ぐため、
 * デモに職種別の設定を足すときは必ずここに書いてください。
 *
 * ⚠️ この関数はクライアントコンポーネントからも呼ばれます。
 *    `showcaseData.ts`（18職種ぶんのデータ）を import しないこと。
 *    職種のデータは呼び出し側から `Industry` として受け取ります。
 */
export function demoPropsFor(
  slug: DemoSlug,
  industry: Industry,
  /** その職種のデモサイトに載せているQ&A（チャットボットの知識源に使う） */
  faq?: { q: string; a: string }[],
): Record<string, unknown> | undefined {
  switch (slug) {
    // 3DCG：その職種で見せたい物の3Dモデルを3種類以上出す（医療なら診療ユニット・ワゴン・待合ソファ）
    case "3dcg":
      return { productLabel: industry.product.name, models: industry.models };

    // AR：3DCGと同じ物を、実寸に直してその場に置く
    case "ar":
      return { productLabel: industry.product.name, models: industry.models };

    // システム連携：連携先の名前と、流すデータを職種のものに差し替える
    case "integration":
      return { nodes: [...BASE_NODES, ...industry.systems], catalog: industry.catalog };

    // レコメンド：その職種で実際に扱う商品・メニューを候補にする
    case "recommend":
      return { catalog: industry.catalog, industryName: industry.name };

    // チャットボット：その職種のサイトに載っているQ&Aを知識源にする
    case "ai-chatbot":
      return faq && faq.length > 0 ? { knowledge: faq, industryName: industry.name } : undefined;

    // 料金シミュレーター：試算するものが職種ごとに変わる（リフォーム費用・車検費用など）
    case "simulator":
      return industry.simulator ? { config: industry.simulator } : undefined;

    default:
      return undefined;
  }
}
