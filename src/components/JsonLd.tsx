/**
 * JSON-LD（構造化データ）を <script type="application/ld+json"> として描画する。
 * Server Component から呼び出して <head> 相当に出力します。
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify 済みのため XSS リスクは低いが、念のため "<" をエスケープ
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
