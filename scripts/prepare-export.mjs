import fs from 'node:fs';
// PHP source must never be downloadable from a static GitHub Pages preview.
if (process.argv.includes('--preview')) fs.rmSync('out/api', {recursive:true, force:true});
