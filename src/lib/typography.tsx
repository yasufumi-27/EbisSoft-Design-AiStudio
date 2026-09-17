import { Children, Fragment, createElement, cloneElement, isValidElement } from "react";
import { Parser, jaModel } from "budoux";

// The same bundled model runs during export and hydration, including Safari.
// Do not use browser-dependent Intl segmentation or split at a character count.
const parser = new Parser(jaModel);

// Editorial terms and compound endings that the general model can split.
const KEEP = /そのもの|その日|システムとも|すなわち|手がかり|間取り|に対して|に関する|を通じて|切り出し|まるごと|なくす|その場しのぎ|障がい|として|について|によって|による|により|という|といった|となり|にくい|にくく|もとづく|切り替[えわ][ぁ-ゖ]*|組み込[みむん][ぁ-ゖ]*|問い合わ[せす][ぁ-ゖ]*|打ち合わせ|取り扱[いうわ][ぁ-ゖ]*|エビスソフト|コンフィギュレーター/g;
const widthOf = (text: string) => [...text].reduce((n, c) => n + (/[\x20-\x7e]/.test(c) ? 0.5 : 1), 0);

export function japanesePhrases(text: string): string[] {
  const breaks = new Set<number>();
  let offset = 0;
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
  if (last && phrases.length > 1 && widthOf(last) <= 3 && widthOf(phrases.at(-2)! + last) <= 12) {
    phrases.splice(-2, 2, phrases.at(-2)! + last);
  }
  return phrases;
}

/** Keep Japanese phrases together, with real break opportunities between them.
 * No invisible characters are added: copying, search and screen readers retain
 * the original text. CSS permits emergency wrapping in unusually narrow boxes.
 */
export function ja(text: string): React.ReactNode {
  if (!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)) return text;
  // A neutral inline custom element avoids existing decorative span selectors.
  // It needs no JavaScript registration and is readable in the static HTML.
  return createElement("j-text", { class: "ja" }, japanesePhrases(text).map((phrase, i) => (
    <Fragment key={i}><wbr/>{phrase}</Fragment>
  )));
}

/**
 * ReactNode 版。中に入っている文字列をすべて保護します。
 *
 * 見出しやボタンは `AI活用<span>の</span>Web制作` のように JSX が混ざるため、
 * 文字列だけを見ていると保護し漏れます（実際「制作期間は従来の…」が
 * `<strong>` の中にあり、「従／来」と割れていました）。
 * ここでは子要素をたどって、行き着いた文字列を ja() に通します。
 */
export function jaNode(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") return ja(node);
  if (Array.isArray(node)) {
    return Children.map(node, (child) => jaNode(child));
  }
  if (isValidElement<{ children?: React.ReactNode; className?: string; class?: string }>(node)) {
    // すでに ja() を通した部分は、二重に包まない
    const className = node.props.className ?? node.props.class;
    if (className === "ja" || className === "nb") return node;
    const children = node.props.children;
    // 子を持たない要素（<br /> や <Icon />）はそのまま
    if (children === undefined || children === null) return node;
    return cloneElement(node, undefined, jaNode(children));
  }
  return node;
}
