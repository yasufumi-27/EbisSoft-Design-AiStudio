import fs from 'node:fs';
import path from 'node:path';

// This service landing page is authored as server-rendered HTML: native anchors
// and details, no client components. Ship its CSS, motion and analytics directly;
// React hydration, RSC bootstrap and the unrelated site-wide styles are unused.
// This is the delivery format in both production and preview, not an audit mode.
const file = 'out/ai-secretary.html';
if (!fs.existsSync(file)) throw new Error('AI secretary landing page is missing');
const preview = process.argv.includes('--preview');
const basePath = preview ? '/EbisSoft-Design-AiStudio' : '';
let html = fs.readFileSync(file, 'utf8');
const sheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map(m => m[1]);
const cssFiles = [...new Set(sheets)].map(url => path.join('out', url.replace(basePath, '').replace(/^\//, '')));
const pageSheets = cssFiles.map(file => fs.readFileSync(file, 'utf8')).filter(css => css.includes('secretary-module__'));
if (pageSheets.length !== 1) throw new Error(`Expected one secretary stylesheet, found ${pageSheets.length}`);
const css = 'html{scroll-behavior:smooth}body{margin:0}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}' + pageSheets[0];
html = html.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/g, (tag, attributes) =>
  /type="application\/ld\+json"/.test(attributes) || attributes.includes(`src="${basePath}/secretary-motion.js"`) ? tag : '');
html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '');
html = html.replace(/<link\b[^>]*>/g, tag =>
  /rel="stylesheet"/.test(tag) || (/rel="preload"/.test(tag) && /as="(?:font|script)"/.test(tag)) ? '' : tag);
html = html.replace('</head>', `<style id="secretary-page-css">${css}</style></head>`);
if (!preview) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId) {
    if (!/^G-[A-Z0-9]+$/.test(gaId)) throw new Error('Invalid GA4 measurement ID');
    html = html.replace('</body>', `<script src="${basePath}/secretary-analytics.js" data-ga-id="${gaId}" defer></script></body>`);
  }
}
fs.writeFileSync(file, html);
console.log(`AI secretary: static HTML + ${Buffer.byteLength(css)} bytes of CSS; native interactions and analytics retained.`);
