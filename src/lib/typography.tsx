import { Children, Fragment, cloneElement, isValidElement } from "react";

/**
 * 日本語の組版ヘルパー。
 *
 * ブラウザは日本語を「どの文字の間でも折り返してよい」と扱うため、放っておくと
 * 「チャット／ボット」「従／来」「いた／だけます」のように語の途中で切れます。
 * 読み手には誤字のように見えるので、文章を語のまとまりに切り、
 * それぞれを .nb で包んで内部で折り返さないようにします（CSSは globals.css）。
 *
 * CSS の `word-break: auto-phrase`（文節での折り返し）は当てにできません。
 * `CSS.supports()` は true を返すのに、実際の折り返し位置は何も変わらず、
 * カタカナすら「ソフトウェ／ア」と割れることを実測で確認しています（2026-08-03）。
 * そのため、どこで切ってよいかはここ（サーバー側）で決めます。
 *
 * - サーバー側で組み立てるだけなので、クライアントJSは増えません。
 * - 文字は一切足さない（U+2060 等を挟まない）ため、コピー・読み上げ・
 *   検索エンジンの読み取りには影響しません。
 */

/**
 * 語のまとまり（おおよその文節）。左から順に試されるので、長いものを先に置くこと。
 *
 * 日本語は「自立語（漢字・カタカナ・英数字）＋付属語（ひらがな）」で1つの塊になるため、
 * 自立語のうしろに続くひらがなを、その語に含めています。
 * 「制作期間は」「開発しています」「お問い合わせください」のように、
 * 読むときに息継ぎする単位でだけ改行されるようになります。
 *
 * 1. スラッシュで並べた略語（SEO / AEO / LLMO、BLE / Wi-Fi / MQTT）。
 *    区切りの前後で改行されると「（AEO /」で行が終わり「LLMO）」だけが次の行に残る。
 * 2. ハイフン・ドット・スラッシュでつながる英数字（Wi-Fi / N-gram / llms.txt / Three.js）。
 * 3. カタカナ語（前後に続く英数字も一続き。AIチャットボット・PWA対応の「AI」など）。
 * 4. 数量と単位（298,000円／約1/3／最短5日／3〜4週間／15領域）。
 * 5. 漢字（熟語・送り仮名つき）。
 * 6. ひらがなだけの語（ください・いただけます・そのもの）。
 * 7. 英数字（上のどれにも当てはまらないもの）。
 */
const CHUNK = new RegExp(
  [
    "[A-Za-z][A-Za-z0-9+#]*(?: / [A-Za-z0-9+#]+)+",
    "[A-Za-z][A-Za-z0-9+#]*(?:[-./][A-Za-z0-9+#]+)+",
    "[A-Za-z0-9]*[ァ-ヺー]+[A-Za-z0-9]*[ぁ-ゖ]*",
    "[0-9][0-9,./〜～-]*[一-鿿々]{0,3}[ぁ-ゖ]*",
    "[一-鿿々]+[ぁ-ゖ]*",
    "[ぁ-ゖ]+",
    "[A-Za-z0-9]+[ぁ-ゖ]*",
  ].join("|"),
  "g",
);

/**
 * ひとまとまりの上限（全角の文字数に換算）。
 *
 * これを超える長さを折り返し禁止にすると、狭い画面のカードで行から溢れます。
 * 超えたぶんは次のまとまりへ送るので、長い語は「なるべく後ろで」割れます。
 */
const MAX_WIDTH = 9;

/** 見た目の幅（全角＝1、半角＝0.5）。 */
function widthOf(char: string) {
  return /[\x20-\x7e]/.test(char) ? 0.5 : 1;
}

/** 先頭から MAX_WIDTH に収まる文字数（最低1文字）。 */
function takeFit(word: string) {
  let width = 0;
  for (let i = 0; i < word.length; i++) {
    width += widthOf(word[i]);
    if (width > MAX_WIDTH) return Math.max(1, i);
  }
  return word.length;
}

/** 文字列を「語のまとまり」に切り、折り返し禁止の span で包んで返します。 */
export function ja(text: string): React.ReactNode {
  if (!text) return text;

  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  CHUNK.lastIndex = 0;

  while ((match = CHUNK.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    // 長すぎるまとまりは、収まる分だけを固定して残りを次へ送る
    let rest = match[0];
    let offset = match.index;
    while (rest.length > 0) {
      const fit = takeFit(rest);
      const word = rest.slice(0, fit);
      // 1文字は割れようがないので、包まずそのまま置く（HTMLを無駄に増やさない）
      parts.push(
        word.length > 1 ? (
          <span key={`${offset}-${word}`} className="nb">
            {word}
          </span>
        ) : (
          word
        ),
      );
      rest = rest.slice(fit);
      offset += fit;
    }
    last = match.index + match[0].length;
  }

  // 守る語が1つもなければ、余計なノードを作らずそのまま返す
  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));

  /* 全体をひとつの span にまとめる。
     ボタンのように親が flex（gap つき）だと、切り分けた語がそれぞれ flex の子になり、
     語と語のあいだすべてに gap ぶんの隙間が空いてしまうため
     （「AI活用の中身を見る」で 8px × 3 = 24px の無駄な空白が入っていた）。
     display は inline なので、文章の流し込みと折り返しには影響しない。 */
  return (
    <span className="ja">
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </span>
  );
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
  if (isValidElement<{ children?: React.ReactNode; className?: string }>(node)) {
    // すでに ja() を通した部分は、二重に包まない
    const className = node.props.className;
    if (className === "ja" || className === "nb") return node;
    const children = node.props.children;
    // 子を持たない要素（<br /> や <Icon />）はそのまま
    if (children === undefined || children === null) return node;
    return cloneElement(node, undefined, jaNode(children));
  }
  return node;
}
