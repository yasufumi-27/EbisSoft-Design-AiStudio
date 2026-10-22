'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const projectRoot = process.argv[3] || process.cwd();
process.env.NODE_PATH = path.join(projectRoot, 'node_modules');
require('node:module').Module._initPaths();
const baseline = require(process.argv[2]);
const patched = require(projectRoot + '/node_modules/braces');
assert.equal(require('node:fs').realpathSync(require.resolve('braces')), path.join(projectRoot, 'vendor/braces/index.js'));
const patterns = ['{a,b}', 'a/{b,{c,d}}/e', '{1..5}', '{01..05..2}', '{a..e..2}', '\\{a,b\\}', '{a\\,b,c}', '"{a,b}"', "'{a,b}'", '`{a,b}`', '[{a,b}]', '[[{x,y}]]', '${a,b}', '{a,,b}', '{', 'a{b', '({a,b})', '{(a,b),c}', '{1..x,y}', '{}', '', 'plain', '{a,{b,c}}'.repeat(3), '{'.repeat(64)+'a,b'+'}'.repeat(64), '('.repeat(64)+'x'+')'.repeat(64)];
patterns.push('{5..1}', '{10..0..-2}', '{-5..5..2}', '{z..a..3}', '{001..011..2}', '{100000..0..1000}', '{a..z}', '{1..10000..100}', '{5..1..0}');
const options = [{}, {expand:true}, {keepEscaping:true}, {keepQuotes:true}, {escapeInvalid:true}, {rangeLimit:false}, {maxLength:Infinity}, {noempty:true,nodupes:true}, {step:2}, {rangeLimit:2}, {maxLength:5}];
let count = 0;
const outcome = fn => { try { return {value:fn()}; } catch (e) { return {error:e.constructor.name,message:e.message}; } };
for (const pattern of patterns) for (const opts of options) {
  for (const method of ['create','compile','expand','stringify']) {
    assert.deepEqual(outcome(()=>patched[method](pattern,opts)),outcome(()=>baseline[method](pattern,opts)), `${method} ${pattern} ${JSON.stringify(opts)}`); count++;
  }
  assert.deepEqual(outcome(()=>patched(pattern,opts)),outcome(()=>baseline(pattern,opts))); count++;
  assert.equal(patched.stringify(patched.parse(pattern)),baseline.stringify(baseline.parse(pattern))); count++;
}
for (const opts of [{}, {maxLength:Infinity, maxDepth:Infinity, depth:Infinity, rangeLimit:false,expand:true}, {keepQuotes:true,keepEscaping:true}]) {
  for (const pattern of ['{'.repeat(1000)+'a,b'+'}'.repeat(1000), '('.repeat(1000)+'x'+')'.repeat(1000), '{('.repeat(500)+'x'+')}'.repeat(500), '{'.repeat(1000)]) {
    for (const method of ['parse','create','compile','expand','stringify']) assert.throws(()=>patched[method](pattern,opts), {name:'SyntaxError'});
    assert.throws(()=>patched([pattern],opts), {name:'SyntaxError'});
  }
}
for (const method of ['compile','expand','stringify']) {
  const direct = require(projectRoot+'/node_modules/braces/lib/'+method);
  let ast = {type:'root',nodes:[]}, cursor = ast;
  for(let i=0;i<10000;i++) { const child = {type:'paren',nodes:[],parent:cursor}; cursor.nodes.push(child); cursor=child; }
  for(const fn of [patched[method],direct]) assert.throws(()=>fn(ast,{rangeLimit:false,maxDepth:Infinity}),{name:'SyntaxError'});
  const cyclic={type:'root',nodes:[]};cyclic.nodes.push(cyclic);
  assert.throws(()=>direct(cyclic),{name:'SyntaxError'});
  const parentCycle={type:'paren',nodes:[]};parentCycle.parent=parentCycle;
  assert.throws(()=>direct(parentCycle),{name:'SyntaxError'});
}
// Lexical literals must remain usable even when they contain many delimiters.
for(const p of ['\\{'.repeat(1000), '"'+'{('.repeat(1000)+'"', '['+'{('.repeat(1000)+']']) assert.equal(patched.stringify(p),baseline.stringify(p));
const mm=require(projectRoot+'/node_modules/micromatch');
assert.deepEqual(mm(['a.js','b.ts','c.css'],'*.{js,ts}'),['a.js','b.ts']);
const fg=require(projectRoot+'/node_modules/fast-glob');
assert.deepEqual(fg.sync('{index,missing}.js',{cwd:path.join(projectRoot,'vendor/braces')}),['index.js']);
(async()=>{
 let ESLint;
 try { ({ESLint}=require(projectRoot+'/node_modules/eslint')); } catch(e) {
   if(e.code!=='MODULE_NOT_FOUND' || !e.message.includes(projectRoot+'/node_modules/eslint')) throw e;
   console.log(JSON.stringify({status:'passed',differentialChecks:count,deepNesting:true,AST:true,micromatch:true,fastGlob:true,ESLint:'not installed in this project'}));
   return;
 }
 const eslint=new ESLint({cwd:path.join(projectRoot,'vendor/braces'),overrideConfigFile:true,overrideConfig:[{files:['**/*.{js,cjs}'],rules:{'no-undef':'error'}}]});
 const result=await eslint.lintText('const ok = 1; void ok;', {filePath:'braces-smoke.js'});
 assert.equal(result[0].errorCount,0);
 console.log(JSON.stringify({status:'passed',differentialChecks:count,deepNesting:true,AST:true,micromatch:true,fastGlob:true,ESLint:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
