"use client";

import { RevealInit } from "@/components/fx/RevealInit";
import { PwaInit } from "@/components/fx/PwaInit";
import { SiteAssistant } from "@/components/assistant/SiteAssistant";

/** Brand pages share the lightweight motion system; live demos keep their GPU. */
export function SiteChrome() {
  return <><RevealInit/><PwaInit/><SiteAssistant/></>;
}
