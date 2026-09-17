import { absoluteUrl, siteConfig } from './site';

/** Nested metadata is replaced, not deeply merged, by a route's metadata. */
export const socialMetadata = {
  openGraph: {
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    images: [{ url: absoluteUrl('/opengraph-image.png'), width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image' as const,
    images: [absoluteUrl('/twitter-image.png')],
  },
};
