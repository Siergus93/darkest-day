# Spec (A2)

> Station S1 · Gate G1 · Each acceptance criterion is observable and has a tier of test.
> Version 1 · Owner Siergus · 2026-10-27

## Problem being solved

Two verifier-registered gaps let wired-gate evidence drift from what actually executes:
the evidence table does not name the `scripts/ci/lib/*.mjs` modules (FU-4), and the
SAST resolver misses three static obfuscation shapes (FU-8).

## Design

**FU-4 — declared wrapper→lib links (data-only + one test):**

- `WIRED_GATE_EVIDENCE` entries gain `wrapperLibs`: `{ "<wrapper path>": ["lib/<name>.mjs", …] }`
  derived from the wrappers' actual import statements at drafting time:
  - `format.mjs` → `lib/format-lint.mjs`; `lint.mjs` → `lib/format-lint.mjs`
  - `sast.mjs` → `lib/config.mjs`, `lib/sast.mjs`
  - `secrets.mjs` → `lib/config.mjs`, `lib/secrets.mjs`; `secrets-history.mjs` → `lib/secrets-history.mjs`
  - `blast-radius.mjs` → `lib/blast-radius.mjs`, `lib/config.mjs`
- The table gains a `laneImports` key pinning the lane itself: `scripts/ci/fast.mjs` →
  the nine lib modules it imports.
- New tests: (a) every declared lib file exists on disk; (b) every declared lib is
  imported by its wrapper (wrapper source contains the `lib/<name>.mjs` specifier);
  (c) a synthetic fixture proves the check fails when a wrapper stops importing a
  declared lib (the FU-4 gap: rewiring, not just renaming).

**FU-8 — resolver hardening (rule + fixtures):**

1. Constant-folded computed member keys: `memberReportsExecFamily` folds
   `BinaryExpression` over string Literals (`+`, nested, cycle-free). `cp["ex" + "ec"]`
   is caught; `cp[key]` with a non-literal `key` remains an accepted edge (documented).
2. Template-literal module specifiers: `staticModuleSource` accepts
   zero-expression TemplateLiterals (`` `node:child_process` ``) and literal-only
   concatenations; anything interpolated from a non-literal stays unresolvable by
   this rule (second opinion's territory for require; accepted edge for dynamic import).
3. Multi-hop rebinding: `resolveChildProcessExecBinding` follows identifier→identifier
   alias chains (bounded at 5 hops, seen-set cycle guard) until a require/import init
   resolves or the chain exhausts. `const r = require; const cp = r("child_process")`
   resolves; deep/unresolvable chains degrade to the accepted-edge class.
4. New fixtures in the real-pack matrix: the three caught shapes, plus negatives —
   runtime-computed keys stay clean (accepted edge, doc-commented) and
   spawn-through-alias stays clean (sanctioned). The doc comment records the widened
   resolution; the ADR decision is untouched (detection widens an unconditional ban).

## Acceptance criteria

| AC | Statement | Tier of test |
| --- | --- | --- |
| AC-1 | Every declared `wrapperLibs`/`laneImports` file exists and is imported by its wrapper; the synthetic fixture proves a rewired wrapper fails the check | isolated |
| AC-2 | Break-and-restore: renaming `lib/sast.mjs` makes the config test fail naming gate + module (not a crash); restore → green | isolated + smoke |
| AC-3 | The three FU-8 shapes are rejected by the real `eslint.config.mjs` pack | isolated |
| AC-4 | Sanctioned patterns stay clean: spawn/spawnSync with argument arrays, including through aliases and require indirection, produce no factory-rule findings | isolated |
| AC-5 | Fast lane green; release lane, product code, and ADR-0004 untouched; no new dependency | command |

## Non-criteria

- Runtime-computed member keys (accepted edge, documented in the rule).
- Coverage for non-JavaScript files, or new rule packs.
- ADR-0004 amendment — not needed: the decision (unconditional ban) does not move.

## Open questions

None blocking.
