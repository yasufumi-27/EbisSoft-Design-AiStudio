'use strict';

// Local GHSA-vfj7-8cjw-p6xm mitigation. No option can raise this ceiling.
const MAX_DEPTH = 64;
const MAX_LENGTH = 10000;
const MAX_NODES = 65536;
const MAX_RESULTS = 10000;
const MAX_CHARS = 262144;
const resource = () => { throw new RangeError('braces fixed safety budget exceeded'); };
exports.resource = resource;
exports.length = input => { if (input.length > MAX_LENGTH) resource(); };
const fail = () => { throw new SyntaxError('braces nesting exceeds fixed safety limit (64) or contains a cyclic AST'); };

// Mirror parse's lexical handling, before it allocates or walks an AST.
exports.pattern = input => {
  exports.length(input);
  const stack = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '\\') { i++; continue; }
    if (ch === '[') {
      let brackets = 1;
      while (++i < input.length) {
        if (input[i] === '\\') { i++; continue; }
        if (input[i] === '[') brackets++;
        if (input[i] === ']' && --brackets === 0) break;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      while (++i < input.length) {
        if (input[i] === '\\') { i++; continue; }
        if (input[i] === ch) break;
      }
      continue;
    }
    if (ch === '{' || ch === '(') {
      stack.push(ch);
      if (stack.length > MAX_DEPTH) fail();
    } else if ((ch === '}' && stack[stack.length - 1] === '{') ||
               (ch === ')' && stack[stack.length - 1] === '(')) {
      stack.pop();
    }
  }
};

// Iterative DFS: check child paths and parent chains used by expand.
// Parent/prev backlinks are normal in upstream ASTs; do not traverse prev.
exports.ast = ast => {
  const seen = new Set();
  let scheduled = 1;
  let chars = 0;
  const frames = [{ node: ast, depth: 0, exit: false }];
  while (frames.length) {
    const { node, depth, exit } = frames.pop();
    if (!node || typeof node !== 'object') continue;
    if (depth > MAX_DEPTH + 1 || seen.has(node)) fail();
    seen.add(node);
    if (node.value != null && typeof node.value !== 'string') throw new TypeError('Expected string AST value');
    if (typeof node.value === 'string') chars += node.value.length;
    if (chars > MAX_LENGTH) resource();
    let parent = node;
    let count = 0;
    while (parent && parent.parent) {
      if (++count > MAX_DEPTH + 1) fail();
      parent = parent.parent;
    }
    if (node.nodes != null && !Array.isArray(node.nodes)) throw new TypeError('Expected an AST nodes array');
    if (!Array.isArray(node.nodes)) continue;
    scheduled += node.nodes.length;
    if (scheduled > MAX_NODES) resource();
    for (let i = node.nodes.length - 1; i >= 0; i--) {
      frames.push({ node: node.nodes[i], depth: depth + 1, exit: false });
    }
  }
};

// Fixed output ceilings plus a cumulative allocation/work budget per expansion.
exports.budget = () => {
  let results = 0;
  let chars = 0;
  return (n, size) => {
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(size) ||
        n > MAX_RESULTS || size > MAX_CHARS) resource();
    results += n;
    chars += size;
    if (results > 100000 || chars > 1048576) resource();
  };
};

exports.collection = values => {
  let chars = 0;
  if (values.length > MAX_RESULTS) resource();
  for (const value of values) {
    chars += typeof value === 'string' ? value.length : String(value).length;
    if (chars > MAX_CHARS) resource();
  }
  return chars;
};

exports.join = (left, right) => {
  if (left.length + right.length > MAX_CHARS) resource();
  return left + right;
};

// Check before fill-range, including descending and character ranges.
exports.range = (args, options = {}) => {
  if (args.length < 2) return;
  const [start, end] = args;
  const numeric = Number.isInteger(+start) && Number.isInteger(+end);
  let a, b;
  if (numeric) {
    a = +start; b = +end;
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) resource();
  } else {
    if ((!Number.isInteger(+start) && String(start).length > 1) ||
        (!Number.isInteger(+end) && String(end).length > 1)) return;
    a = String(start).charCodeAt(0); b = String(end).charCodeAt(0);
  }
  let rawStep = args[2] || options.step || 1;
  if (typeof rawStep === 'function' || typeof rawStep === 'object') rawStep = 1;
  if (!Number.isInteger(+rawStep)) return;
  const step = Math.max(Math.abs(+rawStep), 1);
  const count = Math.floor(Math.abs(b - a) / step) + 1;
  const width = numeric ? Math.max(String(start).length, String(end).length, String(rawStep).length, 17) : 1;
  if (count > MAX_RESULTS || count * (width + 8) > MAX_CHARS) resource();
};

// Summarize nested internal queues without flattening or multiplying them.
exports.shape = input => {
  const work = [{value: input, depth: 0}];
  let count = 0, chars = 0, nodes = 0;
  while (work.length) {
    const {value, depth} = work.pop();
    if (++nodes > 100000 || depth > MAX_DEPTH + 2) resource();
    if (Array.isArray(value)) {
      if (value.length > MAX_RESULTS || work.length + value.length > 100000) resource();
      for (let i = value.length - 1; i >= 0; i--) work.push({value:value[i], depth:depth+1});
    } else {
      count++;
      chars += value === undefined ? 0 : String(value).length;
      if (count > MAX_RESULTS || chars > MAX_CHARS) resource();
    }
  }
  return {count, chars};
};
