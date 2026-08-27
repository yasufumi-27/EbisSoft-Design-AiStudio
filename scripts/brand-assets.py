#!/usr/bin/env python3
"""
ブランド素材（ロゴ単体・名刺）を生成する。

    python3 scripts/brand-assets.py

出力先は `assets/brand/`（サイトには配信されない。印刷・資料用）。

【なぜスクリプトで作るか】
ロゴの文字は Geist Black（SIL OFL 1.1）の輪郭を `src/components/fx/logoFont.json`
（three.js の typeface 形式）から起こしています。画面のロゴ（`CompanyLogo.tsx` /
`logo3d.ts`）とまったく同じ輪郭なので、名刺と画面でロゴがずれません。
社名や住所は `src/lib/site.ts` から読むため、連絡先を変えたらこれを再実行するだけで
名刺のデータも最新になります。

【PNGの書き出し】
rsvg-convert / Inkscape / ImageMagick がこの環境に無いため、**ヘッドレスChrome**で
ラスタライズしています（`qlmanage` は正方形にしか書き出せず名刺が崩れる）。
Chromeが無い環境ではSVGだけが出ます。SVGが正で、PNGはその書き出しです。
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import qrcode_min

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "brand"
FONT = json.loads((ROOT / "src" / "components" / "fx" / "logoFont.json").read_text())
GLYPHS = FONT["glyphs"]
RES = FONT["resolution"]

# ------------------------------------------------------------------ ブランド色
NAVY = "#0f2e5f"          # 地色（ファビコン・Appleアイコンと同じ）
NAVY_DEEP = "#081a36"     # 名刺の暗い側
LETTER_BLUE = "#2f6cb0"   # ロゴの文字（3Dモデルの LOGO_BLUE）
SOFT_RED = "#a51f38"      # 「Soft」の赤
CYAN = "#22d3ee"          # ブランドカラー
CYAN_PALE = "#d8f7ff"
INK = "#0b1220"
PAPER = "#ffffff"
GRAY = "#5b6b82"

# ------------------------------------------------------------------ 掲載情報
# `src/lib/site.ts` / `src/lib/author.ts` から機械的に読む（手書きしない）
def _pick(path: str, pattern: str) -> str:
    text = (ROOT / path).read_text(encoding="utf-8")
    m = re.search(pattern, text)
    if not m:
        raise SystemExit(f"{path} から {pattern} を読めませんでした")
    return m.group(1)


COMPANY = _pick("src/lib/site.ts", r'legalName: "(.+?)"')
TEL = _pick("src/lib/site.ts", r'telephoneDisplay: "(.+?)"')
EMAIL = _pick("src/lib/site.ts", r'email: "(.+?)"')
POSTAL = _pick("src/lib/site.ts", r'postalCode: "(.+?)"')
REGION = _pick("src/lib/site.ts", r'region: "(.+?)"')
LOCALITY = _pick("src/lib/site.ts", r'locality: "(.+?)"')
STREET = _pick("src/lib/site.ts", r'street: "(.+?)"')
HOURS = _pick("src/lib/site.ts", r'openingHoursDisplay: "(.+?)"')
MEMBER = _pick("src/lib/site.ts", r'name: "(京都商工会議所)"')
PERSON = _pick("src/lib/author.ts", r'const PERSON_NAME = "(.+?)"')
PERSON_EN = _pick("src/lib/author.ts", r'personNameRomaji: "(.+?)"')
ROLE = _pick("src/lib/author.ts", r'personRole: "(.+?)"')
URL_DISPLAY = "www.yebisusoft.jp"
# QRコードに入れる実際のリンク先（表示用の URL_DISPLAY とは別。スキームまで入れる）
SITE_URL = _pick("src/lib/site.ts", r'const FALLBACK_URL = "(.+?)"') + "/"

ADDRESS = f"〒{POSTAL} {REGION}{LOCALITY}{STREET}"

# 名刺の和文フォント。SVGを開く環境に無い場合に備えて順に指定する
JP = "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic',sans-serif"
EN = "'Helvetica Neue',Arial,sans-serif"


# ------------------------------------------------------------------ 文字の輪郭
def glyph_path(text: str, size: float = 100.0, spacing: float = 2.0):
    """typeface 形式のアウトラインをSVGパスへ変換する（ベースライン基準・y上向きが負）。

    `CompanyLogo.tsx` のパスと同じ手順で作っているので、出力も一致します。
    """
    scale = size / RES
    out: list[str] = []
    off = 0.0
    x_min, x_max = 1e9, -1e9
    for ch in text:
        g = GLYPHS[ch]
        t = g["o"].split()
        i = 0
        started = False
        while i < len(t):
            cmd = t[i]
            i += 1
            if cmd == "m":
                if started:
                    out.append("Z")
                x = float(t[i]) * scale + off
                y = -float(t[i + 1]) * scale
                i += 2
                out.append(f"M{x:.2f} {y:.2f}")
                started = True
            elif cmd == "l":
                x = float(t[i]) * scale + off
                y = -float(t[i + 1]) * scale
                i += 2
                out.append(f"L{x:.2f} {y:.2f}")
            elif cmd == "q":
                # typeface 形式は「終点 → 制御点」の順
                x = float(t[i]) * scale + off
                y = -float(t[i + 1]) * scale
                cx = float(t[i + 2]) * scale + off
                cy = -float(t[i + 3]) * scale
                i += 4
                out.append(f"Q{cx:.2f} {cy:.2f} {x:.2f} {y:.2f}")
            elif cmd == "b":
                x = float(t[i]) * scale + off
                y = -float(t[i + 1]) * scale
                ax = float(t[i + 2]) * scale + off
                ay = -float(t[i + 3]) * scale
                bx = float(t[i + 4]) * scale + off
                by = -float(t[i + 5]) * scale
                i += 6
                out.append(f"C{ax:.2f} {ay:.2f} {bx:.2f} {by:.2f} {x:.2f} {y:.2f}")
            elif cmd == "z":
                out.append("Z")
                started = False
        x_min = min(x_min, g["x_min"] * scale + off)
        x_max = max(x_max, g["x_max"] * scale + off)
        off += g["ha"] * scale + spacing
    if out and out[-1] != "Z":
        out.append("Z")
    return " ".join(out), x_min, x_max


# Geist Black に F が無い（ロゴ用のサブセットのため）。
# E は直線だけでできているので、下の横棒を落として F を起こす。
GLYPHS["F"] = {
    "ha": GLYPHS["E"]["ha"],
    "x_min": GLYPHS["E"]["x_min"],
    "x_max": 588,
    "o": "m 62 0 l 62 710 l 588 710 l 588 553 l 258 553 l 258 434 l 576 434 l 576 278 l 258 278 l 258 0",
}


# ------------------------------------------------------------------ ロゴの部品
def logo_mark(x: float, y: float, size: float, ring: bool = True) -> str:
    """正方形のロゴマーク（リング＋YEBISU＋Soft）。`size` は一辺の長さ。"""
    k = size / 128.0  # 画面のロゴ（viewBox 128）と同じ比率で描く
    yebisu, _, _ = glyph_path("YEBISU")
    soft, _, _ = glyph_path("Soft", 100, 1)
    ring_svg = ""
    if ring:
        ring_svg = f"""
    <g transform="rotate(-30 64 62)" fill="none" stroke="{CYAN}">
      <ellipse cx="64" cy="62" rx="58" ry="26" stroke-width="3" opacity="0.75"/>
      <ellipse cx="64" cy="62" rx="47" ry="20" stroke-width="1.6" opacity="0.45"/>
      <circle cx="122" cy="62" r="2.6" fill="{CYAN_PALE}" stroke="none" opacity="0.9"/>
      <circle cx="6" cy="62" r="2" fill="{CYAN_PALE}" stroke="none" opacity="0.7"/>
    </g>"""
    return f"""<g transform="translate({x:.3f} {y:.3f}) scale({k:.6f})">{ring_svg}
    <path d="{yebisu}" transform="translate(12.6 70) scale(0.27)" fill="{LETTER_BLUE}"/>
    <path d="{soft}" transform="translate(76 93) scale(0.17)" fill="{SOFT_RED}"/>
  </g>"""


# ワードマーク1文字ぶんの素データ（倍率を変えても字間比が崩れないよう一度だけ作る）
_YE = glyph_path("YEBISU", 100, 6)
_SO = glyph_path("SOFT", 100, 6)
_WM_GAP = 46.0          # YEBISU と SOFT の間（字間よりはっきり広く。詰まると1語に読める）
_WM_UNITS = (_YE[2] - _YE[1]) + _WM_GAP + (_SO[2] - _SO[1])   # 全幅（サイズ100のとき）


def wordmark(x: float, y: float, width: float, yebisu_fill: str) -> tuple[str, float]:
    """ワードマーク `YEBISU SOFT` を輪郭で描く。**幅**を指定して収める。

    cap height ではなく幅で指定するのは、名刺のように横幅が決まっている面で
    右の要素（URL・見出し）と重ならないようにするため。戻り値は (svg, cap height)。
    `YEBISU` は地色に応じて白／ネイビー、`SOFT` は常にシアン。
    """
    scale = width / _WM_UNITS
    ye, ye_min, _ = _YE
    so, so_min, _ = _SO
    so_x = (_YE[2] - _YE[1]) + _WM_GAP
    svg = f"""<g transform="translate({x:.3f} {y:.3f}) scale({scale:.6f})">
    <path d="{ye}" transform="translate({-ye_min:.2f} 0)" fill="{yebisu_fill}"/>
    <path d="{so}" transform="translate({so_x - so_min:.2f} 0)" fill="{CYAN}"/>
  </g>"""
    return svg, 71.0 * scale


# ------------------------------------------------------------------ 出力の器
def svg_doc(width_px: int, height_px: int, view_w: float, view_h: float, body: str,
            title: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width_px}" height="{height_px}"
     viewBox="0 0 {view_w:g} {view_h:g}" role="img" aria-label="{title}">
{body}
</svg>
"""


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    print(f"  {path.relative_to(ROOT)}")


CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def rasterize(svg: Path, width: int, height: int, transparent: bool = False) -> None:
    """ヘッドレスChromeでPNGを書き出す（Chromeが無い環境ではSVGだけ出る）。

    `qlmanage` は正方形にしか書き出せず名刺（横長）が崩れるため使いません。
    Chromeなら和文フォントもそのまま焼き込まれるので、入稿用のPNGになります。
    """
    if not Path(CHROME).exists():
        return
    html = svg.parent / f"_{svg.stem}.html"
    html.write_text(
        "<!doctype html><meta charset='utf-8'>"
        "<style>html,body{margin:0;padding:0;overflow:hidden}"
        f"svg{{display:block;width:{width}px;height:{height}px}}</style>"
        + svg.read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    target = svg.with_suffix(".png")
    cmd = [
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        f"--screenshot={target}", f"--window-size={width},{height}",
        "--force-device-scale-factor=1",
    ]
    if transparent:
        cmd.append("--default-background-color=00000000")
    cmd.append(html.as_uri())
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    html.unlink(missing_ok=True)
    if target.exists():
        print(f"  {target.relative_to(ROOT)}")


# ------------------------------------------------------------------ ロゴ単体
def build_logos() -> None:
    print("ロゴ:")
    d = OUT / "logo"

    # 1) マークのみ（透過・正方形）
    body = f'  <rect width="128" height="128" fill="none"/>\n{logo_mark(0, 0, 128)}'
    p = d / "yebisu-soft-mark.svg"
    write(p, svg_doc(2048, 2048, 128, 128, body, "エビスソフトのロゴマーク"))
    rasterize(p, 2048, 2048, transparent=True)

    # 2) マークのみ（ネイビーの角丸地。SNSアイコン・名刺の裏など）
    body = (f'  <rect width="128" height="128" rx="28" fill="{NAVY}"/>\n'
            f'{logo_mark(0, 0, 128)}')
    p = d / "yebisu-soft-mark-navy.svg"
    write(p, svg_doc(2048, 2048, 128, 128, body, "エビスソフトのロゴマーク（ネイビー地）"))
    rasterize(p, 2048, 2048)

    # 3) 横組みロゴ（マーク＋ワードマーク）。明色背景用（透過）と濃色背景用
    mark_w, gap, wm_w = 128.0, 16.0, 330.0
    W = mark_w + gap + wm_w + 8
    H = 128.0
    px_w = 2600
    px_h = round(px_w * H / W)
    for name, fill, bg in (
        ("yebisu-soft-logo-horizontal-onlight.svg", NAVY, None),
        ("yebisu-soft-logo-horizontal-ondark.svg", "#ffffff", NAVY_DEEP),
    ):
        bg_svg = f'  <rect width="{W:.2f}" height="{H:g}" fill="{bg}"/>\n' if bg else ""
        body = f"{bg_svg}{logo_mark(0, 0, mark_w)}\n{wordmark(mark_w + gap, 84, wm_w, fill)[0]}"
        p = d / name
        write(p, svg_doc(px_w, px_h, round(W, 2), H, body, "エビスソフトのロゴ"))
        rasterize(p, px_w, px_h, transparent=bg is None)


# ------------------------------------------------------------------ 名刺
# 仕上がり 91×55mm、裁ち落とし各3mm ＝ 97×61mm。
CARD_W, CARD_H = 91.0, 55.0
BLEED = 3.0
FULL_W, FULL_H = CARD_W + BLEED * 2, CARD_H + BLEED * 2

MEISHI_HTML = OUT / "meishi" / "meishi.html"


def mark_svg(cls: str) -> str:
    """ロゴマーク（インラインSVG）。色は属性に焼き込まず class ＋ CSS変数で塗ります。"""
    yebisu, _, _ = glyph_path("YEBISU")
    soft, _, _ = glyph_path("Soft", 100, 1)
    return f"""<svg class="{cls}" viewBox="0 0 128 128" aria-hidden="true">
          <g class="ring" transform="rotate(-30 64 62)" fill="none">
            <ellipse cx="64" cy="62" rx="58" ry="26" stroke-width="3" opacity=".75"/>
            <ellipse cx="64" cy="62" rx="47" ry="20" stroke-width="1.6" opacity=".45"/>
            <circle class="bead" cx="122" cy="62" r="2.6" opacity=".9"/>
            <circle class="bead" cx="6" cy="62" r="2" opacity=".7"/>
          </g>
          <path class="lt" d="{yebisu}" transform="translate(12.6 70) scale(0.27)"/>
          <path class="sf" d="{soft}" transform="translate(76 93) scale(0.17)"/>
        </svg>"""


def wordmark_svg(cls: str) -> str:
    """ワードマーク `YEBISU SOFT`（インラインSVG）。色はCSS側で決めます。"""
    ye, ye_min, _ = _YE
    so, so_min, _ = _SO
    so_x = (_YE[2] - _YE[1]) + _WM_GAP
    return f"""<svg class="{cls}" viewBox="0 -75 {_WM_UNITS:.1f} 78" aria-label="YEBISU SOFT">
            <path class="ye" d="{ye}" transform="translate({-ye_min:.2f} 0)"/>
            <path class="so" d="{so}" transform="translate({so_x - so_min:.2f} 0)"/>
          </svg>"""


def qr_svg(cls: str, url: str) -> str:
    """サイトのQRコード（インラインSVG）。

    誤り訂正レベルQ（30%まで復元可）で作ります。名刺は財布の中で擦れるので、
    印刷物では少し余裕を持たせておくほうが読み取りが安定します。
    濃紺の地に直接置くと読めない機種があるため、白い下敷き（`.qr`の背景）に載せます。
    """
    matrix = qrcode_min.encode(url, "Q")
    d, n = qrcode_min.to_svg_path(matrix)
    return (f'<svg class="{cls}" viewBox="0 0 {n} {n}" role="img" aria-label="{url}">'
            f'<path d="{d}"/></svg>')


# 画面の「色」パネルに並べる項目。（CSS変数名, 画面のラベル）
COLOR_VARS = [
    ("--front-bg1", "表の背景（左上・濃い）"),
    ("--front-bg2", "表の背景（中間）"),
    ("--front-bg3", "表の背景（右下・明るい）"),
    ("--front-fg", "表の文字（氏名・社名）"),
    ("--front-sub", "表の小さい文字（住所・電話）"),
    ("--front-faint", "表のいちばん薄い文字（ローマ字）"),
    ("--accent", "アクセント（肩書・罫線）"),
    ("--back-bg", "裏の背景"),
    ("--back-fg", "裏の見出し"),
    ("--back-sub", "裏の本文"),
    ("--navy", "裏の濃紺（ロゴ・小見出し）"),
    ("--rule", "裏の罫線"),
    ("--qr-bg", "QRの下地"),
    ("--qr-fg", "QRの色"),
    ("--logo-letter", "ロゴの文字（YEBISU）"),
    ("--logo-soft", "ロゴの Soft"),
    ("--logo-ring", "ロゴのリング"),
]


def _box(cls: str, left: float, top: float, inner: str, style: str = "") -> str:
    """名刺の上に置く1ブロック。位置はmmで、編集画面ではドラッグで動かせます。"""
    return (f'      <div class="box {cls}" style="left:{left}mm;top:{top}mm;{style}">'
            f'{inner}</div>')


def build_meishi_html() -> None:
    """名刺の編集用HTMLを**作り直す**（`--reset-meishi` のときだけ）。

    名刺は手で直しながら使う前提なのでHTMLが正データです。ここで上書きすると
    画面上で編集して保存した内容が消えるため、既定では書き出しません。
    """
    from string import Template

    # CSSは波かっこだらけなので f-string ではなく Template（$名前）で埋める
    css = Template("""
    /* ==========================================================
       1. 色とフォント — ここだけ直せば表・裏・ロゴまで変わります
          （画面の「色」タブで試して貼り戻すこともできます）
       ========================================================== */
    :root{
      --front-bg1:$NAVY_DEEP;   /* 表の背景（左上・濃い） */
      --front-bg2:$NAVY;        /* 表の背景（中間） */
      --front-bg3:#123a72;      /* 表の背景（右下・明るい） */
      --front-fg:#ffffff;       /* 表の文字（氏名・社名） */
      --front-sub:#dbe6f5;      /* 表の小さい文字（住所・電話） */
      --front-faint:#8fa8c8;    /* 表のいちばん薄い文字（ローマ字） */
      --accent:$CYAN;           /* アクセント（肩書・罫線） */
      --back-bg:$PAPER;         /* 裏の背景 */
      --back-fg:$INK;           /* 裏の見出し */
      --back-sub:$GRAY;         /* 裏の本文 */
      --navy:$NAVY;             /* 裏の濃紺（ロゴ・小見出し） */
      --rule:#dbe3ef;           /* 裏の罫線 */
      --qr-bg:#ffffff;          /* QRの下地（白のままが確実に読めます） */
      --qr-fg:#000000;          /* QRの色 */
      --logo-letter:$LETTER_BLUE;
      --logo-soft:$SOFT_RED;
      --logo-ring:$CYAN;
      --logo-bead:$CYAN_PALE;
      --font-jp:$JP;
      --font-en:$EN;
      --cut:#c9d3e0;            /* A4面付けのカット線 */
      --scale:1;                /* 拡大率（FAXモードだけ大きくする） */
    }

    /* FAX・モノクロ印刷用。白地に黒だけにします（FAXは中間調がつぶれるため） */
    body.mode-fax{
      --front-bg1:#fff; --front-bg2:#fff; --front-bg3:#fff;
      --front-fg:#000; --front-sub:#000; --front-faint:#000;
      --accent:#000; --back-bg:#fff; --back-fg:#000; --back-sub:#000;
      --navy:#000; --rule:#000; --qr-bg:#fff; --qr-fg:#000;
      --logo-letter:#000; --logo-soft:#000; --logo-ring:#000; --logo-bead:#000;
      --scale:1.6;
    }

    /* ==========================================================
       2. 名刺そのもの
       ========================================================== */
    *{ box-sizing:border-box }
    html,body{ margin:0; padding:0 }
    body{ font-family:var(--font-jp); background:#e9edf3;
          -webkit-print-color-adjust:exact; print-color-adjust:exact }

    .card{
      position:relative; overflow:hidden;
      width:$FULL_Wmm; height:$FULL_Hmm;    /* 裁ち落とし込み */
      margin:0 auto;
    }
    .front{ background:linear-gradient(135deg,var(--front-bg1) 0%,var(--front-bg2) 55%,
            var(--front-bg3) 100%); color:var(--front-fg) }
    .back{ background:var(--back-bg); color:var(--back-fg) }

    /* 中身はすべて絶対配置の「箱」。left/top（mm）で位置が決まります */
    .box{ position:absolute; white-space:nowrap; line-height:1.5 }
    .box p{ margin:0 }

    .orbit{ position:absolute; right:-14mm; top:50%; width:60mm; height:26mm;
            transform:translateY(-50%) rotate(-24deg); border:.18mm solid var(--accent);
            border-radius:50%; opacity:.28; pointer-events:none }
    .orbit::after{ content:""; position:absolute; inset:3mm 6mm;
                   border:.12mm solid var(--accent); border-radius:50%; opacity:.6 }
    body.mode-fax .orbit{ display:none }

    /* ロゴ */
    .logo{ display:flex; align-items:flex-start; gap:2.6mm }
    .mark{ width:15mm; height:15mm; flex:none }
    .back .mark{ width:11mm; height:11mm }
    .wordmark{ display:block; width:44mm; margin-top:1.5mm }
    .back .wordmark{ width:26mm; margin-top:1mm }
    .ring{ stroke:var(--logo-ring) }
    .bead{ fill:var(--logo-bead); stroke:none }
    .lt{ fill:var(--logo-letter) }
    .sf{ fill:var(--logo-soft) }
    .front .ye{ fill:var(--front-fg) }
    .back .ye{ fill:var(--navy) }
    .so{ fill:var(--accent) }

    /* 表 */
    .company{ font-size:2.5mm; letter-spacing:.5mm; color:var(--front-sub) }
    .role{ font-size:2.6mm; letter-spacing:.8mm; color:var(--accent) }
    .person{ font-size:6.4mm; font-weight:600; letter-spacing:1.2mm }
    .roman{ font-family:var(--font-en); font-size:2.2mm; letter-spacing:.6mm;
            color:var(--front-faint) }
    .addr,.tel{ font-size:2.25mm; color:var(--front-sub) }
    .rule{ border-top:.09mm solid var(--accent); height:0 }
    .qr{ background:var(--qr-bg); padding:.9mm; border-radius:.8mm; line-height:0 }
    .qr svg{ display:block; width:100%; height:auto; fill:var(--qr-fg) }
    .qrcap{ font-size:1.8mm; color:var(--front-sub); text-align:center }

    /* 裏 */
    .band{ background:var(--navy); border-bottom:.12mm solid var(--accent) }
    .back-company{ font-size:2mm; letter-spacing:.3mm; color:var(--back-sub) }
    .headline{ font-size:2.3mm; font-weight:700; color:var(--back-fg) }
    .subline{ font-size:1.9mm; color:var(--back-sub) }
    .rule-light{ border-top:.08mm solid var(--rule); height:0 }
    .pillar h2{ margin:0; font-size:2.5mm; color:var(--navy) }
    .pillar h2::after{ content:""; display:block; width:5.5mm; height:.5mm;
                       background:var(--accent); margin:1mm 0 2.4mm }
    .pillar ul{ margin:0; padding:0; list-style:none }
    .pillar li{ font-size:1.75mm; line-height:1.6; color:var(--back-sub) }
    .hours{ font-size:2.1mm; color:var(--back-sub) }
    .url{ font-family:var(--font-en); font-size:2.5mm; font-weight:700; color:var(--navy) }

    .hidden{ display:none !important }   /* 載せたくない箱に付けると消えます */

    /* ==========================================================
       3. 印刷モード（body の class で切り替え）
       ========================================================== */
    @page{ size:$FULL_Wmm $FULL_Hmm; margin:0 }   /* 既定＝入稿用。JSがA4に差し替えます */
    body.mode-cut .card{ page-break-after:always }
    body.mode-cut .card:last-of-type{ page-break-after:auto }
    .sheet{ page-break-after:always; display:none }
    .sheet:last-of-type{ page-break-after:auto }
    body.mode-a4 .sheet, body.mode-fax .sheet{ display:grid }
    body.mode-a4 .single, body.mode-fax .single{ display:none }

    .slot{ width:calc($CARD_Wmm * var(--scale)); height:calc($CARD_Hmm * var(--scale));
           overflow:hidden; position:relative }
    .slot > .card{ margin:calc(-1 * $BLEEDmm * var(--scale));
                   transform:scale(var(--scale)); transform-origin:0 0 }
    body.mode-a4 .sheet{ grid-template-columns:repeat(2,$CARD_Wmm); gap:1mm;
                         justify-content:center }
    body.mode-a4 .slot{ outline:.1mm solid var(--cut) }
    body.mode-fax .sheet{ grid-template-columns:1fr; justify-items:center; gap:6mm }
    body.mode-fax .slot{ border:.3mm solid #000 }

    /* ==========================================================
       4. 編集画面まわり（印刷には出ません）
       ========================================================== */
    .bar{ position:sticky; top:0; z-index:50; background:#fff; border-bottom:1px solid #dbe3ef;
          padding:2mm 4mm; display:flex; flex-wrap:wrap; gap:2mm 4mm; align-items:center;
          font-size:3.2mm }
    .bar b{ margin-right:1mm }
    .bar button, .bar select, .bar input[type=number]{ font:inherit; padding:.8mm 2mm;
          border:1px solid #c9d3e0; border-radius:1.2mm; background:#f6f8fc; cursor:pointer }
    .bar input[type=number]{ width:16mm; cursor:text }
    .bar input[type=color]{ width:9mm; height:6mm; padding:0; border:1px solid #c9d3e0;
          background:none }
    .bar .sep{ width:1px; align-self:stretch; background:#dbe3ef }
    .bar .off{ opacity:.4; pointer-events:none }
    .tabs button[aria-pressed=true]{ background:#0f2e5f; color:#fff; border-color:#0f2e5f }

    .pane{ max-width:190mm; margin:4mm auto; padding:5mm; background:#fff; border-radius:3mm;
           font-size:3.3mm; line-height:1.9; color:#24324a }
    .pane[hidden]{ display:none }
    .pane h2{ font-size:3.8mm; margin:0 0 2mm }
    .pane code{ background:#eef2f8; padding:0 .6mm; border-radius:1mm }
    .colors{ display:grid; grid-template-columns:repeat(auto-fill,minmax(62mm,1fr)); gap:2mm 4mm }
    .colors label{ display:flex; align-items:center; gap:2mm; font-size:3.1mm }
    .colors input{ width:9mm; height:6mm; padding:0; border:1px solid #c9d3e0; background:none }
    .pane textarea{ width:100%; height:30mm; margin-top:3mm; font-family:var(--font-en);
                    font-size:3mm; border:1px solid #c9d3e0; border-radius:1.5mm; padding:2mm }
    .label{ max-width:$FULL_Wmm; margin:5mm auto 1.5mm; font-size:3mm; color:#63748f }

    /* 編集中の見え方 */
    body.editing .box{ cursor:move }
    body.editing .box:hover{ outline:.2mm dashed #7aa7d9 }
    body.editing .box.sel{ outline:.3mm solid #1f7ae0; background:rgba(31,122,224,.08) }
    body.editing .box[contenteditable=true]{ cursor:text; outline:.3mm solid #1f7ae0 }
    body.mode-cut .card::before, body.mode-cut .card::after{ content:""; position:absolute;
                                                             pointer-events:none; z-index:40 }
    body.mode-cut .card::before{ inset:$BLEEDmm; outline:.1mm solid #ff2d55 }
    body.mode-cut .card::after{ inset:$PADmm; outline:.1mm dashed #00a3ff }

    @media print{
      body{ background:#fff }
      .bar,.pane,.label{ display:none }
      .card{ margin:0 }
      .box{ outline:none !important; background:none !important }
      body.mode-cut .card::before, body.mode-cut .card::after{ display:none }
    }
""").substitute(
        NAVY=NAVY, NAVY_DEEP=NAVY_DEEP, CYAN=CYAN, CYAN_PALE=CYAN_PALE, PAPER=PAPER,
        INK=INK, GRAY=GRAY, LETTER_BLUE=LETTER_BLUE, SOFT_RED=SOFT_RED, JP=JP, EN=EN,
        FULL_Wmm=f"{FULL_W:g}mm", FULL_Hmm=f"{FULL_H:g}mm",
        CARD_Wmm=f"{CARD_W:g}mm", CARD_Hmm=f"{CARD_H:g}mm",
        BLEEDmm=f"{BLEED:g}mm", PADmm=f"{BLEED + 4:g}mm",
    )

    # ---------------- 表 ----------------
    front = "\n".join([
        '    <section class="card front" id="cardFront">',
        '      <div class="orbit"></div>',
        _box("logo", 7, 6.5, mark_svg("mark") + wordmark_svg("wordmark")),
        _box("company", 24.6, 17.2, COMPANY),
        _box("role", 7.4, 25.5, ROLE),
        _box("person", 7, 30, PERSON),
        _box("roman", 7.4, 40.2, PERSON_EN),
        _box("rule", 7, 45.4, "", "width:60mm;"),
        _box("addr", 7, 46.4, ADDRESS),
        _box("tel", 7, 50, f'TEL {TEL}　<span class="mail">{EMAIL}</span>'),
        _box("qr", 74.5, 34.6, qr_svg("qrcode", SITE_URL), "width:15.8mm;"),
        _box("qrcap", 74.5, 50.6, "サイトはこちら", "width:15.8mm;"),
        '    </section>',
    ])

    # ---------------- 裏 ----------------
    pillars = [
        ("AI活用", ["生成AIを開発工程に組み込み", "期間を従来の約1/3に短縮", "AIチャットボット（RAG）"]),
        ("Web制作", ["コーポレート・LP・EC", "SEO / AEO / LLMO 実装", "3DCG・WebGL演出"]),
        ("組み込み・IoT", ["ルネサス RH850・RX・RL78", "ARM Cortex-M・STM32", "BLE・Wi-Fi・MQTT・クラウド"]),
    ]
    pillar_boxes = [
        _box("pillar", 7 + i * 27.7, 26,
             f"<h2>{t}</h2><ul>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>")
        for i, (t, items) in enumerate(pillars)
    ]
    back = "\n".join([
        '    <section class="card back" id="cardBack">',
        _box("band", 0, 0, "", f"width:{FULL_W:g}mm;height:{BLEED + 1.6:g}mm;"),
        _box("logo", 7, 7, mark_svg("mark") + wordmark_svg("wordmark")),
        _box("back-company", 20.6, 14.6, f"{COMPANY}／{MEMBER} 会員"),
        _box("headline", 90 - 4, 7.4, "AI活用のWeb制作と組み込み開発", "transform:translateX(-100%);"),
        _box("subline", 90 - 4, 11.6, "実際に動くデモをサイトで公開中", "transform:translateX(-100%);"),
        _box("rule-light", 7, 22.5, "", "width:83mm;"),
        *pillar_boxes,
        _box("rule-light", 7, 45.2, "", "width:83mm;"),
        _box("hours", 7, 46.6, f"{HOURS}　TEL {TEL}"),
        _box("url", 90 - 4, 46.4, URL_DISPLAY, "transform:translateX(-100%);"),
        '    </section>',
    ])

    color_inputs = "\n".join(
        f'      <label><input type="color" data-var="{v}"><span>{lbl}</span></label>'
        for v, lbl in COLOR_VARS
    )

    bar = f"""<div class="bar">
    <span class="tabs">
      <b>表示</b>
      <button type="button" id="tabEdit" aria-pressed="true">編集</button>
      <button type="button" id="tabColor" aria-pressed="false">色</button>
      <button type="button" id="tabHelp" aria-pressed="false">使い方</button>
    </span>
    <span class="sep"></span>
    <b>印刷</b>
    <select id="mode">
      <option value="mode-cut">入稿用（名刺サイズ・裁ち落としあり）</option>
      <option value="mode-a4">A4に10面付け（自分で刷って切る）</option>
      <option value="mode-fax">FAX・モノクロ（A4・1.6倍）</option>
    </select>
    <button type="button" id="print">印刷 / PDF</button>
    <span class="sep"></span>
    <span id="tools" class="off">
      <b>選択中</b>
      文字 <input type="number" id="fsize" step="0.1" min="0.5" title="文字の大きさ（mm）">mm
      <button type="button" id="bold" title="太さ">B</button>
      <input type="color" id="fcolor" title="文字の色">
      <select id="align" title="行揃え">
        <option value="left">左</option><option value="center">中央</option>
        <option value="right">右</option>
      </select>
      <button type="button" id="front">前面へ</button>
      <button type="button" id="del">削除</button>
    </span>
    <span class="sep"></span>
    <button type="button" id="add">＋ 文字を足す</button>
    <button type="button" id="undo">元に戻す</button>
    <button type="button" id="save">保存（HTMLを書き出し）</button>
  </div>"""

    pane_color = f"""<div class="pane" id="paneColor" hidden>
    <h2>色を変える</h2>
    <div class="colors">
{color_inputs}
    </div>
    <p style="margin-top:3mm">
      <button type="button" id="copyCss">この色をCSSとしてコピー</button>
      <button type="button" id="resetCss">元の色に戻す</button>
      「保存」を押せばこの色のまま書き出されます。CSSに残したいときは下の内容を、
      ファイル先頭の <code>:root{{ … }}</code> と差し替えてください。
    </p>
    <textarea id="cssOut" readonly></textarea>
  </div>"""

    pane_help = f"""<div class="pane" id="paneHelp" hidden>
    <h2>使い方</h2>
    <p>
      ・<b>文字を直す</b>… 直したいところを<b>ダブルクリック</b>すると、その場で打ち替えられます。
        終わったら名刺の外をクリックしてください。<br>
      ・<b>動かす</b>… 1回クリックで選んで、そのまま<b>ドラッグ</b>。矢印キーでも0.5mmずつ動きます
        （Shiftを押しながらで0.1mm）。<br>
      ・<b>大きさ・色・太さ</b>… 選んでから上のバーで変えられます。<br>
      ・<b>足す／消す</b>… 「＋ 文字を足す」で新しい行が出ます。選んで「削除」または Delete キーで消えます。<br>
      ・<b>元に戻す</b>… 上のバーの「元に戻す」か ⌘Z（文字を打っている最中は、その場の取り消しになります）。<br>
      ・<b>保存</b>… 「保存」を押すと、いまの状態のHTMLがダウンロードされます。
        <code>meishi.html</code> を差し替えれば、次からその内容で開きます。<br>
      ・<b>社員を増やす</b>… 表を1枚作ってから保存し、そのファイルをコピーして氏名だけ直すのが簡単です。
    </p>
    <h2>印刷とサイズ</h2>
    <p>
      仕上がり <b>{CARD_W:g}×{CARD_H:g}mm</b>、裁ち落とし各{BLEED:g}mm 込みで {FULL_W:g}×{FULL_H:g}mm。
      赤い線が仕上がり、青い破線が安全枠です（画面だけに出ます）。文字は青い破線の内側に置いてください。<br>
      印刷のときは<b>「背景のグラフィック」をON、拡大縮小100%</b>にしてください。<br>
      <b>入稿用</b>… {FULL_W:g}×{FULL_H:g}mm が2ページ。そのまま印刷所に渡せます。<br>
      <b>A4に10面付け</b>… 仕上がりサイズで10枚並びます。薄い線が切る目印です。<br>
      <b>FAX・モノクロ</b>… 白地に黒だけ・1.6倍。背景の塗りとリングは消えます。
    </p>
    <h2>QRコード</h2>
    <p>
      表のQRは <code>{SITE_URL}</code> です。誤り訂正レベルQ（30%まで復元）で作ってあり、
      白い下敷きに載せています（濃い色の上に直接置くと読めない機種があるため）。
      <b>リンク先を変えるときは</b> <code>python3 scripts/brand-assets.py --reset-meishi</code> で作り直してください
      （画面から文字を打ち替えてもQRの中身は変わりません）。
    </p>
  </div>"""

    script = """  <script>
  /* 画面用の編集機能。印刷結果には影響しません。
     JSを切っていても、名刺はそのまま表示・印刷できます。 */
  (function () {
    var root = document.documentElement, body = document.body;
    var single = document.querySelector('.single');
    var sel = null, editing = null, history = [], MM = 1;

    // px と mm の換算（環境の解像度に依存するので実測する）
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;width:100mm;visibility:hidden';
    body.appendChild(probe);
    MM = probe.getBoundingClientRect().width / 100;
    probe.remove();
    function mm(px) { return Math.round(px / MM * 10) / 10; }

    /* ---------- 元に戻す（箱の移動・追加・削除・書式） ---------- */
    function snap() {
      history.push(single.innerHTML);
      if (history.length > 50) history.shift();
    }
    function undo() {
      if (!history.length) return;
      deselect();
      single.innerHTML = history.pop();
      wire();
    }

    /* ---------- 選択 ---------- */
    function select(box) {
      deselect();
      sel = box;
      box.classList.add('sel');
      tools.classList.remove('off');
      fsize.value = mm(parseFloat(getComputedStyle(box).fontSize));
      fcolor.value = rgbToHex(getComputedStyle(box).color);
      align.value = getComputedStyle(box).textAlign === 'start'
        ? 'left' : getComputedStyle(box).textAlign;
    }
    function deselect() {
      if (editing) { editing.removeAttribute('contenteditable'); editing = null; }
      if (sel) sel.classList.remove('sel');
      sel = null;
      tools.classList.add('off');
    }

    /* ---------- ドラッグで移動 ---------- */
    function onDown(e) {
      var box = e.target.closest('.box');
      if (!box || !body.classList.contains('editing')) return;
      if (editing === box) return;                 // 文字を打っている最中は動かさない
      select(box);
      var sx = e.clientX, sy = e.clientY, moved = false;
      var l = parseFloat(box.style.left) || 0, t = parseFloat(box.style.top) || 0;
      function move(ev) {
        if (!moved) { snap(); moved = true; }
        box.style.left = (l + mm(ev.clientX - sx)) + 'mm';
        box.style.top = (t + mm(ev.clientY - sy)) + 'mm';
      }
      function up() {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      e.preventDefault();
    }

    /* ---------- ダブルクリックで文字を直す ---------- */
    function onDbl(e) {
      var box = e.target.closest('.box');
      if (!box || !body.classList.contains('editing')) return;
      select(box);
      snap();                                    // 打ち替える前の状態を控えておく
      box.setAttribute('contenteditable', 'true');
      editing = box;
      box.focus();
      var r = document.caretRangeFromPoint && document.caretRangeFromPoint(e.clientX, e.clientY);
      if (r) { var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    }

    function wire() {
      document.querySelectorAll('.card').forEach(function (c) {
        c.onmousedown = onDown;
        c.ondblclick = onDbl;
      });
    }
    wire();
    document.addEventListener('mousedown', function (e) {
      if (!e.target.closest('.card') && !e.target.closest('.bar')) deselect();
    });

    /* ---------- キー操作 ---------- */
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !editing) { e.preventDefault(); undo(); return; }
      if (!sel || editing) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); snap(); sel.remove(); deselect(); return;
      }
      var step = e.shiftKey ? 0.1 : 0.5, dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;
      e.preventDefault(); snap();
      sel.style.left = ((parseFloat(sel.style.left) || 0) + dx) + 'mm';
      sel.style.top = ((parseFloat(sel.style.top) || 0) + dy) + 'mm';
    });

    /* ---------- 書式のボタン ---------- */
    var tools = document.getElementById('tools'), fsize = document.getElementById('fsize'),
        fcolor = document.getElementById('fcolor'), align = document.getElementById('align');
    fsize.oninput = function () { if (sel) { snap(); sel.style.fontSize = fsize.value + 'mm'; } };
    fcolor.oninput = function () { if (sel) { snap(); sel.style.color = fcolor.value; } };
    align.onchange = function () { if (sel) { snap(); sel.style.textAlign = align.value; } };
    document.getElementById('bold').onclick = function () {
      if (!sel) return; snap();
      sel.style.fontWeight = getComputedStyle(sel).fontWeight >= 600 ? '400' : '700';
    };
    document.getElementById('front').onclick = function () {
      if (!sel) return; snap(); sel.style.zIndex = 30;
    };
    document.getElementById('del').onclick = function () {
      if (!sel) return; snap(); sel.remove(); deselect();
    };
    document.getElementById('add').onclick = function () {
      var card = (sel && sel.closest('.card')) || document.getElementById('cardFront');
      snap();
      var d = document.createElement('div');
      d.className = 'box';
      d.style.cssText = 'left:20mm;top:20mm;font-size:2.5mm';
      d.textContent = 'ここに文字';
      card.appendChild(d);
      wire();
      select(d);
    };
    document.getElementById('undo').onclick = undo;

    /* ---------- 表示の切り替え（編集 / 色 / 使い方） ---------- */
    var tabs = {
      tabEdit: null,
      tabColor: document.getElementById('paneColor'),
      tabHelp: document.getElementById('paneHelp')
    };
    Object.keys(tabs).forEach(function (id) {
      document.getElementById(id).onclick = function () {
        Object.keys(tabs).forEach(function (k) {
          var on = k === id;
          document.getElementById(k).setAttribute('aria-pressed', on);
          if (tabs[k]) tabs[k].hidden = !on;
        });
        body.classList.toggle('editing', id === 'tabEdit');
        if (id !== 'tabEdit') deselect();
      };
    });
    body.classList.add('editing');

    /* ---------- 印刷モード ---------- */
    var pageStyle = document.getElementById('page-size');
    var PAGE = {
      'mode-cut': '@page{size:__CUT__;margin:0}',
      'mode-a4': '@page{size:A4;margin:8mm}',
      'mode-fax': '@page{size:A4;margin:8mm}'
    };
    function slot(card) {
      var d = document.createElement('div');
      d.className = 'slot';
      var c = card.cloneNode(true);
      c.removeAttribute('id');
      d.appendChild(c);
      return d;
    }
    function buildSheets() {
      document.querySelectorAll('.sheet').forEach(function (s) { s.remove(); });
      var f = document.getElementById('cardFront'), b = document.getElementById('cardBack');
      var sheet = document.createElement('div');
      sheet.className = 'sheet';
      var rows = body.classList.contains('mode-fax') ? 1 : 5;
      for (var i = 0; i < rows; i++) { sheet.appendChild(slot(f)); sheet.appendChild(slot(b)); }
      body.appendChild(sheet);
    }
    function setMode(name) {
      body.className = name + (body.classList.contains('editing') ? ' editing' : '');
      pageStyle.textContent = PAGE[name] || '';
      document.querySelectorAll('.sheet').forEach(function (s) { s.remove(); });
      if (name !== 'mode-cut') { deselect(); buildSheets(); }
    }
    var modeSel = document.getElementById('mode');
    modeSel.onchange = function () { setMode(modeSel.value); };
    document.getElementById('print').onclick = function () { deselect(); print(); };

    /* ---------- 色 ---------- */
    function rgbToHex(v) {
      v = (v || '').trim();
      if (v.charAt(0) === '#') return v.length === 4
        ? '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3] : v;
      var m = v.match(/\\d+/g);
      return m ? '#' + m.slice(0, 3).map(function (n) {
        return ('0' + (+n).toString(16)).slice(-2);
      }).join('') : '#000000';
    }
    var defaults = {};
    var inputs = [].slice.call(document.querySelectorAll('.colors input'));
    inputs.forEach(function (input) {
      var name = input.dataset.var;
      defaults[name] = getComputedStyle(root).getPropertyValue(name).trim();
      input.value = rgbToHex(defaults[name]);
      input.oninput = function () { root.style.setProperty(name, input.value); dumpCss(); };
    });
    function dumpCss() {
      document.getElementById('cssOut').value = ':root{\\n' + inputs.map(function (i) {
        return '  ' + i.dataset.var + ':' + i.value + ';';
      }).join('\\n') + '\\n}';
    }
    document.getElementById('copyCss').onclick = function () {
      var t = document.getElementById('cssOut');
      t.select();
      navigator.clipboard ? navigator.clipboard.writeText(t.value) : document.execCommand('copy');
    };
    document.getElementById('resetCss').onclick = function () {
      inputs.forEach(function (i) {
        root.style.removeProperty(i.dataset.var);
        i.value = rgbToHex(defaults[i.dataset.var]);
      });
      dumpCss();
    };
    dumpCss();

    /* ---------- 保存（いまの状態をHTMLとして書き出す） ---------- */
    document.getElementById('save').onclick = function () {
      deselect();
      var mode = body.className;
      body.className = 'mode-cut';
      document.querySelectorAll('.sheet').forEach(function (s) { s.remove(); });
      pageStyle.textContent = '';
      document.querySelectorAll('[contenteditable]').forEach(function (el) {
        el.removeAttribute('contenteditable');
      });
      document.querySelectorAll('.sel').forEach(function (el) { el.classList.remove('sel'); });
      var html = '<!doctype html>\\n' + root.outerHTML;
      body.className = mode;
      setMode(modeSel.value);
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      a.download = 'meishi.html';
      a.click();
      URL.revokeObjectURL(a.href);
    };

    // <body class="mode-a4"> のように手で書き換えて開いた場合も、その指定に合わせる
    var start = ['mode-a4', 'mode-fax'].filter(function (m) {
      return body.classList.contains(m);
    })[0] || 'mode-cut';
    modeSel.value = start;
    setMode(start);
  })();
  </script>""".replace("__CUT__", f"{FULL_W:g}mm {FULL_H:g}mm")

    html = f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{COMPANY} 名刺（編集・印刷用）</title>
<!--
  名刺の元データ。ブラウザで開くとその場で編集できます（文字はダブルクリック、移動はドラッグ）。
  直したら「保存」でHTMLを書き出し、このファイルと差し替えてください。
  仕上がり {CARD_W:g}×{CARD_H:g}mm ＋ 裁ち落とし各{BLEED:g}mm ＝ {FULL_W:g}×{FULL_H:g}mm。
  色は先頭の :root にまとめてあります。表のQRのリンク先は {SITE_URL} です
  （変えるときは scripts/brand-assets.py --reset-meishi で作り直し）。
-->
<style>{css}</style>
<style id="page-size"></style>
</head>
<body class="mode-cut">
{bar}

{pane_color}

{pane_help}

<div class="single">
  <p class="label">表（{ROLE}）</p>
{front}

  <p class="label">裏（全員共通）</p>
{back}
</div>

{script}
</body>
</html>
"""
    write(MEISHI_HTML, html)


if __name__ == "__main__":
    import sys

    print(f"出力先: {OUT.relative_to(ROOT)}")
    build_logos()
    # 名刺（assets/brand/meishi/meishi.html）は手で編集する前提の正データなので、
    # 明示的に --reset-meishi を付けたときだけ作り直す（手作業を消さないため）。
    if "--reset-meishi" in sys.argv:
        print("名刺HTMLを作り直します（手を入れた内容は失われます）:")
        build_meishi_html()
    else:
        print(f"名刺: {MEISHI_HTML.relative_to(ROOT)} は手編集の正データなので触りません"
              f"（作り直すなら --reset-meishi）")
