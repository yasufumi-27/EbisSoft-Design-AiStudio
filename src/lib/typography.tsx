import { Children, Fragment, createElement, cloneElement, isValidElement } from "react";
import boundaries from "./generated/japanese-boundaries.json";
import { phraseKey } from "./phrase-key.mjs";
import { segmentJapanese } from "./japanese-segmentation.mjs";

// Static copy is segmented during build. Both SSR and hydration use identical
// boundaries; new dynamic input uses the same pure model, never a DOM parser.
export function japanesePhrases(text: string): string[] {
  const cached = (boundaries as Record<string, number[]>)[phraseKey(text)];
  if (!cached) return segmentJapanese(text);
  let start = 0;
  return [...cached, text.length].map(end => {
    const phrase = text.slice(start, end);
    start = end;
    return phrase;
  });
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
