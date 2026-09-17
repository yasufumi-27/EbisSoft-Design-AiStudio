"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StudioMotion } from "./StudioMotion";
import { CharacterStage } from "@/components/characters/CharacterStage";
import { CharacterGuide } from "@/components/characters/CharacterGuide";

/** Reset observers on every route, including client-side transitions. */
export function SubpageExperience({ children }: { children: ReactNode }) {
  const path = usePathname() || "/";
  if (path === "/") return children;
  const hasClosing = ["/ai", "/web", "/embedded", "/company", "/request", "/demo"].includes(path) || path.startsWith("/demo/");
  return <StudioMotion key={path} variant="page">
    {children}
    {path.startsWith("/proposal") && <div className="studio-proposal-guide"><CharacterStage character="chroma" figure="web-hero"/></div>}
    {!hasClosing && <CharacterGuide character="ebisu" standalone title={path === "/contact" ? "送信前に、ひとつずつ。" : "気になることは、そのまま相談へ。"} href={path === "/contact" ? "/faq" : "/contact"} linkLabel={path === "/contact" ? "よくある質問を見る" : "無料で相談する"}>
      {path === "/contact" ? "入力に迷ったら、よくある質問もご覧ください。まだ決まっていない項目は、無理に埋めなくて大丈夫です。" : "マネージャーのエビスさんです。クロマの案内で気になったこと、実現したいことをお聞かせください。担当者と一緒に、進め方を整理しましょう。"}
    </CharacterGuide>}
  </StudioMotion>;
}
