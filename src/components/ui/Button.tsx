"use client";

import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/ui/icons";
import { SmartLink } from "@/components/ui/SmartLink";
import { jaNode } from "@/lib/typography";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

// 見た目の本体は globals.css の .btn / .btn-* （コーナーカット＋発光＋シーン掃引）
const variants: Record<Variant, string> = {
  primary: "btn-primary focus-visible:outline-brand",
  secondary: "btn-secondary focus-visible:outline-gold",
  ghost: "btn-ghost focus-visible:outline-slate-400",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

const baseClass =
  "btn focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:pointer-events-none";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  withArrow?: boolean;
  children: ReactNode;
  className?: string;
};

/** リンクとして使う CTA ボタン。ページ内アンカーは SmartLink が正しく処理する。 */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  withArrow = false,
  children,
  className = "",
  ...props
}: CommonProps & { href: string } & Omit<ComponentProps<typeof SmartLink>, "href" | "className" | "children">) {
  return (
    <SmartLink
      href={href}
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {jaNode(children)}
      {withArrow ? <Icon name="arrowRight" className="size-4" /> : null}
    </SmartLink>
  );
}

/** フォーム送信などに使う通常のボタン。 */
export function Button({
  variant = "primary",
  size = "md",
  withArrow = false,
  children,
  className = "",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {jaNode(children)}
      {withArrow ? <Icon name="arrowRight" className="size-4" /> : null}
    </button>
  );
}
