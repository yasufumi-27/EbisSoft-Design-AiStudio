/* eslint-disable @next/next/no-img-element -- Prebuilt responsive assets support static hosting. */
/** Transparent sprite derived from the user-supplied humanized Chroma. */
export function PixelChroma() {
  const base = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/characters/optimized`;
  return <span className="chroma-pixel" aria-hidden="true">
    <img src={`${base}/chroma-rpg-v3.webp`} width={256} height={256} alt="" loading="eager" decoding="async"/>
  </span>;
}
