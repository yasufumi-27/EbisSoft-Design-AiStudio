// Twitter（X）カード用の画像は OG 画像を再利用します。
// （dynamic はビルド時に静的解析されるため、再エクスポートではなくここに直接記述）
export const dynamic = "force-static";
export { default, alt, size, contentType } from "./opengraph-image";
