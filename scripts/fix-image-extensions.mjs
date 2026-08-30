// 画像メタデータのルート（opengraph-image / twitter-image / apple-icon）に
// 拡張子つきの複製を作り、out/ 配下の参照をそちらへ書き換える。
//
// なぜ必要か：
//   Next の画像メタデータ規約は拡張子のないURL（/opengraph-image）を出力する。
//   Next のサーバが配信するあいだは Content-Type: image/png が付くので問題ない。
//   ところが output: "export" した成果物を GitHub Pages やさくらのレンタルサーバ
//   （＝素のファイルサーバ）に置くと、**MIMEタイプは拡張子から決まる**ため、
//   拡張子なしのファイルは application/octet-stream で配信される。
//   実測（GitHub Pages）：
//     $ curl -I .../opengraph-image → content-type: application/octet-stream
//
//   この状態だと、
//     - X / Facebook / Slack / LINE は og:image を画像と認識せず、カードが無画像になる
//     - 構造化データの logo / image も画像として取得できず、ナレッジパネルに使われない
//   という実害が出る。SEO設定そのものは正しいのに、配信の一段だけで無効化される。
//
// 対処：
//   拡張子つきのコピー（/opengraph-image.png 等）を置き、HTML・JSON-LD からの参照を
//   そちらに向ける。元の拡張子なしファイルは、既に共有されたURLのために残しておく。
//   src/lib/jsonld.ts の OG_IMAGE_PATH / OG_LOGO_PATH がこの命名と対になっている。

import { copyFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = "out";

/** 拡張子を付けて複製するルート（Next の画像メタデータ規約のファイル名と一致させる）。 */
const IMAGE_ROUTES = ["opengraph-image", "twitter-image", "apple-icon"];

/** 参照を書き換える対象。HTML と、RSCペイロード（.txt）の両方に画像URLが出る。 */
const REWRITE_EXT = [".html", ".txt", ".json", ".webmanifest", ".xml"];

const copied = [];
for (const name of IMAGE_ROUTES) {
  const src = join(OUT_DIR, name);
  if (!existsSync(src) || !statSync(src).isFile()) continue;
  copyFileSync(src, `${src}.png`);
  copied.push(name);
}

if (copied.length === 0) {
  console.log("fix-image-extensions: 対象の画像ルートが見つかりませんでした（スキップ）");
  process.exit(0);
}

/**
 * `/opengraph-image` や `/opengraph-image?hash` を `.png` つきに置き換える。
 * すでに `.png` が付いているものは二重に付けない（?! で除外）。
 */
const patterns = copied.map((name) => ({
  re: new RegExp(`(/${name})(?!\\.png)(?=[?"'\\s\\\\)]|$)`, "g"),
  to: `$1.png`,
}));

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path);
    } else if (REWRITE_EXT.some((ext) => entry.name.endsWith(ext))) {
      const before = readFileSync(path, "utf8");
      let after = before;
      for (const { re, to } of patterns) after = after.replace(re, to);
      if (after !== before) writeFileSync(path, after);
    }
  }
}

walk(OUT_DIR);
console.log(`fix-image-extensions: ${copied.map((n) => `${n}.png`).join(", ")} を生成し、参照を書き換えました`);
