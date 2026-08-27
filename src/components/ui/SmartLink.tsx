"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

/**
 * ページ内アンカーを正しく扱うリンク。
 *
 * 【背景】
 * 下層ページからでもトップの各セクションへ飛べるよう、リンクは `/#services` の形で書く。
 * ところが next/link は「同じページへの hash 付きリンク」をルート遷移として扱うため、
 * トップページ上でクリックしても **URLのhashだけ変わってスクロールしない**（＝メニューが反応しない）。
 * さらに basePath 配信時は `/EbisSoft#services` という形になり、素の hash とも一致しない。
 *
 * 【対応】
 * - いま表示中のページ自身へのアンカーなら、素の <a href="#hash"> として描画する。
 *   ブラウザ標準の挙動になるため、globals.css の scroll-behavior:smooth と
 *   scroll-padding-top（固定ヘッダー分のオフセット）がそのまま効く。
 * - 別ページへのリンクなら通常どおり next/link で遷移する（遷移後にhashへスクロールされる）。
 */

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children" | "onClick">;

export function SmartLink({ href, children, className, onClick, ...rest }: Props) {
  const pathname = usePathname();

  const hashIndex = href.indexOf("#");
  if (hashIndex !== -1) {
    const path = href.slice(0, hashIndex) || "/";
    const hash = href.slice(hashIndex);
    // 「/#foo」「#foo」「/demo#foo」いずれも、現在地と同じページなら素のアンカーにする
    const normalized = path === "" ? "/" : path.replace(/\/$/, "") || "/";
    if (normalized === (pathname || "/")) {
      return (
        <a href={hash} className={className} onClick={onClick} {...rest}>
          {children}
        </a>
      );
    }
  }

  return (
    // ヘッダー/フッターのナビは全ページに出るため、画面内に入っただけの先読みはしない
    // （Next.js は prefetch={false} でもホバー時には先読みするので、遷移の速さは保たれる）
    <Link prefetch={false} href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
