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
  "Google-Extended", // Gemini 向け。検索の AI 機能は Googlebot が担当
  "Applebot-Extended", // Apple Intelligence
  "Bytespider",
  "CCBot", // Common Crawl
  "cohere-ai",
];

/**
 * プレビュー環境（GitHub Pages）かどうか。
 * 本番（さくら）とまったく同じ内容が別URLで公開されるため、そのままだと
 * 重複を避けるため、プレビューは HTML の noindex で検索対象から外す。
 */
const isPreview = process.env.GITHUB_PAGES === "true";

export default function robots(): MetadataRoute.Robots {
  // noindex を読めるようクロールは許可。GitHub project Pages の robots は
  // ホスト直下ではないため、検索除外の本体は各 HTML の meta robots。
  if (isPreview) return { rules: [{ userAgent: "*", allow: "/" }] };

  return {
    rules: [
      {
        userAgent: "*",
        // llms.txt は AI に読ませたいので、下の *.txt 除外より先に明示的に許可する
        // （Google はより長く一致したルールを優先するため、この順でも Allow が勝つ）
        allow: ["/", "/llms.txt"],
        disallow: [
          // 静的書き出しでページごとに出力される React Server Components の
          // ペイロード（/ai.txt など）。中身は本文と同じテキストを含む内部データで、
          // ページ本体と重複したうえに読み物として意味をなさない。
          // どこからもリンクしていないが、拡張子で機械的に拾われるのを防ぐ。
          "/*.txt$",
          // デモ・提案ページは noindex を読めるようクロールを許可する。
        ],
      },
      { userAgent: aiCrawlers, allow: ["/", "/llms.txt"], disallow: ["/*.txt$"] },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
