/* eslint-disable @next/next/no-img-element -- Prebuilt responsive assets support static hosting. */
/** Transparent sprite derived from the user-supplied humanized Chroma. */
export function PixelChroma() {
  const base = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/characters/optimized`;
  return <span className="chroma-pixel" aria-hidden="true">
    <img src={`${base}/chroma-rpg-v3-96.webp`} srcSet={[96, 192, 256].map(width => `${base}/chroma-rpg-v3-${width}.webp ${width}w`).join(", ")} sizes="(max-width: 1023px) 44px, 124px" width={256} height={256} alt="" loading="eager" decoding="async"/>
  </span>;
}
