# エビスソフト キャラクター素材

2026-09-17。対象：EbisSoft-Design-AiStudio のローカル改修版。

## 採用素材

- `public/images/characters/chroma-official-v2.jpg` — ユーザーが後から指定した正式衣装のクロマ。元の画像をそのまま保存。AI広報の案内とチャットの顔に使用。
- `public/images/characters/ebisu-original.jpg` — ユーザー提供のエビスさん。元の画像をそのまま保存。開発方針・組み込み開発・相談の案内に使用。
- `public/images/characters/chroma-pixel-v2.png` — 正式衣装を参照したドット絵クロマ。右下のアシスタント起動ボタンに使用。内蔵 image_gen で生成。1254 × 1254、RGBA、透過背景。CSSでpixelated表示。旧衣装のドット絵は採用しない。

プロフィール用の切り取りはCSSの表示領域のみで行い、元画像は加工していない。
GitHub PagesのbasePathを付け、Next Imageはunoptimizedで静的書き出しに対応する。
右下のキャラクターは旧WebGLモデルを読み込まず、PNGとCSSの動きで表示する。

## 配置

- トップ：活用シーンの導入にクロマ、開発方針にエビスさん、業種別デモへの案内にクロマ、相談導線に2人。
- AI活用・Web制作：クロマのひとこと。
- 組み込み開発・お問い合わせ：エビスさんのひとこと。
- 常設アシスタント：ドット絵クロマ、クロマの顔アイコン、AI広報の名前・挨拶。

## 採用ドット絵の生成プロンプト（原文）

```text
Use case: stylized-concept.
Asset type: transparent PNG 16-bit pixel sprite for a website AI assistant launcher, clearly readable at about 120 CSS pixels high.
Input image 1 is the ONLY identity and outfit reference. Make a single friendly adult female mascot version of Chroma in genuine low-resolution pixel art. Preserve the red bob haircut, cyan earpiece, confident warm smile, raised index finger pointing upward and other hand on hip.
Costume: faithfully preserve the reference's visible bare shoulder cutouts, short open navy cropped bolero with sleeves, white and navy asymmetric minidress with coral panels, thin cyan piping and subtle side mesh panels, thigh-high dark stockings with top bands and white ankle boots with cyan trim. Simplify details into legible pixel clusters while retaining this costume silhouette. Tasteful friendly adult character, no exaggerated body proportions or sexual emphasis.
Style: authentic crisp 16-bit game sprite, drawn on an approximately 64 by 96 pixel grid then nearest-neighbor enlarged, large clearly visible square pixel clusters, small limited palette, dark pixel outline, flat stepped shading, NO antialiasing or gradients. Compact mascot proportions with a moderately large head, clearly adult character.
Composition: square canvas; one centered full body, all hair and boots visible, approximately 85 percent canvas height, balanced transparent margins.
Background: genuinely transparent PNG alpha everywhere outside the character; do not render a checkerboard, white fill or black fill.
Avoid: text, logos, watermark, other subjects, objects, ground, platform, drop shadow, glow, photorealism, smooth illustration, extra limbs.
```

外縁には一部半透明ピクセルが含まれる。透過を維持して使用。
