import { siteConfig } from "@/lib/site";
import { Icon } from "@/components/ui/icons";
import { SmartLink } from "@/components/ui/SmartLink";

/**
 * スマートフォン向けの固定CTAバー（画面下端）。
 *
 * 【なぜ置くか】
 * スマホでは、問い合わせ導線がページ末尾まで読まないと出てきませんでした。
 * 電話と相談フォームの2つを常に手の届く位置に置き、読んでいる途中でも動けるようにします。
 *
 * 【他の固定要素との関係】
 * 右下の常駐アシスタントと重なるため、`globals.css` の `.assistant-root` は
 * lg 未満でこのバーのぶん（`--mobile-cta-h`）だけ持ち上げてあります。
 * 本文の末尾がバーに隠れないよう、`body` にも同じ高さの余白を入れています。
 * バー自体は lg 以上では表示しません（PCはヘッダーのCTAで足りるため）。
 *
 * サーバーコンポーネントです。電話リンクのクリックは `ContactLinkTracker` が
 * document 側のイベント委譲で拾うため、ここに onClick は要りません。
 */
export function MobileCta() {
  return (
    <>
      {/* 本文末尾がバーに隠れないよう、同じ高さを通常フローに確保する */}
      <div aria-hidden className="mobile-cta-spacer" />
      <div className="mobile-cta" aria-label="お問い合わせ">
        <a
          href={`tel:${siteConfig.contact.telephone}`}
          className="mobile-cta-btn mobile-cta-tel"
        >
          <Icon name="phone" aria-hidden className="size-4" />
          <span>
            電話で相談
            <span className="mobile-cta-sub">
              {siteConfig.contact.telephoneDisplay}
            </span>
          </span>
        </a>
        <SmartLink href="/contact" className="mobile-cta-btn mobile-cta-main">
          <Icon name="mail" aria-hidden className="size-4" />
          <span>
            無料で相談する
            <span className="mobile-cta-sub">お見積もりも無料</span>
          </span>
        </SmartLink>
      </div>
    </>
  );
}
