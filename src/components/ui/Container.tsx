import type { ReactNode } from "react";

/** ページ共通の最大幅・左右余白を与えるラッパー。 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`gutter-x mx-auto w-full max-w-6xl ${className}`}>{children}</div>
  );
}
