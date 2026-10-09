// Two independent 32-bit hashes; generation rejects collisions in the corpus.
export function phraseKey(text) {
  let first = 2166136261, second = 5381;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    first = Math.imul(first ^ c, 16777619);
    second = Math.imul(second, 33) ^ c;
  }
  return `${(first >>> 0).toString(36)}-${(second >>> 0).toString(36)}-${text.length}`;
}
