 'use strict';
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const projectRoot = process.argv[3] || process.cwd();
if (process.argv[2] !== 'child') {
  const child = spawnSync(process.execPath, ['--max-old-space-size=32', __filename, 'child', projectRoot], {
    cwd:process.cwd(), env:process.env, encoding:'utf8', timeout:20000, maxBuffer:1024*1024
  });
  assert.equal(child.error,undefined, String(child.error));
  assert.equal(child.signal,null,child.stderr);
  assert.equal(child.status,0,child.stderr + child.stdout);
  console.log(child.stdout.trim());
} else {
  const braces = require(path.join(projectRoot,'node_modules/braces'));
  const opts = {rangeLimit:false, maxLength:Infinity, maxDepth:Infinity};
  let checks=0;
  const limited = fn => { assert.throws(fn, e => (e.name==='RangeError' && /fixed safety budget/.test(e.message)) || (e.name==='SyntaxError' && /fixed safety limit/.test(e.message))); checks++; };
  for (const method of ['expand','compile','stringify','parse','create']) {
    limited(()=>braces[method]('x'.repeat(65537),{...opts,maxLength:NaN}));
    limited(()=>braces[method]('{'.repeat(1000)+'x'+'}'.repeat(1000),opts));
  }
  for (const method of ['expand','compile']) {
    for (const pattern of ['{0..1000000000}', '{1000000000..0}', '{0..1000000000..2}', '{1000000000..0..-2}', '{9007199254740992..9007199254740992}', '{\u0001..\uffff}', '{1000..\uffff}']) {
      limited(()=>braces[method](pattern,opts));
    }
    limited(()=>braces[method]('{0..1000000000}',{...opts,step:-2}));
    limited(()=>braces[method]('{0..1000000000..0}',opts));
    limited(()=>braces[method]('{0..1000000000}',{...opts,step:0}));
    assert.deepEqual(braces.expand('{5..1..-2}',opts),['5','3','1']);
    assert.deepEqual(braces.expand('{a..g..2}',opts),['a','c','e','g']);
  }
  limited(()=>braces.expand('{a,b,c}'.repeat(20),opts));
  limited(()=>braces('{a,b,c}'.repeat(20),{...opts,expand:true}));
  limited(()=>braces.expand('x'.repeat(9000)+'{1..200}',opts));
  limited(()=>braces.expand('{0..1000..'+'0'.repeat(5000)+'1}',opts));
  limited(()=>braces(Array(10001).fill('x'),opts));
  limited(()=>braces(Array(1000).fill('x'.repeat(2000)),opts));
  const leaf={type:'text',value:'x'};
  let dag=leaf;
  for(let i=0;i<25;i++) dag={type:'root',nodes:[dag,dag]};
  for (const method of ['compile','expand','stringify']) {
    limited(()=>braces[method](dag,opts));
    limited(()=>require(path.join(projectRoot,'node_modules/braces/lib',method))(dag,opts));
    limited(()=>braces[method]({type:'root',nodes:Array(65537).fill(leaf)},opts));
    limited(()=>braces[method]({type:'text',value:'x'.repeat(65537)},opts));
  }
  for (const method of ['compile','expand','stringify']) assert.throws(()=>braces[method]({type:'root',nodes:'x'.repeat(1000000)},opts),TypeError);
  let nested=[];for(let i=0;i<10000;i++) nested=[nested];
  assert.throws(()=>braces([nested],opts),TypeError);
  assert.throws(()=>braces.create(nested,opts),TypeError);
  const ranges = ['{1..9999}', '{9999..1}', '{-5000..4999..2}', '{z..a..2}'];
  for(const pattern of ranges) assert.ok(braces.expand(pattern,opts).length <= 10000);
  assert.equal(braces.expand('{1..10000}',opts).length,10000);
  assert.equal(braces.expand('{10000..1}',opts).length,10000);
  console.log(JSON.stringify({status:'passed',smallHeapMiB:32,deliberateRejections:checks,rangeDirectionsStepsCharacters:true,DAG:true,cartesian3x20:true,outputCharacters:true}));
}
