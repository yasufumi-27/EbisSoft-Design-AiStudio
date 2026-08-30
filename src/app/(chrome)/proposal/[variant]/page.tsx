import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  DesignProposal,
  proposalVariants,
  type ProposalVariant,
} from "@/components/sections/DesignProposal";

export function generateStaticParams() {
  return proposalVariants.map((variant) => ({ variant }));
}

/**
 * 提案1案ぶんのページ。/proposal と同じく検討用なので noindex。
 * 詳細は ../page.tsx のコメントを参照（canonical の継承事故を防ぐため必ず自分を指す）。
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ variant: string }>;
}): Promise<Metadata> {
  const { variant } = await params;
  return {
    title: `デザイン提案 ${variant}`,
    description:
      "エビスソフトのサイトデザイン提案（1案）。検討用のため検索結果には掲載していません。",
    alternates: { canonical: `/proposal/${variant}` },
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function ProposalVariantPage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  if (!proposalVariants.includes(variant as ProposalVariant)) notFound();
  return <DesignProposal variant={variant as ProposalVariant} />;
}
