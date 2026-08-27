"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * デモ本体の遅延読み込み。
 * Three.js やデモ用のロジックは初期表示のクリティカルパスから外し、
 * クライアントでのみ読み込みます（ページのLCP・HTMLサイズに影響しません）。
 */

function Skeleton() {
  return (
    <div className="panel grid h-[420px] place-items-center">
      <span className="font-display animate-pulse text-xs tracking-[0.3em] text-slate-500">
        LOADING DEMO…
      </span>
    </div>
  );
}

const loading = () => <Skeleton />;

const REGISTRY: Record<string, ComponentType> = {
  "3dcg": dynamic(() => import("./Demo3dcg"), { ssr: false, loading }),
  configurator: dynamic(() => import("./DemoConfigurator"), { ssr: false, loading }),
  simulator: dynamic(() => import("./DemoSimulator"), { ssr: false, loading }),
  recommend: dynamic(() => import("./DemoRecommend"), { ssr: false, loading }),
  insight: dynamic(() => import("./DemoInsight"), { ssr: false, loading }),
  ar: dynamic(() => import("./DemoAr"), { ssr: false, loading }),
  animation: dynamic(() => import("./DemoAnimation"), { ssr: false, loading }),
  "ai-chatbot": dynamic(() => import("./DemoChatbot"), { ssr: false, loading }),
  voice: dynamic(() => import("./DemoVoice"), { ssr: false, loading }),
  multilingual: dynamic(() => import("./DemoMultilingual"), { ssr: false, loading }),
  "ai-agent": dynamic(() => import("./DemoAiAgent"), { ssr: false, loading }),
  personalize: dynamic(() => import("./DemoPersonalize"), { ssr: false, loading }),
  sns: dynamic(() => import("./DemoSns"), { ssr: false, loading }),
  integration: dynamic(() => import("./DemoIntegration"), { ssr: false, loading }),
  pwa: dynamic(() => import("./DemoPwa"), { ssr: false, loading }),
};

export function DemoLoader({ slug }: { slug: string }) {
  const Demo = REGISTRY[slug];
  if (!Demo) return null;
  return <Demo />;
}
