import { execFileSync } from 'node:child_process';
const env = {...process.env, GITHUB_PAGES:'false', STATIC_EXPORT:'true', NEXT_PUBLIC_BASE_PATH:'', NEXT_PUBLIC_SITE_URL:'https://www.yebisusoft.jp', NEXT_PUBLIC_GA_ID:process.env.NEXT_PUBLIC_GA_ID || 'G-1W66QWGV2Y'};
const run = (file,args) => execFileSync(file,args,{env,stdio:'inherit'});
run(process.execPath,['node_modules/next/dist/bin/next','build']);
run(process.execPath,['scripts/fix-image-extensions.mjs']);
run(process.execPath,['scripts/audit-export.mjs','out','https://www.yebisusoft.jp']);
