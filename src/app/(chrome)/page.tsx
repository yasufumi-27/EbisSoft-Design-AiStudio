import { JsonLd } from "@/components/JsonLd";
import { webPageJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { HomeReframed } from "@/components/sections/HomeReframed";

/**
 * トップページ（会社のホームページ）。
 *
 * 以前は1枚のLPにすべてを載せていましたが、情報量が多く読みにくいため、
 * ここは「各ページの要約と入口」に絞り、詳細は /ai・/web・/embedded に置いています。
 * FAQ もトップは抜粋のみとし、全件は /faq に集約しています（内容の重複を避けるため）。
 */

/** ページ内メニュー（ヘッダー直下に貼り付く）。ページ内の id と対応させる。 */
export default function Home() {
  return (
    <>
      <JsonLd data={[webPageJsonLd(), breadcrumbJsonLd()]} />
      <HomeReframed />
    </>
  );
}
