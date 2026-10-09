import sharp from 'sharp';

// Keep the original artwork; pixel-art variants match the launcher's responsive sizes.
const directory = 'public/images/characters/optimized';
for (const width of [96, 192, 256]) {
  await sharp(`${directory}/chroma-rpg-v3.webp`)
    .resize({ width, kernel: 'nearest' })
    .webp({ lossless: true, effort: 6 })
    .toFile(`${directory}/chroma-rpg-v3-${width}.webp`);
}
