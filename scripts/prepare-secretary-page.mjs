import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

// This service landing page uses server-rendered HTML and native anchors/details.
// Ship its shared character/figure CSS, motion engine and analytics directly;
// React hydration, RSC bootstrap and the unrelated site-wide styles are unused.
// This is the delivery format in both production and preview, not an audit mode.
const file = 'out/ai-secretary.html';
if (!fs.existsSync(file)) throw new Error('AI secretary landing page is missing');
const preview = process.argv.includes('--preview');
const basePath = preview ? '/EbisSoft-Design-AiStudio' : '';
let html = fs.readFileSync(file, 'utf8');
const sheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map(m => m[1]);
const cssFiles = [...new Set(sheets)].map(url => path.join('out', url.replace(basePath, '').replace(/^\//, '')));
// Retain the shared character, figure and motion styles as well as this page's
// layout. Keep all possible hover/data-attribute states. Only remove selectors
// requiring a class that this static page never renders (including alternatives).
const classes = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/)));
const canMatch = selector => selector.nodes.every(node => {
  if (node.type === 'class') return classes.has(node.value);
  if (node.type === 'pseudo' && [':is', ':where', ':has'].includes(node.value)) {
    return node.nodes.some(canMatch);
  }
  // :not and state pseudos do not require those classes to exist in the DOM.
  return true;
});
// Beasties fully inlines small font sheets and removes their original links.
const inlineSheets = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]);
const pageSheets = [...inlineSheets, ...cssFiles.map(file => fs.readFileSync(file, 'utf8'))].map(css => {
  const sheet = postcss.parse(css);
  sheet.walkRules(rule => {
    if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    const selectors = rule.selectors.filter(selector => {
      return selectorParser().astSync(selector).nodes.some(canMatch);
    });
    if (selectors.length) rule.selectors = selectors;
    else rule.remove();
  });
  return sheet.toString();
});
const stylesheet = postcss.parse(pageSheets.join(''));
const seenRules = new Set();
for (const node of [...stylesheet.nodes].reverse()) {
  const key = node.toString();
  if (seenRules.has(key)) node.remove();
  else seenRules.add(key);
}
// Tailwind's global theme/property registry contains tokens unrelated to this
// page. Follow var() dependencies so shared colors/transforms remain intact.
const referenced = new Set();
const references = value => [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(match => match[1]);
stylesheet.walkDecls(decl => {
  if (!decl.prop.startsWith('--')) references(decl.value).forEach(name => referenced.add(name));
});
for (const match of html.matchAll(/style="([^"]*)"/g)) references(match[1]).forEach(name => referenced.add(name));
let previousSize;
do {
  previousSize = referenced.size;
  stylesheet.walkDecls(decl => {
    if (referenced.has(decl.prop)) references(decl.value).forEach(name => referenced.add(name));
  });
} while (referenced.size !== previousSize);
stylesheet.walkDecls(decl => {
  if (decl.prop.startsWith('--') && !referenced.has(decl.prop)) decl.remove();
});
stylesheet.walkAtRules('property', rule => { if (!referenced.has(rule.params)) rule.remove(); });
const animations = [];
stylesheet.walkDecls(/^animation(?:-name)?$/, decl => animations.push(decl.value));
stylesheet.walkAtRules(/keyframes$/, rule => {
  if (!animations.some(value => value.includes(rule.params) || value.includes('var('))) rule.remove();
});
stylesheet.walkRules(rule => { if (!rule.nodes.length) rule.remove(); });
// CSS Modules' verbose identifiers are unnecessary in a non-hydrated export.
// Shorten only those identifiers in both HTML and CSS; public motion selectors
// and data attributes remain unchanged. The shared source styles are identical.
const moduleClasses = [...classes].filter(name => name.includes('-module__'));
const compactClasses = new Map(moduleClasses.map((name, index) => [name, `ys${index.toString(36)}`]));
if ([...compactClasses.values()].some(name => classes.has(name))) throw new Error('Class minification collision');
stylesheet.walkRules(rule => {
  if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
  rule.selector = selectorParser(selectors => selectors.walkClasses(node => {
    if (compactClasses.has(node.value)) node.value = compactClasses.get(node.value);
  })).processSync(rule.selector);
});
html = html.replace(/class="([^"]+)"/g, (_, value) => `class="${value.split(/\s+/).map(name => compactClasses.get(name) ?? name).join(' ')}"`);
const css = 'html{scroll-behavior:smooth}body{margin:0}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}' + stylesheet.toString();
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
