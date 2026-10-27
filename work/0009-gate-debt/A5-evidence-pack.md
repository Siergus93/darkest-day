# Evidence pack (A5)

> Station S4 · Gate G5a · Every AC maps to reproducible evidence.

| Field | Value |
| --- | --- |
| Slice | [0009 — Close the verifier-flagged gate debt: FU-4 + FU-8](A4-slice-plan.md) |
| Spec | [A2](A2-spec.md) v1 |
| Verified by | drafting agent (self-verification) |
| Date | 2026-10-27 |

## AC-to-evidence map

| AC | Result | Evidence |
| --- | --- | --- |
| AC-1 declared links exist + imported; synthetic negative | PASS | `test/config.test.mjs`: "every lib module a wired gate declares exists and is imported by its wrapper" ✔ (real tree: all gates + the 9-module lane pin) and "the lib-link check fails when a wrapper stops importing a declared lib" ✔ (synthetic fixture proves the REWIRED-wrapper gap is named — the exact FU-4 ask) |
| AC-2 rename smoke | PASS | recorded below (break-and-restore, verbatim) |
| AC-3 three FU-8 shapes rejected by the real pack | PASS | fixture matrix (17 → 23): constant-folded computed key `cp["ex" + "ec"]`, template-literal specifier via `await import` and `require`, multi-hop require alias chain — all lint to `factory/literal-command-exec` through the REAL `eslint.config.mjs` |
| AC-4 sanctioned patterns stay clean | PASS | negatives in the matrix: `cp[key]` with a runtime key → `[]` (accepted edge, documented in the rule); spawn-through-require-alias-chain → `[]`; all 6 pre-existing sanctioned fixtures unchanged |
| AC-5 lane green; release files untouched | PASS | lane run below; `.github/workflows/release.yml`, `dist/**`, `src/**` untouched by this diff; no new dependency (lockfile diff: none) |

## Rename smoke (AC-2, verbatim)

```
$ Rename-Item scripts/ci/lib/sast.mjs sast.mjs.bak
$ npm test
✖ every lib module a wired gate declares exists and is imported by its wrapper
  AssertionError: Wired gates with drifted wrapper/lib links:
    G4b: scripts/ci/sast.mjs declares missing lib "lib/sast.mjs",
    lane: scripts/ci/fast.mjs declares missing lib "lib/sast.mjs"
$ Rename-Item scripts/ci/lib/sast.mjs.bak sast.mjs   (restore)
$ npm test → 70 passed, 0 failed
```

The failure NAMES the gate and module — the config test, not an accidental lane crash.
(This is the FU-4 gap closed: before, a rename was caught only when the lane's import
crashed, and a rewired wrapper was invisible.)

## Probe record

One resolver defect found and fixed during implementation (probe-first again): the
alias chase pre-seeded the seen-set with the callee's own name, blocking the first
hop of every chain (`seen.has("r") → false`). Fixed by giving `chainReachesRequire`
a fresh cycle-guard set per chase; the fixture caught it before any commit.

## Fast lane

```
$ npm run fast -- --base e4b1998
Fast lane PASSED (12/12 gate rows, 70/70 tests)
```

## Fresh-context verification: pending — verifier runs before merge

Verifier checklist: (1) the three new caught shapes are real escape shapes for the
pre-0009 resolver, not fixtures of the new rule only; (2) the two negatives are
genuinely sanctioned/accepted (no over-flagging of spawn usage); (3) the
`wrapperLibs`/`laneImports` data matches the actual import statements in the wrappers
and the lane.
