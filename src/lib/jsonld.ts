/**
 * 構造化データ（JSON-LD / schema.org）のビルダー。
 * Google が理解できる形で「事業者」「サイト」「サービス」「FAQ」「パンくず」を記述し、
 * リッチリザルトやナレッジパネルの対象になりやすくします。
 *
 * @id で各ノードを相互参照し、重複のない一貫したグラフを作ります。
 * 実在しない評価（レビュー）等は出力しません（誤解を招く構造化データはE-E-A-T上の不利）。
 */

import { siteConfig, absoluteUrl } from "@/lib/site";
import {
  aeo,
  faqs,
  services,
  servicesByCategory,
  steps,
  capabilities,
  type Capability,
  type ServiceCategory,
} from "@/lib/content";
import { author, hasNamedAuthor } from "@/lib/author";
import type { Column } from "@/lib/columns";

type JsonLd = Record<string, unknown>;

/** カテゴリ別サービス一覧の名称（構造化データのリスト名に使用）。 */
const SERVICE_LIST_NAME: Record<ServiceCategory, string> = {
  ai: "AI関連サービス",
  web: "Web制作サービス",
  embedded: "組み込みソフトウェア開発サービス",
};

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

/** ビルド時点の日付（静的書き出しのため生成時に固定される） */
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/**
 * 事業者（ProfessionalService = LocalBusiness のサブタイプ）。
 * 住所・座標・営業時間・提供サービスを持たせ、ローカルSEO（京都市伏見区）に対応。
 */
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": ["ProfessionalService", "Organization"],
    "@id": ORGANIZATION_ID,
    name: siteConfig.legalName,
    url: siteConfig.homeUrl,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon.svg"),
    },
    image: absoluteUrl("/opengraph-image"),
    description: siteConfig.description,
    slogan: "AIを駆使して、最速で、高性能なサイトを。",
    foundingDate: siteConfig.foundingDate,
    telephone: siteConfig.contact.telephone,
    email: siteConfig.contact.email,
    priceRange: siteConfig.priceRange,
    currenciesAccepted: "JPY",
    // 専門領域を明示し、AI/LLMに「何の専門家か」を理解させる（LLMO）
    knowsAbout: [...siteConfig.knowsAbout],
    knowsLanguage: ["ja", "en"],
    address: {
      "@type": "PostalAddress",
      postalCode: siteConfig.contact.address.postalCode,
      addressRegion: siteConfig.contact.address.region,
      addressLocality: siteConfig.contact.address.locality,
      streetAddress: siteConfig.contact.address.street,
      addressCountry: siteConfig.contact.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.contact.geo.latitude,
      longitude: siteConfig.contact.geo.longitude,
    },
    areaServed: siteConfig.areaServedList.map((a) => ({ "@type": "AdministrativeArea", name: a })),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "10:00",
      closes: "19:00",
    },
    // 実在するアカウントがある場合のみ出力（架空のプロフィールを載せない）
    ...(siteConfig.sameAs.length > 0 ? { sameAs: [...siteConfig.sameAs] } : {}),
    // 代表者（E-E-A-T：誰が事業をしているか）。実名が未設定のときは出力しない。
    // このノードは全ページの共通JSON-LDに出るため、記事の author から @id で参照できる。
    ...(hasNamedAuthor
      ? {
          founder: {
            "@type": "Person",
            "@id": `${siteConfig.url}/#author`,
            name: author.personName,
            alternateName: author.personNameRomaji,
            jobTitle: author.personRole,
            worksFor: { "@id": ORGANIZATION_ID },
          },
        }
      : {}),
    // 所属団体（商工団体への加入は事業者の実在性・信頼性のシグナルになる）
    memberOf: siteConfig.memberOf.map((m) => ({
      "@type": "Organization",
      name: m.name,
      description: m.description,
      url: m.url,
    })),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: siteConfig.contact.telephone,
      email: siteConfig.contact.email,
      areaServed: "JP",
      availableLanguage: ["Japanese", "English"],
    },
    // 提供サービスのカタログ（AIがサービス内容を構造的に把握できる）
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${siteConfig.name}の提供サービス`,
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.title,
          description: s.description,
        },
      })),
    },
  };
}

/** サイト本体（WebSite）。publisher で事業者を参照。 */
export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.homeUrl,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: siteConfig.lang,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** パンくず（BreadcrumbList）。 */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[] = [{ name: "ホーム", path: "/" }],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * 提供サービス一覧（ItemList）。各サービスを provider に紐づけ。
 * category を渡すと、その詳細ページに掲載しているサービスだけを出力します
 * （ページの見た目と構造化データを一致させ、実態と異なる記述を作らないため）。
 */
export function servicesJsonLd(category?: ServiceCategory): JsonLd {
  const items = category ? servicesByCategory(category) : services;
  const listName = category
    ? `${siteConfig.name}の${SERVICE_LIST_NAME[category]}`
    : `${siteConfig.name}の提供サービス`;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    itemListElement: items.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.description,
        serviceType: s.title,
        provider: { "@id": ORGANIZATION_ID },
        areaServed: siteConfig.areaServedList.map((a) => ({
          "@type": "AdministrativeArea",
          name: a,
        })),
      },
    })),
  };
}

/**
 * 「できること」一覧（ItemList）。各項目を実際に触れるデモページに紐づけ、
 * AI・検索エンジンに「主張ではなく実物がある」ことを伝えます。
 */
export function capabilitiesJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${siteConfig.name}でできること（実動デモつき）`,
    description:
      "3DCG・Webアニメーション・AIチャットボット・SNS連携・システム連携。それぞれ実際に動くデモを公開しています。",
    itemListElement: capabilities.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.title,
      url: absoluteUrl(`/demo/${c.slug}`),
      item: {
        "@type": "Service",
        name: c.title,
        description: c.description,
        serviceType: c.title,
        url: absoluteUrl(`/demo/${c.slug}`),
        provider: { "@id": ORGANIZATION_ID },
      },
    })),
  };
}

