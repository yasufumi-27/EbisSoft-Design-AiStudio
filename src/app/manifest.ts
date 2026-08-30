import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

// output: "export"（GitHub Pages）でも静的生成できるよう明示
export const dynamic = "force-static";

/**
 * マニフェスト内のパスには Next.js が basePath を自動付与しないため、
 * ここで明示的に付ける（GitHub Pages のサブパス配信で 404 になるのを防ぐ）。
 */
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Web App Manifest。/manifest.webmanifest として配信されます。 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    lang: siteConfig.lang,
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#07050e",
    // ブラウザUIの色。ロゴのメインカラー（ネイビー）に合わせる
    theme_color: "#0f2e5f",
    icons: [
      { src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: `${base}/apple-icon.png`, sizes: "180x180", type: "image/png" },
      { src: `${base}/favicon.ico`, sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
