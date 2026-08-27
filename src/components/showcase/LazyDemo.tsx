"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";

import { DemoBootScreen } from "@/components/showcase/DemoBootScreen";
import { DEMO_META, type DemoSlug } from "@/lib/showcase";
import { Icon } from "@/components/ui/icons";
import { ja } from "@/lib/typography";

/**
 * デモを「押されてから」読み込む部品。
 *
 * `/demo/<slug>` で使っている `DemoLoader` との違いは、**import を開始する時点**です。
 *   DemoLoader … ページを開いた時点で `dynamic()` を評価する（デモ1つのページなので妥当）
 *   LazyDemo   … 起動ボタンが押されるまで `import()` を**呼ばない**
 *
 * 職種ページには最大10種類以上のデモが並ぶため、開いただけで全部読み込むと
 * 数MBのJSを取得してページが固まります。ここでは
 *   1. 初期状態はカード（説明とボタンだけ。JSの取得ゼロ）
 *   2. ボタン押下で `import()` を開始し、待機画面（ロボットのお辞儀）を表示
 *   3. 読み込みが終わったらデモ本体に差し替える
 * という順で進みます。
 *
 * 待機画面は**最低 900ms** 表示します。速い回線で一瞬だけ表示されると
 * 画面が点滅したように見えるためです。
 */

const MIN_BOOT_MS = 900;

/**
 * デモ本体の読み込み関数。
 * ⚠️ ここは **`import()` を呼ぶ関数**であって、`next/dynamic` を評価してはいけません。
 *    モジュールの先頭で `dynamic()` を作ると、その時点でチャンクの取得が始まる場合があり、
 *    「押すまで読み込まない」という約束が崩れます。
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

export function LazyDemo({
  slug,
  title,
  scene,
  effect,
  demoProps,
}: {
  slug: DemoSlug;
  /** その職種での使い道（見出し） */
  title: string;
  scene: string;
  effect: string;
  /** デモ本体に渡す職種別の設定（3DCGの商品名、連携先の名前など） */
  demoProps?: AnyProps;
}) {
  const meta = DEMO_META[slug];
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

    const startedAt = Date.now();
    IMPORTERS[slug]()
      .then((mod) => {
        // 待機画面がちらつかないよう、最低表示時間だけ待ってから差し替える
        const rest = Math.max(0, MIN_BOOT_MS - (Date.now() - startedAt));
        window.setTimeout(() => {
          if (!mounted.current) return;
          setDemo(() => mod.default as unknown as ComponentType<AnyProps>);
          setBooting(false);
        }, rest);
      })
      .catch(() => {
        if (!mounted.current) return;
        setBooting(false);
        setFailed(true);
      });
  }, [booting, Demo, slug]);

  return (
    <article className="scroll-mt-32" id={`demo-${slug}`}>
      <header className="panel panel-corners p-6 sm:p-7">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-light">
            <Icon name={meta.icon} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wider text-brand-light">{ja(meta.label)}</p>
            <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">{ja(title)}</h3>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-300">{ja(scene)}</p>
        <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-gold-light">
          <Icon name="check" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">{ja(effect)}</span>
        </p>

        {!Demo && !booting ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={start}
              className="btn btn-primary h-11 px-6 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {ja("このデモを起動する")}
              <Icon name="play" className="size-4" />
            </button>
            <span className="text-xs text-slate-500">
              {ja("押すまで読み込みません（ページを軽く保つため）")}
            </span>
          </div>
        ) : null}

        {failed ? (
          <p className="mt-4 text-sm text-rose-300">
            {ja("読み込みに失敗しました。通信環境をご確認のうえ、もう一度お試しください。")}
          </p>
        ) : null}
      </header>

      {booting ? (
        <div className="mt-4">
          <DemoBootScreen label={meta.label} />
        </div>
      ) : null}

      {Demo ? (
        <div className="mt-4">
          <Demo {...(demoProps ?? {})} />
        </div>
      ) : null}
    </article>
  );
}
