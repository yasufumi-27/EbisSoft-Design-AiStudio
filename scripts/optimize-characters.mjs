import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

// Delivery variants only: preserve the supplied source artwork and transparency.
const directory = 'public/images/characters';
await mkdir(`${directory}/optimized`, { recursive: true });
for (const [name, source] of [['chroma', 'chroma-official-v2.jpg'], ['ebisu', 'ebisu-original.jpg']]) {
  for (const width of [160, 320, 640]) {
    await sharp(`${directory}/${source}`).resize({ width }).webp({ quality: 85, effort: 6 })
      .toFile(`${directory}/optimized/${name}-${width}.webp`);
  }
}
for (const width of [128, 256]) {
  await sharp(`${directory}/chroma-pixel-v2.png`).resize({ width, kernel: 'nearest' })
    .webp({ lossless: true, effort: 6 }).toFile(`${directory}/optimized/chroma-pixel-${width}.webp`);
}
