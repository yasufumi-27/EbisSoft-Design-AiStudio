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
          // 職種別デモサイトは「お客様のサイトの再現」であって当社の情報ではない。
          // 各ページに noindex も入れているが、クロール自体も抑える。
          "/demosite/",
          // 検討用のデザイン提案ページ（noindex と併用）
          "/proposal",
        ],
      },
      { userAgent: aiCrawlers, allow: ["/", "/llms.txt"], disallow: ["/*.txt$", "/demosite/", "/proposal"] },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
