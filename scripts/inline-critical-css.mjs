import Beasties from 'beasties';
import fs from 'node:fs';
import path from 'node:path';

// Keep the complete CSS files for hydrated states, navigation and cached visits.
// Only the HTML receives a matching subset so its first paint need not wait for CSS.
const out = 'out';
const preview = process.argv.includes('--preview');
const processor = new Beasties({
  path: out,
  publicPath: preview ? '/EbisSoft-Design-AiStudio/' : '/',
  preload: 'media',
  pruneSource: false,
  reduceInlineStyles: false,
  inlineThreshold: 4096,
  preloadFonts: false,
  logLevel: 'warn',
});
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
let count = 0;
for (const file of walk(out).filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('rel="stylesheet"')) continue;
  const optimized = (await processor.process(html)).replace(/ data-beasties-container(?=[ >])/g, '');
  fs.writeFileSync(file, optimized);
  count++;
}
console.log(`Critical CSS: ${count} pages; full stylesheets retained.`);
