import { Parser } from "./generated/budoux-parser.mjs";
import { model as jaModel } from "./generated/budoux-ja.mjs";

// Only dynamic text missing from the build cache initializes this small pure parser.
let parser;

// Editorial terms and compound endings that the general model can split.
const KEEP = /そのもの|その日|システムとも|すなわち|手がかり|間取り|に対して|に関する|を通じて|切り出し|まるごと|なくす|その場しのぎ|障がい|として|について|によって|による|により|という|といった|となり|にくい|にくく|もとづく|切り替[えわ][ぁ-ゖ]*|組み込[みむん][ぁ-ゖ]*|問い合わ[せす][ぁ-ゖ]*|打ち合わせ|取り扱[いうわ][ぁ-ゖ]*|エビスソフト|コンフィギュレーター/g;
const widthOf = (text) => [...text].reduce((n, c) => n + (/[\x20-\x7e]/.test(c) ? 0.5 : 1), 0);

export function segmentJapanese(text) {
  const breaks = new Set();
  let offset = 0;
  parser ??= new Parser(jaModel);
  for (const phrase of parser.parse(text)) {
    offset += phrase.length;
    if (offset < text.length) breaks.add(offset);
  }
  // Long compound technical terms may break at their component boundary,
  // never after an arbitrary number of characters.
  for (const match of text.matchAll(/(?:Web内|商品)(?=アニメーション|カスタマイズ)|アニメーション(?=ライブラリ|制作)|プライバシー(?=ポリシー)|デモサイトを(?=のぞいて)/g)) {
    breaks.add(match.index + match[0].length);
  }
  for (const match of text.matchAll(KEEP)) {
    for (const position of breaks) {
      if (position > match.index && position < match.index + match[0].length) breaks.delete(position);
    }
  }
  const points = [0, ...[...breaks].sort((a, b) => a - b), text.length];
  const phrases = points.slice(1).map((end, i) => text.slice(points[i], end));
  const last = phrases.at(-1);
  if (last && phrases.length > 1 && widthOf(last) <= 3 && widthOf(phrases.at(-2) + last) <= 12) {
    phrases.splice(-2, 2, phrases.at(-2) + last);
  }
  return phrases;
}
