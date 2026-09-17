// Run from the repository root: node scripts/check-typography.mjs
// Use the existing TypeScript dependency to load the React helper for assertions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const filename = `${process.cwd()}/src/lib/typography.tsx`;
const loaded = new Module(filename);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(process.cwd());
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText, filename);
const { japanesePhrases, jaNode } = loaded.exports;

const examples = [
  ['その日のうちに、既存のシステムともつながります。', ['その日', 'システムとも']],
  ['「こんなこと、できたら」を、使える仕組みに。', ['仕組み']],
  ['問い合わせを増やす仕組みを組み込みます。', ['問い合わせ', '組み込み']],
  ['AI機能そのものを、つくる。', ['そのもの']],
  ['商品カスタマイズ機能（コンフィギュレーター）の開発費用と実例', ['コンフィギュレーター']],
  ['ホームページのアニメーション制作費用と実例', ['アニメーション', '制作費用']],
  ['プライバシーポリシー', ['プライバシー', 'ポリシー']],
  ['切り替えることで、不安をなくすための機能です。', ['切り替える', 'なくす']],
];
for (const [text, words] of examples) {
  const chunks = japanesePhrases(text);
  assert.equal(chunks.join(''), text, 'Segmentation must preserve the original text');
  for (const word of words) {
    assert(chunks.some(chunk => chunk.includes(word)), `${word} must stay together: ${chunks.join('|')}`);
  }
}
const link = createElement('a', { href: '/contact', 'aria-label': '相談' },
  createElement('strong', null, 'お問い合わせ'), 'はこちら');
const html = renderToStaticMarkup(jaNode(link));
assert(html.includes('href="/contact"'));
assert(html.includes('aria-label="相談"'));
assert(html.includes('<strong>'));
assert(!html.includes('\u200b'), 'Do not insert invisible characters into copied text');
assert.equal(html.replace(/<[^>]*>/g, ''), 'お問い合わせはこちら');
console.log('PASS: Japanese word boundaries, original text, links and inline markup');
