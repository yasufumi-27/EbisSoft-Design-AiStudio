import Image from "next/image";

/** One consistent Chroma identity for the conversation header and responses. */
export function MascotFace({ className = "" }: { className?: string }) {
  return <span className={`chroma-chat-face ${className}`} aria-hidden="true">
    <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/characters/optimized/chroma-rpg-v3.webp`} width={256} height={256} alt="" unoptimized/>
  </span>;
}
