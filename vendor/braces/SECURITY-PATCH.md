# Local braces 3.0.3 mitigation (2026-10-22)

This is a local mitigation, NOT an official patched release. Upstream MIT license,
version, authors, API and package scripts are retained. Original package metadata
is saved in UPSTREAM-PACKAGE.json; devDependencies are omitted from the active
vendor manifest to avoid npm local links installing upstream Mocha/Gulp tooling. npm audit may continue to
flag 3.0.3. Registry latest is 3.0.3; the advisory lists no patched version.
Sources: https://github.com/micromatch/braces/tree/3.0.3
https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

Fixed limits (not configurable through options):
- Pattern: 10,000 UTF-16 code units; lexical preflight before AST creation.
- Brace/paren nesting: 64, respecting escapes, quotes, bracket literals.
- AST: 65,536 scheduled nodes, 10,000 total value code units, depth 65 including
  leaf nodes. Child cycles and shared child nodes (DAGs) are rejected. Parent
  chains are bounded to 65; parser parent/prev backlinks are supported.
  Caller-built AST values must be strings and nodes must be arrays as produced
  by parse. Top-level pattern arrays may contain strings/ASTs, not nested arrays.
- Expansion/intermediate product: 10,000 results and 262,144 total output
  UTF-16 code units per append; all input queues are summarized before concat,
  array multiplication and string creation, including nested queues.
- Expansion cumulative allocation budget: 100,000 result slots / 1,048,576 code
  units per call, counting intermediate append results and fill-range results.
- Each fill-range call: at most 10,000 theoretical results and a conservative
  262,144 code-unit bound including padding/regex overhead, checked BEFORE
  fill for compile and expand. Numeric endpoints must be safe integers to
  prevent increments that cannot make progress. Both directions, absolute
  steps, zero/default step and single-code-unit character ranges are checked.
- compile/stringify joins and top-level pattern arrays: 262,144 output code
  units; top-level arrays at most 10,000 patterns / results.

Depth/cycle/shared child violations throw intentional SyntaxError; resource
ceilings throw RangeError with 'fixed safety budget' in its message. Existing
maxLength/rangeLimit may lower but cannot raise these ceilings, including NaN,
Infinity, false, negative steps, and options.step. Ordinary ranges, escaping,
quotes, invalid literals and glob consumers retain upstream behavior below
budgets. Compact regex compilation of a larger range is conservatively rejected
as well. Deep but finite expansions may hit cumulative budgets before a final
output ceiling. Executable callbacks, getters and proxies supplied by the caller
are trusted code: these limits do not sandbox their own allocation/execution.

Root dependency file:./vendor/braces plus override '$braces' is required: bare
relative file overrides resolve incorrectly from some transitive dependencies.
Use npm ci --ignore-scripts; do not add postinstall. Keep the complete vendor
source and LICENSE in version control. The regression scripts compare with the
integrity-checked official tarball and run adversarial tests in small-heap child
processes. Remove only after reviewing an official fix and rerunning these tests.
