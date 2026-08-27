import type { MetadataRoute } from "next";
import { siteConfig, absoluteUrl } from "@/lib/site";
import { capabilities } from "@/lib/content";
import { columnsByDate } from "@/lib/columns";
import { industries } from "@/lib/showcaseData";

// output: "export"（GitHub Pages）でも静的生成できるよう明示
export const dynamic = "force-static";

/**
 * サイトマップ。/sitemap.xml として配信されます。
 * ページを追加したら、ここにも URL を足してください。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      // トップは末尾スラッシュあり（Search Console のプロパティ表記と揃える）
      url: siteConfig.homeUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    // 3本柱（AI活用 → Web制作 → 組み込み開発の順に重要度を置く）
    {
      url: absoluteUrl("/ai"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/web"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/embedded"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/faq"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/request"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/demo"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // できること（実動デモ）の各ページ
    ...capabilities.map((c) => ({
      url: absoluteUrl(`/demo/${c.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // 職種別デモサイト（職種名 × 機能の組み合わせで、業種ワードの受け皿になる）
    {
      url: absoluteUrl("/showcase"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    ...industries.map((i) => ({
      url: absoluteUrl(`/showcase/${i.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    {
      url: absoluteUrl("/showcase/generate"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    // コラム（記事は更新日を実際の更新日で申告する。毎ビルドの現在時刻を入れると
    // 「常に全ページが更新されている」という誤った申告になり、信用されなくなる）
    {
      url: absoluteUrl("/columns"),
      lastModified: new Date(columnsByDate[0]?.updated ?? lastModified),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...columnsByDate.map((c) => ({
      url: absoluteUrl(`/columns/${c.slug}`),
      lastModified: new Date(c.updated),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    {
      url: absoluteUrl("/company"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
