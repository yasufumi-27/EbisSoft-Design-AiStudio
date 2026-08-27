"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";

import { DEMO_META, type DemoSlug } from "@/lib/showcase";

/**
 * デモサイトの中に置く「実際に動く機能」1件ぶん。
 *
 * `showcase/LazyDemo.tsx` と役割は同じですが、こちらは
 * **お客様のホームページの中に埋め込まれている**という体裁なので、
 * 見た目は明るいテーマ（`demosite.css`）に合わせ、当社向けの説明文は出しません。
 *
 * 【押すまで読み込まない】
 * `import()` はボタンが押された瞬間に初めて呼びます。ページを開いただけでは
 * どのデモのJSも取得しません（3D・AR・音声などは合計で数MBになるため）。
 */

type AnyProps = Record<string, unknown>;

const IMPORTERS: Record<DemoSlug, () => Promise<{ default: ComponentType<never> }>> = {
  "3dcg": () => import("@/components/demos/Demo3dcg"),
  configurator: () => import("@/components/demos/DemoConfigurator"),
  simulator: () => import("@/components/demos/DemoSimulator"),
  recommend: () => import("@/components/demos/DemoRecommend"),
  insight: () => import("@/components/demos/DemoInsight"),
  ar: () => import("@/components/demos/DemoAr"),
  animation: () => import("@/components/demos/DemoAnimation"),
  "ai-chatbot": () => import("@/components/demos/DemoChatbot"),
  voice: () => import("@/components/demos/DemoVoice"),
  multilingual: () => import("@/components/demos/DemoMultilingual"),
  "ai-agent": () => import("@/components/demos/DemoAiAgent"),
  personalize: () => import("@/components/demos/DemoPersonalize"),
  sns: () => import("@/components/demos/DemoSns"),
  integration: () => import("@/components/demos/DemoIntegration"),
  pwa: () => import("@/components/demos/DemoPwa"),
};

export function DemoSiteFeature({
  slug,
  title,
  scene,
  demoProps,
}: {
  slug: DemoSlug;
  /** この職種での使い道（見出し） */
  title: string;
  /** 具体的な場面 */
  scene: string;
  /** デモ本体に渡す職種別の設定 */
  demoProps?: AnyProps;
}) {
  const [Demo, setDemo] = useState<ComponentType<AnyProps> | null>(null);
  const [booting, setBooting] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const start = useCallback(() => {
    if (booting || Demo) return;
    setBooting(true);
    setFailed(false);
    IMPORTERS[slug]()
      .then((mod) => {
        if (!mounted.current) return;
        setDemo(() => mod.default as unknown as ComponentType<AnyProps>);
        setBooting(false);
      })
      .catch(() => {
        if (!mounted.current) return;
        setBooting(false);
        setFailed(true);
      });
  }, [booting, Demo, slug]);

  return (
    <article className="ds-feature">
      <div className="ds-feature-head">
        <div style={{ minWidth: 0, flex: "1 1 20rem" }}>
          <span className="ds-tag">{DEMO_META[slug].label}</span>
          <h3 style={{ marginTop: "0.6rem" }}>{title}</h3>
          <p>{scene}</p>
        </div>
        <div className="ds-feature-actions">
          {!Demo ? (
            <>
              <button type="button" className="ds-btn ds-btn--primary ds-btn--sm" onClick={start}>
                {booting ? "読み込み中…" : "この機能を動かす"}
              </button>
              <span className="ds-feature-hint">押すまで読み込みません</span>
            </>
          ) : (
            <span className="ds-feature-hint">実際に操作できます</span>
          )}
        </div>
      </div>

      {failed ? (
        <div className="ds-feature-head" style={{ paddingTop: 0 }}>
          <p>読み込みに失敗しました。通信環境をご確認のうえ、もう一度お試しください。</p>
        </div>
      ) : null}

      {Demo ? (
        <div className="ds-feature-body">
          <Demo {...(demoProps ?? {})} />
        </div>
      ) : null}
    </article>
  );
}
