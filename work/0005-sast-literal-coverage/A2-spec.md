# Spec (A2)

> Station S1 · Gate G1 · Each acceptance criterion is observable and has a tier of test.
> Version 1 · Owner Siergus · 2026-10-27

## Problem being solved

An injected `child_process.exec("…")` with a **literal** first argument passes the SAST gate
today (verified in slice 0003, smoke 3). The gate row says PASS without qualification; the
coverage boundary lives only in an ADR rider. This slice decides and lands the fix.

## The decision (made at S1 after probing)

Preference order, deliberated against probe results:

1. **Widen with a stock rule.** Candidates to probe against both fixtures (literal
   `exec("node --version")` must now fail; the repo's arg-array `spawnSync("git", […])`
   usage must stay clean): `security/detect-child-process` variants, Microsoft SDL plugin
   rules mentioning command execution, `no-restricted-properties` on
   `child_process.exec`/`execFile`/`execSync`/`execFileSync`, `no-restricted-imports`
   for the `node:child_process` exec-family methods.
2. **Widen with a small local rule** (eslint-plugin-local-rules pattern) if no stock rule
   has the right signature.
3. **Record the boundary and pin it** only if widening cannot be done without an allowlist
   that weakens the gate for the repo's own spawn usage — the gate note, the SAST scope
   note (`scripts/ci/sast.mjs` output when it runs), and CHANGELOG must all state the
   decided coverage, so the PASS row is no longer unqualified.

Whichever option lands, the decision is recorded in an **ADR-0004 amendment or supersede**
(never by editing the ADR).

## Acceptance criteria

| AC | Statement | Tier of test |
| --- | --- | --- |
| AC-1 | The tree with the widened/decided setup, run clean, reports 0 violations and stays within the lane budget | isolated + command |
| AC-2 | Injected literal-arg `child_process.exec("node --version")` fails the SAST gate with a rule id and file:line; restore passes | isolated (break-and-restore) |
| AC-3 | Injected non-literal fixture (template-literal arg) still fails — the 0003 coverage is not regressed | isolated |
| AC-4 | The repo's own `spawnSync(…, [args])` usage in `lib/engines.mjs`, `lib/run.mjs`, `lib/secrets-history.mjs` remains clean (no false positive, no allowlist needed) | isolated |
| AC-5 | `scripts/ci/lib/sast.mjs` (or the config it drives) publishes the decided coverage in its output/scope note — a reader of a PASS row can see what "clean" meant | isolated + read |
| AC-6 | The decision is recorded in an ADR-0004 amendment/supersede; ADR-0004 itself untouched | read |
| AC-7 | Release cut v0.3.1: `package.json` version, `factoryVersion`, and the newest `## [x.y.z]` CHANGELOG section agree (FU-5 closes here); `activeSlice` points at this slice | isolated |
| AC-8 | `npm run fast -- --base 8e9da3a` green; CI on the PR exits 0 | command + manual |

## Non-criteria

- Secrets scan, history scan, audit, blast radius (untouched).
- FU-3/FU-4 hardening (see `docs/backlog.md`).
- Any runtime behavior — the factory repo ships no product code.

## Open questions

None blocking; option choice is resolved by the probes at S2, with the deliberation
recorded in the ADR amendment.
