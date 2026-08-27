#!/usr/bin/env node
/**
 * 静的書き出し（out/）から、各ページの「初期表示に必要な転送量」を測って表示する。
 *
 * 目的は数字での回帰検知：クライアントコンポーネントがうっかり大きなモジュール
 * （content.ts など）を巻き込むと、見た目は何も変わらないまま初期JSだけが増える。
 * Next.js 16 はビルド時にサイズ表を出さないため、それに気づく手段がこれになる。
 *
 * 使い方：
 *   npm run build:pages && npm run size
 *
 * 内訳を目で追いたいときは、モジュール単位で追跡できる公式のアナライザを使う：
 *   npm run analyze
 */

import { readFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "out");

/** 代表的なページ。トップだけでなく、重い側（デモ）も定点観測する。 */
const PAGES = [
  { label: "/ (トップ)", file: "index.html" },
  { label: "/ai", file: "ai.html" },
  { label: "/web", file: "web.html" },
  { label: "/demo", file: "demo.html" },
  { label: "/demo/3dcg", file: "demo/3dcg.html" },
  { label: "/contact", file: "contact.html" },
  // デモサイト（装飾を読み込まないぶん軽いことを確認するため）
  { label: "/showcase", file: "showcase.html" },
  { label: "/showcase/retail", file: "showcase/retail.html" },
  { label: "/columns/...", file: "columns/ai-web-seisaku.html" },
];

/** 目安：これを超えたら黄信号（初期JSのgzip合計 / KB）。 */
const WARN_JS_KB = 220;

if (!existsSync(outDir)) {
  console.error("out/ がありません。先に `npm run build:pages` を実行してください。");
  process.exit(1);
}

const gzipKb = (buf) => gzipSync(buf).length / 1024;

/** 日本語（全角）は端末上で2文字分の幅を取るため、桁を揃えるには数えて補正する。 */
const width = (s) => [...s].reduce((n, c) => n + (/[\x00-\xff]/.test(c) ? 1 : 2), 0);
const padStart = (s, w) => " ".repeat(Math.max(0, w - width(s))) + s;
const padEnd = (s, w) => s + " ".repeat(Math.max(0, w - width(s)));

const fmt = (kb) => padStart(`${kb.toFixed(1)} KB`, 10);

/** HTML が読み込む静的アセット（同じものは1度だけ数える）を集計する。 */
function measure(htmlPath) {
  const html = readFileSync(htmlPath);
  const text = html.toString("utf8");

  const collect = (re) => [...new Set([...text.matchAll(re)].map((m) => m[1]))];
  const assets = (paths) =>
    paths.reduce(
      (acc, p) => {
        // basePath（/EbisSoft）を剥がして out/ 配下の実ファイルに対応させる
        const file = join(outDir, p.replace(/^\/EbisSoft/, "").replace(/^\//, ""));
        if (!existsSync(file)) return acc;
        return { count: acc.count + 1, kb: acc.kb + gzipKb(readFileSync(file)) };
      },
      { count: 0, kb: 0 },
    );

  return {
    html: gzipKb(html),
    js: assets(collect(/<script[^>]+src="([^"]+\.js)"/g)),
    css: assets(collect(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g)),
    font: assets(collect(/<link[^>]+rel="preload"[^>]+href="([^"]+\.woff2)"/g)),
  };
}

console.log("初期表示に必要な転送量（gzip後）\n");
console.log(
  padEnd("ページ", 16) +
    padStart("HTML", 10) +
    padStart("JS", 10) +
    padStart("CSS", 10) +
    padStart("フォント", 10) +
    padStart("合計", 10),
);
console.log("-".repeat(66));

let warned = false;

for (const page of PAGES) {
  const path = join(outDir, page.file);
  if (!existsSync(path)) continue;

  const m = measure(path);
  const total = m.html + m.js.kb + m.css.kb + m.font.kb;
  const mark = m.js.kb > WARN_JS_KB ? " ←JSが目安超え" : "";
  if (mark) warned = true;

  console.log(
    padEnd(page.label, 16) + fmt(m.html) + fmt(m.js.kb) + fmt(m.css.kb) + fmt(m.font.kb) + fmt(total) + mark,
  );
}

console.log("-".repeat(66));
console.log(`※ JS の目安は ${WARN_JS_KB} KB（gzip後）。超えたら何が増えたか npm run analyze で確認する。`);

if (warned) process.exitCode = 1;
