"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { siteConfig } from "@/lib/site";
import { inquiryGroups, type InquiryGroup } from "@/lib/inquiry";
import { ja } from "@/lib/typography";
import { trackEvent } from "@/lib/analytics";

/**
 * お問い合わせフォーム（/contact 専用）。
 *
 * 送信は本番（さくら）の `/api/contact.php` へ fetch で POST します。
 * 静的書き出しのサイトなので Server Actions は使えませんが、さくらは PHP が動くため
 * 外部のフォームサービスを経由せずに実送信できます。
 *
 * PHP が無い環境（GitHub Pages のプレビュー・ローカルの静的配信）や、
 * 送信が失敗したときは、従来どおり mailto でメールソフトを起動する方式に切り替えます。
 * ＝ どの環境でも問い合わせが成立しなくならないようにしています。
 *
 * 入力のハードルを下げるため、必須はお名前・メール・「やりたいこと」の3つだけ。
 * 選択項目は未選択のまま送信できます。
 */

type Errors = Partial<Record<"name" | "email" | "goal", string>>;

/** 送信完了画面の出し分け。api＝実際に送れた／mailto＝メールソフトを起動した */
type SentState = { body: string; mode: "api" | "mailto" };

/** 送信先。GitHub Pages ではサブパス配下になるが、そちらに PHP は無いので必ず失敗→mailto に落ちる */
const ENDPOINT = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/contact.php`;

/** 選択式の1グループ（ラジオ／チェックボックス） */
function ChoiceGroup({ group, uid }: { group: InquiryGroup; uid: string }) {
  const isMulti = group.type === "multi";
  return (
    <fieldset className="border-t border-white/10 pt-6">
      <legend className="flex flex-wrap items-baseline gap-2 pb-1">
        <span className="text-base font-bold text-white">{ja(group.label)}</span>
        <span className="text-[11px] text-slate-500">
          {isMulti ? "複数選択できます" : "1つ選択"}・任意
        </span>
      </legend>
      {group.help ? (
        <p className="mt-1 mb-4 text-xs leading-relaxed text-slate-500">{ja(group.help)}</p>
      ) : (
        <div className="mb-4" />
      )}
      <div className="flex flex-wrap gap-2">
        {group.options.map((o, i) => (
          <label key={o.value} className="cursor-pointer">
            <input
              type={isMulti ? "checkbox" : "radio"}
              name={group.id}
              value={o.value}
              id={`${uid}-${group.id}-${i}`}
              className="peer sr-only"
            />
            <span className="inline-flex items-center gap-1.5 rounded-none border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition-all hover:border-white/30 peer-checked:border-brand/60 peer-checked:bg-brand/15 peer-checked:text-brand-light peer-checked:shadow-[0_0_16px_rgba(182,126,255,0.25)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
              {ja(o.value)}
              {o.note ? (
                <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold-light">
                  {o.note}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** 入力内容をメール本文に整形する（実送信API化するときもこの関数を再利用できる） */
function buildMailBody(data: FormData): string {
  const get = (k: string) => String(data.get(k) ?? "").trim();
  const lines: string[] = [];

  lines.push("■ やりたいこと・実現したいこと");
  lines.push(get("goal") || "（未記入）");
  lines.push("");

  const reference = get("reference");
  if (reference) {
    lines.push("■ 参考にしたいサイト");
    lines.push(reference);
    lines.push("");
  }

  lines.push("■ ご要望の概要");
  for (const g of inquiryGroups) {
    const values = data.getAll(g.id).map(String).filter(Boolean);
    lines.push(`・${g.label}：${values.length ? values.join(" / ") : "未選択"}`);
  }
  lines.push("");

  lines.push("■ お客様情報");
  lines.push(`・会社名／団体名：${get("company") || "（未記入）"}`);
  lines.push(`・お名前：${get("name")}`);
  lines.push(`・メールアドレス：${get("email")}`);
  lines.push(`・電話番号：${get("tel") || "（未記入）"}`);
  lines.push(`・現在のサイト：${get("current_site") || "（なし）"}`);

  return lines.join("\n");
}

export function InquiryForm() {
  const uid = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<SentState | null>(null);
  const [sending, setSending] = useState(false);
  /** 送信に失敗したときの案内。ここが入るとメールソフトでの送信ボタンを出す */
  const [failure, setFailure] = useState<
    { message: string; body: string; subjectName: string } | null
  >(null);
  const [goalLength, setGoalLength] = useState(0);

  const mailtoBase = useMemo(() => `mailto:${siteConfig.contact.email}`, []);
  /**
   * フォームが表示された時刻。速すぎる送信＝自動入力の判定にサーバー側で使う。
   * レンダー中に Date.now() を呼ぶと結果が不安定になるため、マウント後に入れる。
   */
  const mountedAt = useRef<number | null>(null);
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  /** mailto でメールソフトを起動する（PHPが無い環境・送信失敗時のフォールバック） */
  const openMailer = (body: string, subjectName: string) => {
    const subject = `【Web制作のご相談】${subjectName} 様`;
    window.location.href = `${mailtoBase}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSent({ body, mode: "mailto" });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // ハニーポット：ボットが埋めたら黙って成功扱い
    if (String(data.get("company_url") ?? "") !== "") {
      setSent({ body: "", mode: "api" });
      return;
    }

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const goal = String(data.get("goal") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();

    const next: Errors = {};
    if (!name) next.name = "お名前を入力してください。";
    if (!email) next.email = "メールアドレスを入力してください。";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "メールアドレスの形式が正しくありません。";
    }
    if (!goal) next.goal = "やりたいことを一言でも入力してください。";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      // 最初のエラー項目へスクロールして、どこで止まっているか分かるようにする
      const firstKey = Object.keys(next)[0];
      form.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }

    const body = buildMailBody(data);
    const subjectName = company || name;

    setSending(true);
    setFailure(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          goal,
          body,
          company_url: "", // ハニーポット（ここまで来ている＝空）
          elapsed: mountedAt.current
            ? Math.round((Date.now() - mountedAt.current) / 1000)
            : 0,
        }),
      });

      if (res.ok) {
        // このサイトの最重要コンバージョン。GA4 の推奨イベント名で送る
        trackEvent("generate_lead", { form_id: "contact" });
        setSent({ body, mode: "api" });
        return;
      }

      // 連投制限だけは、メールソフトへ逃がさずそのまま伝える（二重送信を防ぐため）
      if (res.status === 429) {
        setFailure({
          message:
            "送信が続けて行われました。しばらく時間をおいてから、もう一度お試しください。",
          body,
          subjectName,
        });
        return;
      }

      throw new Error(`status ${res.status}`);
    } catch {
      // PHPが無い環境（プレビュー）・通信断・サーバーエラー。メールソフトでの送信に案内する
      setFailure({
        message:
          "送信サーバーへ接続できませんでした。お手数ですが、下のボタンからメールでお送りください。",
        body,
        subjectName,
      });
    } finally {
      setSending(false);
    }
  };

  /* ---------------- 送信後 ---------------- */
  if (sent !== null) {
    return (
      <div role="status" className="panel panel-corners p-8 text-center sm:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
          <Icon name="check" className="size-7" />
        </span>
        <h2 className="mt-5 text-xl font-bold text-white">
          {sent.mode === "api"
            ? ja("お問い合わせを送信しました")
            : ja("メールソフトを起動しました")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {sent.mode === "api" ? (
            <>
              {ja("ご入力のメールアドレス宛に、受付内容の控えをお送りしました。")}
              <br />
              {ja("2営業日以内に担当者よりご返信します。")}
            </>
          ) : (
            <>
              {ja("入力内容を差し込んだメールが作成されます。そのまま送信してください。")}
              <br />
              {ja("2営業日以内にご返信します。")}
            </>
          )}
        </p>

        <div className="mt-8 rounded-none border border-white/10 bg-ink/60 p-4 text-left">
          <p className="mb-2 text-xs text-slate-500">
            {sent.mode === "api"
              ? ja("控えのメールが届かない場合は、下記をコピーして")
              : ja("メールソフトが起動しない場合は、下記をコピーして")}{" "}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="text-brand-light underline"
            >
              {siteConfig.contact.email}
            </a>{" "}
            {ja("へお送りください。")}
          </p>
          <pre className="max-h-64 overflow-auto text-[11px] leading-relaxed whitespace-pre-wrap text-slate-400">
            {sent.body}
          </pre>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(sent.body)}
            className="mt-3 rounded-none border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-brand/50 hover:text-brand-light"
          >
            内容をコピー
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSent(null)}
          className="mt-6 text-sm text-slate-500 transition-colors hover:text-white"
        >
          ← 入力内容を修正する
        </button>
      </div>
    );
  }

  /* ---------------- 入力フォーム ---------------- */
  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* ① 一番書いてほしいこと。視覚的にも最優先で置く */}
      <div className="panel panel-corners border-brand/30 p-6 shadow-[0_0_40px_-16px_rgba(182,126,255,0.5)] sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display rounded-none bg-gradient-to-r from-brand to-accent px-2 py-1 text-[10px] font-bold tracking-widest text-ink">
            STEP 1
          </span>
          <span className="text-xs font-bold text-brand-light">ここだけは、ぜひ</span>
        </div>

        <label htmlFor={`${uid}-goal`} className="mt-4 block text-xl font-bold text-white">
          {ja("やりたいこと・実現したいことを教えてください")}
          <span className="ml-2 text-sm text-gold">必須</span>
        </label>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {ja("きれいにまとまっていなくて構いません。「問い合わせを増やしたい」「今のサイトが古い」だけでも大丈夫です。")}
          <strong className="font-bold text-white">{ja("ご予算は後から一緒に調整できます")}</strong>
          {ja("ので、まずはやりたいことを優先して書いてください。")}
        </p>

        <textarea
          id={`${uid}-goal`}
          name="goal"
          rows={6}
          required
          maxLength={2000}
          onChange={(e) => setGoalLength(e.target.value.length)}
          aria-invalid={Boolean(errors.goal)}
          aria-describedby={errors.goal ? `${uid}-goal-error` : undefined}
          className="field mt-4"
          placeholder={`例）
・製品を3Dで回して見せたい。カタログ撮影の費用を減らしたい。
・問い合わせが電話ばかりで手が回らないので、よくある質問はAIに答えさせたい。
・今のサイトがスマホで崩れる。作り直したい。`}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.goal ? (
            <p id={`${uid}-goal-error`} className="text-xs text-rose-400">
              {errors.goal}
            </p>
          ) : (
            <span />
          )}
          <span className="text-[11px] text-slate-600">{goalLength} / 2000</span>
        </div>

        <label htmlFor={`${uid}-reference`} className="mt-6 block text-sm font-semibold text-slate-200">
          {ja("参考にしたいサイト（任意）")}
        </label>
        <input
          id={`${uid}-reference`}
          name="reference"
          type="text"
          className="field"
          placeholder="https://... 「こういう雰囲気が good」などのメモでも構いません"
        />
      </div>

      {/* ② ざっくりの想定。すべて任意なので既定では畳んでおき、
          書きたい人だけが開けばよいようにする（閉じたままでも送信できます）。 */}
      <details className="panel group p-6 sm:p-8">
        <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-x-4 [&::-webkit-details-marker]:hidden">
          <span className="col-start-1 flex flex-wrap items-center gap-2">
            <span className="font-display rounded-none border border-white/20 bg-white/5 px-2 py-1 text-[10px] font-bold tracking-widest text-slate-300">
              STEP 2
            </span>
            <span className="text-xs text-slate-500">すべて任意・ざっくりでOK</span>
          </span>
          <h2 className="col-start-1 mt-4 text-xl font-bold text-white">
            {ja("ご要望の目安をお聞かせください")}
          </h2>
          <span className="col-start-1 mt-2 block text-sm leading-relaxed text-slate-400">
            {ja("分かる範囲で選んでください。")}
            <span className="text-slate-300">{ja("開かずに送信しても構いません。")}</span>
          </span>
          {/* 開閉マーク。開くと上向きに反転する */}
          <span
            aria-hidden
            className="col-start-2 row-span-3 row-start-1 grid size-9 shrink-0 place-items-center self-center rounded-full border border-white/15 bg-white/5 text-slate-400 transition-all group-hover:border-brand/50 group-hover:text-brand-light group-open:rotate-180"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 17 3 6h18z" />
            </svg>
          </span>
        </summary>

        <div className="mt-8 space-y-8">
          {inquiryGroups.map((g) => (
            <ChoiceGroup key={g.id} group={g} uid={uid} />
          ))}
        </div>
      </details>

      {/* ③ 連絡先 */}
      <div className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display rounded-none border border-white/20 bg-white/5 px-2 py-1 text-[10px] font-bold tracking-widest text-slate-300">
            STEP 3
          </span>
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">ご連絡先</h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-company`} className="text-sm font-semibold text-slate-200">
              {ja("会社名・団体名")}
            </label>
            <input
              id={`${uid}-company`}
              name="company"
              type="text"
              autoComplete="organization"
              className="field"
              placeholder="株式会社〇〇（個人の方は空欄で構いません）"
            />
          </div>

          <div>
            <label htmlFor={`${uid}-name`} className="text-sm font-semibold text-slate-200">
              {ja("お名前")} <span className="text-gold">必須</span>
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              type="text"
              autoComplete="name"
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${uid}-name-error` : undefined}
              className="field"
              placeholder="山田 太郎"
            />
            {errors.name ? (
              <p id={`${uid}-name-error`} className="mt-1 text-xs text-rose-400">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${uid}-email`} className="text-sm font-semibold text-slate-200">
              {ja("メールアドレス")} <span className="text-gold">必須</span>
            </label>
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${uid}-email-error` : undefined}
              className="field"
              placeholder="you@example.com"
            />
            {errors.email ? (
              <p id={`${uid}-email-error`} className="mt-1 text-xs text-rose-400">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${uid}-tel`} className="text-sm font-semibold text-slate-200">
              {ja("電話番号（任意）")}
            </label>
            <input
              id={`${uid}-tel`}
              name="tel"
              type="tel"
              autoComplete="tel"
              className="field"
              placeholder="075-000-0000"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor={`${uid}-current`} className="text-sm font-semibold text-slate-200">
              {ja("現在のサイトURL（任意）")}
            </label>
            <input
              id={`${uid}-current`}
              name="current_site"
              type="text"
              className="field"
              placeholder="https://... リニューアルのご相談の場合"
            />
          </div>
        </div>

        {/* ハニーポット（スパム対策・視覚とスクリーンリーダーから隠す） */}
        <div aria-hidden className="absolute -left-[9999px]" tabIndex={-1}>
          <label htmlFor={`${uid}-company-url`}>Company URL</label>
          <input
            id={`${uid}-company-url`}
            name="company_url"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="mt-8">
          <Button type="submit" size="lg" withArrow className="w-full" disabled={sending}>
            {sending ? "送信中…" : "この内容で相談する"}
          </Button>

          {/* 送信に失敗したとき。入力内容は消さず、メールソフトでの送信に逃がす */}
          {failure ? (
            <div
              role="alert"
              className="mt-4 rounded-none border border-amber-400/40 bg-amber-400/10 p-4 text-left"
            >
              <p className="text-sm leading-relaxed text-amber-200">{ja(failure.message)}</p>
              <button
                type="button"
                onClick={() => openMailer(failure.body, failure.subjectName)}
                className="mt-3 rounded-none border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-brand/50 hover:text-brand-light"
              >
                メールソフトで送る
              </button>
            </div>
          ) : null}

          <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
            {ja("いただいた情報は、お問い合わせ対応の目的にのみ利用します。")}
            <br />
            {ja("送信後、受付内容の控えを自動返信メールでお送りします。")}
          </p>
        </div>
      </div>
    </form>
  );
}
