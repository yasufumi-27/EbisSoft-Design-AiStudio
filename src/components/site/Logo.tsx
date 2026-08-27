import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { CompanyLogo } from "@/components/site/CompanyLogo";

/**
 * ロゴ（シンボル＋ワードマーク）。ヘッダー/フッターで共用。
 *
 * デザイン方針：
 * - シンボルは**2Dのフラットなロゴ**（インラインSVG／`CompanyLogo.tsx`）。
 *   立体文字はやめ、リング上の文字（CLOUD/SECURITY/… ）も無し。
 *   サイト背景と3DCGデモの3Dモデルはそのまま（ここだけ2D）。
 * - ワードマークは `YEBISU`（白）＋ `SOFT`（シアン）。画像は小さいと文字が読めないため、
 *   社名が確実に伝わるよう文字は残す。
 *   ※ このデザイン案ではサイトのテーマ色を紫へ振っているが、**ロゴは本番とまったく同じ**に
 *      保つ決まりなので、ここだけはテーマトークン（text-brand）を使わず、本番のシアンを直接指定している。
 *   社名が確実に伝わるよう文字は残す（画像だけにすると潰れて読めない）。
 * - 読み上げ・SEO上の社名は日本語の「エビスソフト」なので、リンクの aria-label で補い、
 *   画像側の alt は空にして重複読み上げを避ける。
 *
 * ※ ファビコン（`app/icon.svg`）は16〜32pxで潰れないよう、
 *   `YE` の2文字マークに縮めています。
 */
export function Logo() {
  return (
    <Link
      prefetch={false}
      href="/"
      className="group inline-flex items-center whitespace-nowrap"
      aria-label={`${siteConfig.name} ホームへ`}
    >
      <CompanyLogo
        alt=""
        className="mr-2 h-11 w-auto shrink-0 transition-[filter] group-hover:brightness-110 sm:mr-2.5 sm:h-14"
      />
      <span
        aria-hidden
        className="text-lg font-extrabold tracking-[0.1em] text-white transition-colors group-hover:text-[#a5f3fc] sm:text-xl"
      >
        YEBISU
      </span>
      <span
        aria-hidden
        className="ml-2 text-lg font-extrabold tracking-[0.1em] text-[#22d3ee] sm:text-xl"
      >
        SOFT
      </span>
    </Link>
  );
}
