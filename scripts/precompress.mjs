// out/ 配下のテキスト系ファイルを Brotli(.br) / gzip(.gz) で事前圧縮する。
//
// なぜ事前生成なのか：
//   さくらのレンタルサーバには mod_deflate / mod_brotli が入っておらず、
//   .htaccess に AddOutputFilterByType DEFLATE と書いても素通りする
//   （Content-Encoding が返らない）。サーバー側で圧縮できないので、
//   ビルド時に圧縮済みファイルを作っておき、.htaccess の mod_rewrite で
//   Accept-Encoding に応じて配信する。
//
// 対になる配信設定は public/.htaccess の「事前圧縮ファイルの配信」節。
// ファイル名の対応を変えるときは両方を直すこと。

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import {
  brotliCompressSync,
  gzipSync,
  constants as zlibConstants,
} from "node:zlib";

const OUT_DIR = "out";

// 圧縮する拡張子。画像・フォント（woff2）は既に圧縮済みなので対象外。
const TARGET_EXT = new Set([
  ".html",
  ".js",
  ".css",
  ".txt",
  ".xml",
  ".svg",
  ".json",
  ".webmanifest",
]);

// これ未満は圧縮しても縮まらず、リクエスト数だけ増えるので対象外。
const MIN_BYTES = 1024;

/** out/ 配下のファイルを再帰的に列挙する */
function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile()) yield path;
  }
}

let count = 0;
let raw = 0;
let br = 0;
let gz = 0;

for (const file of walk(OUT_DIR)) {
  if (!TARGET_EXT.has(extname(file))) continue;

  const source = readFileSync(file);
  if (source.length < MIN_BYTES) continue;

  // 配信時に展開しないので、ビルド時間を多少使ってでも最大圧縮でよい。
  const brotli = brotliCompressSync(source, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      [zlibConstants.BROTLI_PARAM_SIZE_HINT]: source.length,
    },
  });
  // Brotli 非対応のクライアント（古いブラウザ・一部のクローラー）向けの保険。
  const gzip = gzipSync(source, { level: 9 });

  writeFileSync(`${file}.br`, brotli);
  writeFileSync(`${file}.gz`, gzip);

  count += 1;
  raw += source.length;
  br += brotli.length;
  gz += gzip.length;
}

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)}MB`;
const pct = (n) => `${Math.round((1 - n / raw) * 100)}%`;

console.log(
  `precompress: ${count} files  raw ${mb(raw)} → br ${mb(br)} (-${pct(br)}) / gz ${mb(gz)} (-${pct(gz)})`,
);
