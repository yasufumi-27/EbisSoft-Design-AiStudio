import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2] || 'out';
const base = new URL(process.argv[3] || 'https://www.yebisusoft.jp');
const preview = base.hostname.endsWith('github.io');
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const walk = root => fs.readdirSync(root, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(root, e.name)) : [path.join(root, e.name)]);
const files = walk(dir);
const exists = pathname => {
 const relative = decodeURIComponent(pathname).replace(base.pathname.replace(/\/$/, ''), '').replace(/^\//, '');
 return [relative, relative + '.html', path.join(relative, 'index.html')].some(p => fs.existsSync(path.join(dir, p)));
};
const urls = [...fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
const titles = new Set();
for (const url of urls) {
 check(url.startsWith(base.href.replace(/\/$/, '')), `Sitemap origin: ${url}`);
 const pathname = new URL(url).pathname.replace(base.pathname.replace(/\/$/, ''), '');
 const file = path.join(dir, pathname === '/' || !pathname ? 'index.html' : pathname.replace(/^\//, '') + '.html');
 if (!fs.existsSync(file)) { failures.push(`Missing page: ${file}`); continue; }
 const html = fs.readFileSync(file, 'utf8');
 const metas = Object.fromEntries([...html.matchAll(/<meta\b[^>]*>/g)].map(m => { const a = attrs(m[0]); return [a.name || a.property, a.content]; }));
 const canonical = [...html.matchAll(/<link\b[^>]*>/g)].map(m => attrs(m[0])).find(a => a.rel === 'canonical')?.href;
 check(canonical?.replace(/\/$/, '') === url.replace(/\/$/, ''), `Canonical: ${url} -> ${canonical}`);
 check(!!metas.description, `Description: ${url}`);
 check(preview === /noindex/.test(metas.robots || ''), `Indexing mode: ${url}`);
 check((html.match(/<h1\b/g) || []).length === 1, `H1 count: ${url}`);
 const title = html.match(/<title>(.*?)<\/title>/)?.[1];
 check(title && !titles.has(title), `Missing/duplicate title: ${url}`); titles.add(title);
 check(!!metas['og:image'] && exists(new URL(metas['og:image'], base).pathname), `OG image: ${url}`);
 const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
 check(schemas.length > 0, `Structured data missing: ${url}`);
 for (const [, body] of schemas) { try { JSON.parse(body); } catch { failures.push(`Invalid JSON-LD: ${url}`); } }
}
for (const file of files.filter(p => p.endsWith('.html') && !/google|404|_not-found/.test(p))) {
 const html = fs.readFileSync(file, 'utf8').replace(/<script\b[\s\S]*?<\/script>/g, '');
 for (const [,raw] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
  if (!raw.startsWith('/') || raw.startsWith('//')) continue;
  const p = raw.split(/[?#]/)[0];
  check(exists(p), `Broken local reference: ${file} -> ${p}`);
 }
 if (/demosite|proposal|r8-reference/.test(file)) check(/name="robots" content="[^"]*noindex/.test(html), `Internal/demo indexed: ${file}`);
}
check(fs.readFileSync(path.join(dir,'llms.txt'),'utf8').includes(base.hostname), 'LLM guide uses wrong domain');
check(fs.existsSync(path.join(dir,'google0bb809852d5ff9cf.html')), 'Google ownership file missing');
check(fs.existsSync(path.join(dir,'BingSiteAuth.xml')), 'Bing ownership file missing');
console.log(JSON.stringify({mode:preview?'preview':'production',indexableRoutes:urls.length,htmlFiles:files.filter(p=>p.endsWith('.html')).length,failures},null,2));
if(failures.length) process.exitCode=1;
