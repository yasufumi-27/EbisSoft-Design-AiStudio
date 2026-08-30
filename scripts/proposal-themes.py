#!/usr/bin/env python3
"""
デザイン案15種のテーマCSSを生成する。

    python3 scripts/proposal-themes.py

入力： src/lib/designProposals.ts の `tokens`（案ごとの配色・字面・角の丸み）
出力： src/app/proposal-themes.css

CSSを手で書くと `designProposals.ts` とすぐにずれるため、値は必ずTS側だけを直し、
このスクリプトを実行し直すこと（生成物はコミットする。ビルド時には実行しない）。

出す形は2種類：
  .dp-<id>  … できることのデモ（`/demo/<slug>`）で使う。--dp-* を定義する
  .ds[data-theme="<id>"]
            … 職種別デモサイト（`/demosite/<職種>`）で使う。--ds-* を定義する
              （demosite.css が元から `.ds[data-theme=...]` で組まれているため、そこへ流し込む）
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "lib" / "designProposals.ts"
OUT = ROOT / "src" / "app" / "proposal-themes.css"

# designProposals.ts が使っている書体の定数（TS側と同じ値をここにも置く）
FONTS = {
    "SERIF": '"Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',
    "MONO": '"SFMono-Regular", Menlo, Consolas, "Courier New", monospace',
    "SANS": "var(--font-geist-sans), system-ui, sans-serif",
    "DISPLAY": "var(--font-orbitron), var(--font-geist-sans), system-ui, sans-serif",
}

TOKEN_KEYS = [
    "bg", "surface", "surface2", "line", "ink", "muted",
    "accent", "accentInk", "accent2", "radius",
    "headFont", "headSpacing", "headWeight", "labelSpacing",
]

# TSのキー名 → CSSカスタムプロパティ名
CSS_NAME = {
    "bg": "bg",
    "surface": "surface",
    "surface2": "surface-2",
    "line": "line",
    "ink": "ink",
    "muted": "muted",
    "accent": "accent",
    "accentInk": "accent-ink",
    "accent2": "accent-2",
    "radius": "radius",
    "headFont": "head-font",
    "headSpacing": "head-spacing",
    "headWeight": "head-weight",
    "labelSpacing": "label-spacing",
}


def parse() -> list[dict]:
    """designProposals.ts から案ごとの id / no / name / light / tokens を読む。"""
    text = SRC.read_text(encoding="utf-8")
    # `proposals` 配列の中身だけを対象にする（demoProposal 等の別テーブルを拾わないため）
    start = text.index("export const proposals")
    end = text.index("const byId =")
    body = text[start:end]

    out: list[dict] = []
    for block in re.finditer(r"\{\s*\n\s*id:\s*\"([a-z-]+)\",(.*?)\n  \},\n", body, re.S):
        pid, chunk = block.group(1), block.group(2)

        def field(name: str) -> str:
            m = re.search(rf"\n\s*{name}:\s*\"([^\"]*)\"", chunk)
            return m.group(1) if m else ""

        tokens: dict[str, str] = {}
        for key in TOKEN_KEYS:
            m = re.search(rf"\n\s*{key}:\s*(\"([^\"]*)\"|([A-Z_]+)),", chunk)
            if not m:
                sys.exit(f"{pid}: token '{key}' が見つかりません")
            tokens[key] = m.group(2) if m.group(2) is not None else FONTS[m.group(3)]

        light = re.search(r"\n\s*light:\s*(true|false)", chunk)
        out.append(
            {
                "id": pid,
                "no": field("no"),
                "name": field("name"),
                "jp": field("jp"),
                "light": light.group(1) == "true" if light else False,
                "tokens": tokens,
            }
        )
    return out


def render(items: list[dict]) -> str:
    head = """/* ============================================================
 * デザイン案15種のテーマ（自動生成）
 *
 * 生成元 : src/lib/designProposals.ts
 * 生成 　 : python3 scripts/proposal-themes.py
 *
 * **このファイルを直接編集しないこと。** 値は designProposals.ts を直して
 * 生成し直す（手で直すと、TS側の一覧表示と画面の色がずれる）。
 *
 *   .dp-<id> … できることのデモ（/demo/<slug>）が使う変数
 *   .ds[data-theme="<id>"] … 職種別デモサイト（/demosite/<職種>）が使う変数
 * ============================================================ */
"""
    parts = [head]
    for it in items:
        t = it["tokens"]
        label = f'{it["no"]} {it["name"]} — {it["jp"]}'
        decls = "\n".join(
            f"  --dp-{CSS_NAME[k]}: {t[k]};" for k in TOKEN_KEYS
        )
        parts.append(
            f"""
/* {label} */
.dp-{it['id']} {{
{decls}
  --dp-scheme: {"light" if it["light"] else "dark"};
  color-scheme: {"light" if it["light"] else "dark"};
}}"""
        )

    parts.append("\n\n/* ---- 職種別デモサイト用（demosite.css の --ds-* へ流し込む） ---- */")
    for it in items:
        t = it["tokens"]
        label = f'{it["no"]} {it["name"]} — {it["jp"]}'
        # デモサイトは「お客様のホームページ」なので、地の面は読みやすい側を使う。
        # 暗い案は地を暗いまま使い、明るい案は surface を地にして紙面らしくする。
        # 角の丸みは2種類に分ける。
        # ボタンやバッジは案の値をそのまま使い（999px なら錠剤形）、
        # 写真やカードのような大きな面は 22px で頭打ちにする
        # （大きな矩形に 999px を掛けると、ただの楕円になって用をなさない）。
        raw = t["radius"]
        px = int(raw.replace("px", "")) if raw.endswith("px") else 999
        radius_box = raw if px <= 22 else "22px"
        bg = t["surface"] if it["light"] else t["bg"]
        alt = t["surface2"] if it["light"] else t["surface"]
        surface = t["surface"] if not it["light"] else "#ffffff"
        parts.append(
            f"""
/* {label} */
.ds[data-theme="{it['id']}"] {{
  --ds-bg: {bg};
  --ds-alt: {alt};
  --ds-surface: {surface};
  --ds-ink: {t['ink']};
  --ds-muted: {t['muted']};
  --ds-line: {t['line']};
  --ds-accent: {t['accent']};
  --ds-accent-dark: {t['accent2']};
  --ds-accent-ink: {t['accentInk']};
  --ds-accent-soft: {t['surface2']};
  --ds-hero-from: {t['surface']};
  --ds-hero-to: {t['bg']};
  --ds-radius: {radius_box};
  --ds-radius-pill: {t['radius']};
  --ds-head-font: {t['headFont']};
  --ds-body-font: {t['headFont'] if t['headFont'] == FONTS['MONO'] else 'var(--font-geist-sans), system-ui, sans-serif'};
  --ds-head-weight: {t['headWeight']};
  --ds-head-spacing: {t['headSpacing']};
  color-scheme: {"light" if it["light"] else "dark"};
}}"""
        )
    return "\n".join(parts) + "\n"


def main() -> None:
    items = parse()
    if len(items) != 15:
        sys.exit(f"案が15件ではありません（{len(items)}件）。パースを確認してください")
    OUT.write_text(render(items), encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(items)} proposals)")


if __name__ == "__main__":
    main()
