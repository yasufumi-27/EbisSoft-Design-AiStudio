import { Container } from "@/components/ui/Container";
import HeroConsole from "@/components/sections/HeroConsole";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { CountUp } from "@/components/fx/CountUp";
import { Tilt } from "@/components/fx/Tilt";
import { stats, trustPoints } from "@/lib/content";
import { siteConfig } from "@/lib/site";
import { ja } from "@/lib/typography";

/**
 * ファーストビューで伝える「頼むと何が得られるか」。
 * 技術名ではなく結果で書き、いずれもサイト内に裏づけ（デモ・サンプル・料金）があるものだけを載せる。
 */
const HERO_VALUES = [
  "最短5日・従来の約1/3の期間で公開できます",
  "18業種の実物サンプルサイトで、仕上がりを事前に確かめられます",
  "表示速度100点・AI検索（AEO / LLMO）に対応した作りが標準です",
];

/**
 * ファーストビュー。ページ内で唯一の <h1> を置き、主要キーワードを含めます。
 * 背景は layout の3D CG（ThreeBackground）が透けて見えるシネマティック構成。
 * LCP最優先のため、前景ビジュアルは画像ではなくCSSで構築しています。
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* 奥行きを強調する光芒（3D背景の上に重ねるCSSグロー） */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_50%_at_50%_-10%,rgba(182,126,255,0.14),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-[-10%] -z-10 size-[38rem] rounded-full bg-accent/15 blur-3xl"
      />
      {/* HUD風の微細グリッド */}
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />

      {/* 上端はヘッダー直下から始める（トップだけの詰め方。下層ページは PageHeader の余白を維持） */}
      <Container className="grid items-center gap-14 pt-6 pb-24 sm:pt-8 sm:pb-28 lg:grid-cols-2 lg:gap-10 lg:pt-10 lg:pb-36">
        {/* min-w-0：グリッド項目の既定（min-width:auto）だと中身の最小幅で列が広がり、
            狭い端末で右端がはみ出すため、必ず縮めるようにしておく */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand-light shadow-[0_0_18px_rgba(182,126,255,0.18)] backdrop-blur">
              <Icon name="pin" className="size-4" />
              {/* 語の途中で折れないよう、意味のまとまりごとに折り返す（改行＝空白になるため1行で書く） */}
              {/* prettier-ignore */}
              <span>{ja(siteConfig.contact.address.locality)}の<span className="nb-strict">Web制作</span>・<span className="nb-strict">組み込み開発</span> <span className="nb-strict">{siteConfig.name}</span></span>
            </p>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-sm font-semibold text-gold-light backdrop-blur">
              <Icon name="sparkles" className="size-4 animate-pulse-glow" />
              {ja("AI活用 × AI検索（AEO / LLMO）対応")}
            </p>
          </div>

          {/* 英字ラベル：見出しの上に置く一本の情報線（HUDの静けさ） */}
          <p className="eyebrow mt-9 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.62rem]">
            <span aria-hidden className="size-1.5 rounded-full bg-brand shadow-[0_0_10px_rgba(182,126,255,0.9)]" />
            AI × Web Production
            <span aria-hidden className="h-px w-10 bg-gradient-to-r from-brand/70 to-transparent" />
            Kyoto, Japan
          </p>

          {/* 行ごとに立ち上がる見出し（文字は分割していないので折り返し・読み上げに影響なし） */}
          {/* [word-break:keep-all] は語の途中で折らないぶん、狭い端末では1行が伸びる。
              画面幅に追従する clamp で字送りを決め、どの端末でも見切れないようにする。
              1行目に「誰に」を小さく置くのは、最初の数秒で対象読者が分かるようにするため。
              h1 の中に入れているので、見出しとしての地域キーワードにもなる。 */}
          <h1 className="mt-4 text-[clamp(1.6rem,7.6vw,2.25rem)] font-bold leading-[1.16] tracking-tight text-white [word-break:keep-all] sm:text-5xl lg:text-[3.5rem]">
            {/* display は指定しない：.hero-line > span 側が inline-block を与える */}
            <span className="hero-line">
              <span
                className="mb-2 text-base font-semibold text-brand-light sm:text-lg lg:text-xl"
                style={{ "--line-delay": "0s" } as React.CSSProperties}
              >
                {ja("京都・関西の中小企業のための")}
              </span>
            </span>
            <span className="hero-line">
              <span style={{ "--line-delay": "0.08s" } as React.CSSProperties}>
                <span className="text-gradient">AI活用</span>の{ja("Web制作")}と
              </span>
            </span>
            <span className="hero-line">
              <span style={{ "--line-delay": "0.26s" } as React.CSSProperties}>
                <span className="text-gold">組み込み</span>開発
              </span>
            </span>
          </h1>

          <p className="speakable mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-slate-300 sm:text-lg">
            {ja(siteConfig.name)}は、{ja(siteConfig.contact.address.locality)}
            {ja("のソフトウェア開発事業者です。生成AIを制作フロー全体に組み込み、")}
            <strong className="font-bold text-white">{ja("制作期間は従来の約1/3、最短5日で公開")}</strong>
            {ja("。マイコン・IoT機器の組み込みソフトウェア開発もお引き受けします。")}
          </p>

          {/* 「頼むと何が得られるか」を3行で。技術名ではなく結果を書く。 */}
          <ul className="mt-6 max-w-lg space-y-2.5">
            {HERO_VALUES.map((v) => (
              <li key={v} className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-slate-300 sm:text-base">
                <Icon
                  name="check"
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-brand"
                />
                <span className="min-w-0">{ja(v)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/contact" size="lg" withArrow>
              {ja("無料で相談する")}
            </ButtonLink>
            {/* 副CTAは「実物を見せる」導線。検討中の方は説明よりも仕上がりを先に見たがるため。 */}
            <ButtonLink href="/showcase" size="lg" variant="secondary">
              {ja("制作サンプルを見る")}
            </ButtonLink>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-500">
            {ja("初回のご相談・お見積もりは無料です。")}
            {ja("しつこい営業はいたしません。")}
          </p>
        </div>

        {/* AI制作パイプラインのコンソール（工程ごとのAI／人の分担を可視化） */}
        <div className="relative min-w-0">
          <Tilt>
            <div className="animate-float">
              <HeroConsole />
            </div>
          </Tilt>

          {/* 速度バッジ */}
          <div className="panel absolute -bottom-9 -left-6 hidden p-3 shadow-[0_0_30px_rgba(16,185,129,0.15)] sm:flex sm:items-center sm:gap-3">
            <span className="grid size-10 place-items-center rounded-none border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              <Icon name="gauge" className="size-5" />
            </span>
            <span className="text-sm">
              <span className="block font-bold text-white">{ja("表示速度 100点")}</span>
              <span className="block whitespace-nowrap text-slate-400">Core Web Vitals最適化</span>
            </span>
          </div>
        </div>
      </Container>

      {/* 信頼指標：HUD風の計器パネル */}
      <Container className="pb-20 lg:pb-24">
        <dl className="panel panel-corners grid grid-cols-2 divide-x divide-white/5 overflow-hidden sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="relative min-w-0 px-4 py-6 text-center sm:px-6 sm:py-7"
              style={{ "--reveal-delay": `${i * 0.08}s` } as React.CSSProperties}
            >
              <dt className="sr-only">{ja(s.label)}</dt>
              <dd>
                <span className="font-display block text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  <CountUp value={s.value} className="text-gradient" />
                </span>
                <span className="mt-2 block text-[0.8125rem] leading-relaxed text-slate-400 sm:text-sm">
                  {ja(s.label)}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        {/*
          事業者としての裏付け（信頼バー）。
          いずれも会社概要と同じ事実で、実績件数のような裏づけのない数字は置かない。
        */}
        <ul
          className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[0.8125rem] text-slate-400 sm:text-sm"
          data-reveal
        >
          {trustPoints.map((t) => (
            <li key={t.label} className="flex min-w-0 items-center gap-2">
              <Icon name={t.icon} aria-hidden className="size-4 shrink-0 text-brand/80" />
              <span className="min-w-0">
                <span className="sr-only">{ja(t.label)}：</span>
                {ja(t.value)}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
