import Image from "next/image";

/** Transparent sprite derived from the user-supplied humanized Chroma. */
export function PixelChroma() {
  return <span className="chroma-pixel" aria-hidden="true">
    <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/characters/chroma-pixel-v2.png`} width={1254} height={1254} alt="" unoptimized loading="eager"/>
  </span>;
}
