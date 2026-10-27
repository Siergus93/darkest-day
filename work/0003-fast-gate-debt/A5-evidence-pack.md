# A5 — Evidence pack for slice 0003 (fast-gate debt)

> Verified 2026-10-27, **fresh-context verifier** (this verification was performed by an
> agent context that did not author the diff). Tier: T2. PR under review:
> https://github.com/Siergus93/darkest-day/pull/4

## AC result table

| AC | Result | Evidence |
| --- | --- | --- |
| AC-1 format break-and-restore | **PASS** | Smoke 1 below |
| AC-2 lint break-and-restore | **PASS** | Smoke 2 below |
| AC-3 SAST break-and-restore | **PASS** | Smoke 3 below (see note on fixture shape) |
| AC-4 added lane wall-clock ≤ 30 s | **PASS** | Timing table below (~3.6 s sum) |
| AC-5 audit fixture fails, real lockfile passes | **PASS** | AC-5 observation below |
| AC-6 history-scan probe + clean-history pass | **PASS** | Smoke 4 below |
| AC-7 config statuses match observations | **PASS (with note)** | AC-7 note below |
| AC-8 adapter matches wired set | **PASS** | AC-8 check below |
| AC-9 `npm run fast -- --base main` green | **PASS** | Lane run below (run against `origin/main`, see note) |
| AC-10 CI run on PR exits 0 | **PASS** | https://github.com/Siergus93/darkest-day/actions/runs/40411763604/job/121883970749 — "fast lane" SUCCESS, 2026-10-26 |

## Smoke 1 — AC-1 (format)

Injected `scripts/_smoke-unformatted.mjs` (2 lines, no trailing style):

```
> node scripts/ci/format.mjs
format.check FAILED: files do not match the Biome formatting rules.
scripts\_smoke-unformatted.mjs format ━━… (Formatter would have printed the following content:
    1   │ - const·x·=·1
    2   │ - console.log(·"unformatted"·) )
Checked 29 files in 19ms. No fixes applied.
Found 1 error.
EXIT=1

after restore:
> node scripts/ci/format.mjs
format.check: every file matches the Biome formatting rules.
EXIT_AFTER_RESTORE=0
```

## Smoke 2 — AC-2 (lint)

Injected `scripts/_smoke-lint.mjs` containing `if (a == 2)`:

```
> node scripts/ci/lint.mjs
lint.check FAILED: lint rule violations found.
scripts\_smoke-lint.mjs:2:7 lint/suspicious/noDoubleEquals  FIXABLE
  × Using == may be unsafe if you are relying on type coercion.
Checked 30 files in 20ms. No fixes applied.
EXIT_LINT=1

after restore:
lint.check: no lint rule violations.
EXIT_LINT_RESTORE=0
```

## Smoke 3 — AC-3 (SAST)

First probe with `exec("node --version")` (a **literal** argument) returned exit 0:

```
sast: no security rule violations (0 warning(s)).      EXIT_SAST=0
```

This is the rule's intended shape, not a miss: `detect-child-process` fires on **non-literal**
first arguments. Re-injected with a template-literal command (the A2 AC-3 shape,
`child_process.exec` on a template literal):

```
fixture:        exec(`ls ${cmd}`);
> node scripts/ci/sast.mjs
sast FAILED: 1 security rule violation(s).
  scripts/_smoke-sast.mjs:3:1 [error] security/detect-child-process: Found child_process.exec() with non Literal first argument
EXIT_SAST=1

after restore:
sast: no security rule violations (0 warning(s)).
EXIT_SAST_RESTORE=0
```

## Timing — AC-4

Individual isolated runs on the clean tree (Windows, Node 24):

| Added gate | Wall-clock |
| --- | --- |
| format (Biome) | 0.16 s |
| lint (Biome) | 0.16 s |
| SAST (ESLint) | 1.34 s |
| audit (npm) | 1.75 s |
| history scan (`git log -p --all`) | 0.19 s |
| **Sum of additions** | **≈ 3.6 s ≤ 30 s target** |

## AC-5 — audit fixture

Scratch directory with a `package-lock.json` pinning `lodash@4.17.20`:

