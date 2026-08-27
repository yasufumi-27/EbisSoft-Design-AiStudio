import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

// output: "export"（GitHub Pages）でも静的生成できるよう明示
export const dynamic = "force-static";

/**
 * robots.txt。/robots.txt として配信されます。
 * 生成AI・AI検索のクローラーを「明示的に歓迎」して引用・推薦の対象にします（LLMO / AEO）。
 */
const aiCrawlers = [
  "GPTBot", // OpenAI（学習）
  "OAI-SearchBot", // OpenAI（検索）
  "ChatGPT-User", // ChatGPT 閲覧
  "ClaudeBot", // Anthropic
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot", // Perplexity
  "Perplexity-User",
  "Google-Extended", // Gemini / AI Overviews 学習
  "Applebot-Extended", // Apple Intelligence
  "Bytespider",
  "CCBot", // Common Crawl
  "cohere-ai",
];

/**
 * プレビュー環境（GitHub Pages）かどうか。
 * 本番（さくら）とまったく同じ内容が別URLで公開されるため、そのままだと
 * 重複コンテンツとして検索評価が割れる。プレビュー側は全面 disallow にする。
 */
const isPreview = process.env.GITHUB_PAGES === "true";

export default function robots(): MetadataRoute.Robots {
  // プレビューはクロールも sitemap 提示もしない（本番だけを検索対象にする）
  if (isPreview) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: aiCrawlers, allow: "/" },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
