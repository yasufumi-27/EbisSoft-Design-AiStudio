import { notFound } from "next/navigation";
import { DesignProposal, proposalVariants, type ProposalVariant } from "@/components/sections/DesignProposal";

export function generateStaticParams() {
  return proposalVariants.map((variant) => ({ variant }));
}

export default async function ProposalVariantPage({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (!proposalVariants.includes(variant as ProposalVariant)) notFound();
  return <DesignProposal variant={variant as ProposalVariant} />;
}