/** FAQ（FAQPage）。content.ts の faqs と同期。 */
export function faqJsonLd(items: { question: string; answer: string }[] = faqs): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/**
 * 用語の定義（DefinedTermSet）。
 * AEO / LLMO のような専門用語を機械可読な定義として置くことで、
 * 「AEOとは？」型の質問に対する引用元になりやすくします（AEO）。
 */
export function definedTermsJsonLd(path: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${absoluteUrl(path)}#terms`,
    name: "AI検索まわりの用語",
    hasDefinedTerm: aeo.definitions.map((d) => ({
      "@type": "DefinedTerm",
      name: d.term,
      alternateName: d.full,
      description: d.description,
      inDefinedTermSet: `${absoluteUrl(path)}#terms`,
    })),
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** 制作の流れ（HowTo）。AEO（手順系の回答）に有効。content.ts の steps と同期。 */
export function howToJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${siteConfig.name}のWeb制作の流れ`,
    description: "ご相談から公開・運用まで、AIを活用したWebサイト制作のステップ。",
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.description,
    })),
  };
}

/**
 * ページ本体（WebPage）。
 * speakable で音声アシスタント/回答エンジンに読み上げ・抽出してほしい箇所
 * （.speakable クラスの要点・FAQ）を指定します（AEO）。
 */
export function webPageJsonLd(opts?: {
  path?: string;
  name?: string;
  description?: string;
  type?: "WebPage" | "CollectionPage" | "AboutPage";
  /** 記事ページなど、ページ固有の日付を持つ場合に上書きする */
  datePublished?: string;
  dateModified?: string;
}): JsonLd {
  const path = opts?.path ?? "/";
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": opts?.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: opts?.name ?? siteConfig.title,
    description: opts?.description ?? siteConfig.description,
    inLanguage: siteConfig.lang,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    primaryImageOfPage: absoluteUrl("/opengraph-image"),
    datePublished: opts?.datePublished ?? siteConfig.foundingDate,
    dateModified: opts?.dateModified ?? BUILD_DATE,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".speakable"],
    },
  };
}

/**
 * 著者（E-E-A-T）。
 * 代表者の実名が確定していない間は、著者を事業者（Organization）として扱います。
 * 実在しない人物を Person として出力しないための切り替えです。
 */
export function authorRef(): JsonLd {
  return hasNamedAuthor
    ? {
        "@type": "Person",
        "@id": `${siteConfig.url}/#author`,
        name: author.personName,
        alternateName: author.personNameRomaji,
        jobTitle: author.personRole,
        description: author.bio,
        worksFor: { "@id": ORGANIZATION_ID },
        knowsAbout: [...siteConfig.knowsAbout],
        url: absoluteUrl("/company"),
      }
    : { "@id": ORGANIZATION_ID };
}

