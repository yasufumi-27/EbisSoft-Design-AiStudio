/* eslint-disable @next/next/no-img-element -- Prebuilt responsive assets support static hosting. */
/** Transparent sprite derived from the user-supplied humanized Chroma. */
export function PixelChroma() {
  const base = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/characters/optimized`;
  return <span className="chroma-pixel" aria-hidden="true">
    <img src={`${base}/chroma-pixel-128.webp`} srcSet={`${base}/chroma-pixel-128.webp 128w, ${base}/chroma-pixel-256.webp 256w`} sizes="(max-width: 1023px) 44px, 128px" width={256} height={256} alt="" loading="eager" decoding="async"/>
  </span>;
}