```
> npm audit --audit-level=high --json
EXIT_AUDIT=1
advisories: lodash
name: lodash  severity: high
```

Real lockfile exit 0 observed in the lane's `G4e PASS` row ("npm audit reported no high or
critical advisories"). Scratch dir removed after recording.

## Smoke 4 — AC-6 (history)

Scratch repository, fake AWS key committed (fixture, not a real credential):

```
finding (redacted — the value is never printed):
  aws-access-key in fake-key.txt (commit 192b296b43a8, added-line 1): AWS access key id
```

The scan reads `git log -p --all`, so the finding persists even after the key is removed
from HEAD (the report below ran after the removal commit `c88e668`):

```
> scanHistory(scratch root)
EXIT_CONDITION: 1 finding(s)
```

Clean history exit 0: lane `HISTORY PASS` row + `test/gates.test.mjs`
("a clean history produces no findings"). Scratch repo removed after recording.

## AC-7 — config statuses vs observations (note)

`factory.config.json` declares G4b, G4d, G4e as `status: "wired"` / `smokeTested: true`, and
each gate note describes exactly the behavior I re-observed independently here (see Smokes
1–4, AC-5). The A4 table named "`test/config.test.mjs` update" as the intended automated
check; the shipped test change is import-reorder only and does **not** assert gate statuses.
Verdict: the statuses are factually correct (match observations), but the automation
promised in A4 was not built — recorded as residual follow-up, not a blocker.

## AC-8 — adapter check

`adapters/stack/node-typescript.md` documents Biome format+lint, ESLint+SDL SAST, and the
blocking `deps.vuln`; grep for the stale sentence shows no "format/lint/SAST are exceptions"
clause. `docs/waivers.md` records the four 0002 waivers as retired by wiring, with no active
waivers.

## AC-9 — full lane

```
> npm run fast -- --base origin/main
Gate summary
  CONFIG  PASS      factory.config.json is valid
  G4a     PASS      clean build (tsc emit)
  FORMAT  PASS      every file matches the Biome formatting rules
  LINT    PASS      no lint rule violations
  SAST    PASS      security rule pack: 0 violation(s), 0 warning(s)
  G4b     PASS      type.check passed; format, lint, and SAST clean
  G4c     PASS      49 passed, 0 failed, 10217.3554ms
  LINKS   PASS      all inline and reference Markdown links resolve
  G4d     PASS      no credential patterns found in the working tree
  HISTORY PASS      no credential patterns in any recorded commit
  G4e     PASS      inventory readable; npm audit reported no high or critical advisories
  G4f     PASS      Slice work/0003-fast-gate-debt: declared T2, required T2, 38 changed path(s).

Fast lane PASSED in 16.6s (budget 10m).

Exit code: 0
```

First run against local `main` failed G4f because local `main` was stale (pre-0002 merge);
re-run against `origin/main` is the faithful change set. Base runs should use an up-to-date
ref.

## AC-10 — CI

PR #4 check "fast lane": conclusion **SUCCESS**
https://github.com/Siergus93/darkest-day/actions/runs/40411763604/job/121883970749

## Residual risk / follow-ups

Both verification findings are registered as FU-1 and FU-2 in
[A4 v4 — Follow-ups registered at verification](A4-slice-plan.md), and reproduced above:

- FU-1: the automated AC-7 config-status check is not built (see AC-7 note).
- FU-2: literal-argument child-process execution is outside SAST coverage (see smoke 3);
  recorded as an amendment rider on [ADR-0004](../../docs/decisions/ADR-0004-sast-and-history-implementation.md).
- Gate summary rows for format, lint, SAST, audit, and history are only ever PASS/FAIL
  (no PARTIAL) — verified by inspection of `scripts/ci/fast.mjs` AND its green/failed runs.
- AGENTS.md "Current state" still names slice 0002 as active; `factory.config.json` is
  authoritative. Docs cleanup candidate.
- Blast radius matched: all PR #4 files fall inside A4 v3's declared globs (38 vs 44 paths:
  the delta is 0002 work-dir files visible to a stale base, not real additions).