/**
 * コラム記事（Article）。
 * 見出し・公開日・更新日・著者・発行者を明示し、「誰がいつ書いたか」を機械可読にします。
 * about / mentions に扱っている主題を入れることで、AIが記事の対象を取り違えにくくなります。
 */
export function articleJsonLd(column: Column): JsonLd {
  const url = absoluteUrl(`/columns/${column.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: column.title,
    description: column.description,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    inLanguage: siteConfig.lang,
    datePublished: column.published,
    dateModified: column.updated,
    author: authorRef(),
    publisher: { "@id": ORGANIZATION_ID },
    image: absoluteUrl("/opengraph-image"),
    articleSection: column.category,
    keywords: column.keywords.join(", "),
    wordCount: countCharacters(column),
    timeRequired: `PT${column.readMinutes}M`,
    about: { "@id": ORGANIZATION_ID },
    isAccessibleForFree: true,
    // 記事が答える質問と結論を明示（AEO：回答としてそのまま引用されやすくする）
    mainEntity: {
      "@type": "Question",
      name: column.question,
      acceptedAnswer: { "@type": "Answer", text: column.answer },
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".speakable"],
    },
  };
}

/** 記事の本文文字数（wordCount 用のおおよその値） */
function countCharacters(column: Column): number {
  return column.body.reduce((total, block) => {
    switch (block.type) {
      case "h2":
      case "h3":
      case "p":
        return total + block.text.length;
      case "ul":
        return total + block.items.join("").length;
      case "steps":
        return total + block.items.reduce((n, i) => n + i.title.length + i.body.length, 0);
      case "table":
        return total + block.rows.flat().join("").length;
      case "note":
      case "link":
        return total + block.body.length;
    }
  }, column.answer.length);
}

/** コラム一覧（Blog）。個々の記事を BlogPosting として並べる。 */
export function blogJsonLd(items: Column[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${absoluteUrl("/columns")}#blog`,
    name: `${siteConfig.name}のコラム`,
    description:
      "AIを使ったWeb制作の実際、費用と期間、AI検索（AEO / LLMO）対策について、実測にもとづいて書いています。",
    url: absoluteUrl("/columns"),
    inLanguage: siteConfig.lang,
    publisher: { "@id": ORGANIZATION_ID },
    blogPost: items.map((c) => ({
      "@type": "BlogPosting",
      "@id": `${absoluteUrl(`/columns/${c.slug}`)}#article`,
      headline: c.title,
      description: c.description,
      url: absoluteUrl(`/columns/${c.slug}`),
      datePublished: c.published,
      dateModified: c.updated,
      author: authorRef(),
      publisher: { "@id": ORGANIZATION_ID },
    })),
  };
}

/**
 * デモページ（できること）の構造化データ。
 * 実際に操作できるデモを WebApplication として明示し、
 * 「説明ではなく動く実物がある」ことを検索エンジン・生成AIに伝えます。
 */
export function capabilityJsonLd(c: Capability): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(`/demo/${c.slug}`)}#service`,
    name: c.searchTitle,
    alternateName: c.title,
    description: c.description,
    serviceType: c.title,
    // 検索されている言葉をそのまま渡す（機能名だけだと検索意図に当たらない）
    keywords: c.searchTerms.join(", "),
    url: absoluteUrl(`/demo/${c.slug}`),
    provider: { "@id": ORGANIZATION_ID },
    areaServed: siteConfig.areaServedList.map((a) => ({ "@type": "AdministrativeArea", name: a })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${c.title}でできること`,
      itemListElement: c.bullets.map((b) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: b },
      })),
    },
    subjectOf: {
      "@type": "WebApplication",
      name: `${c.title}のデモ`,
      description: c.demoNote,
      url: absoluteUrl(`/demo/${c.slug}`),
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web Browser",
      browserRequirements: "モダンブラウザ（JavaScript有効）",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      publisher: { "@id": ORGANIZATION_ID },
    },
  };
}
