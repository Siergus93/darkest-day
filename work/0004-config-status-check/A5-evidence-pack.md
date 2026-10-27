# A5 — Evidence pack for slice 0004 (config-status check)

> Built 2026-10-27 by the implementing agent. **Fresh-context verification pending** —
> per 05-agents, the builder is not the sole verifier at T2; the AC table below records
> build-time evidence and must be countersigned by a fresh verifier before merge. Tier: T2.
> PR: https://github.com/Siergus93/darkest-day/pull/5

## AC result table

| AC | Result | Evidence |
| --- | --- | --- |
| AC-1 wired set ↔ table set equality | **PASS (build)** | `npm test` 55/55, incl. 6 new assertions below |
| AC-2 flip G6a → wired fails naming G6a | **PASS (build)** | Smoke 1 below |
| AC-3 rename `scripts/ci/sast.mjs` fails naming G4b + path | **PASS (build)** | Smoke 2 below |
| AC-4 remove `SAST` row from fast.mjs fails naming G4b + label | **PASS (build)** | Smoke 3 below |
| AC-5 version drift / pointer-without-A4 each fail | **PASS (build)** | Smoke 4a/4b below |
| AC-6 clean tree `npm test` green, added check < 1 s | **PASS (build)** | 6 new tests run in ~0.13 s (config.test.mjs duration 128.961 ms total) |
| AC-7 `npm run fast -- --base b92ad65` green | **PASS (build)** | Lane run below |
| AC-8 `.gitattributes`; renormalize no-op; fresh checkout is LF | **PASS (build)** | Smoke 5 below |
| AC-9 CI on PR exits 0 | **PENDING** | Run URL to be added after push |

## Incident that became AC-8

The drafting agent's first lane run (release cut only, working tree) failed `FORMAT`/`G4c`:
this Windows machine has `core.autocrlf=true` and the repo had no `.gitattributes`, so
every file the PR #4 merge checkout re-materialized landed as CRLF on disk while Biome
requires LF. Git was content-satisfied (autocrlf round-trips), so only the gate saw it.
Owner decision 2026-10-27: fix inside the slice → A2 v2 / A4 v2 add `.gitattributes`
(`* text=auto eol=lf`). The working tree was normalized (24 files, content-identical) to
unblock; the attributes file makes it durable.

## Smoke 1 — AC-2 (undeclared wired gate)

`G6a` status flipped `n/a` → `wired` in `factory.config.json`:

```
✖ gates declared wired are exactly the gates with declared wiring evidence
  AssertionError [ERR_ASSERTION]: Gates declared "wired" without wiring evidence in this table: G6a
    actual: [ 'G6a' ],  expected: []
EXIT=1

after restore:  ℹ pass 8  ℹ fail 0   EXIT=0
```

## Smoke 2 — AC-3 (missing wrapper)

`scripts/ci/sast.mjs` renamed to `sast.mjs.bak`:

```
✖ every wrapper a wired gate declares exists on disk
  AssertionError [ERR_ASSERTION]: Wired gates with missing wrappers: G4b: scripts/ci/sast.mjs
    actual: [ 'G4b: scripts/ci/sast.mjs' ],  expected: []
EXIT=1

after restore:  ℹ pass 8  ℹ fail 0   EXIT=0   (git diff empty — file byte-identical)
```

## Smoke 3 — AC-4 (missing lane row)

Every `record("SAST"` in `scripts/ci/fast.mjs` temporarily replaced with `record("XAST"`:

```
✖ every lane row a wired gate declares appears in the fast lane
  AssertionError [ERR_ASSERTION]: Wired gates with missing lane rows: G4b: lane row "SAST"
    actual: [ 'G4b: lane row "SAST"' ],  expected: []
EXIT=1

after restore:  ℹ pass 8  ℹ fail 0   EXIT=0   (git diff empty)
```

## Smoke 4 — AC-5 (version drift; pointer without A4)

```
4a: factoryVersion 0.3.0 → 0.2.0
✖ factoryVersion matches the newest released CHANGELOG section
  AssertionError [ERR_ASSERTION]: factory.config.json factoryVersion (0.2.0) must match
  the newest released CHANGELOG section (0.3.0)
EXIT_A=1

4b: activeSlice → work/0999-nonexistent
✖ activeSlice names an existing slice directory with an A4 plan
  AssertionError [ERR_ASSERTION]: activeSlice (work/0999-nonexistent) must point at a
  slice directory containing A4-slice-plan.md
EXIT_B=1

after restore:  ℹ pass 8  ℹ fail 0   EXIT_RESTORE=0   (git diff empty)
```

## Smoke 5 — AC-8 (line endings, the durable fix)

```
> git add .gitattributes; git add --renormalize .
   staged: only the new .gitattributes — renormalize is a no-op (index was already LF)

> Remove-Item scripts/ci/sast.mjs; git checkout -- scripts/ci/sast.mjs
   contains CR: False
> Remove-Item biome.json;        git checkout -- biome.json
   biome.json contains CR: False      (the exact file that failed before the fix)
> node scripts/ci/format.mjs
   format.check: every file matches the Biome formatting rules.   EXIT_FORMAT=0
```

Fresh checkout is LF on a `core.autocrlf=true` machine — the incident class is closed at
the root, not per-file.

## Full lane — AC-7

```
> npm run fast -- --base b92ad65
Gate summary
  CONFIG  PASS      factory.config.json is valid
  G4a     PASS      clean build (tsc emit)
  FORMAT  PASS      every file matches the Biome formatting rules
  LINT    PASS      no lint rule violations
  SAST    PASS      security rule pack: 0 violation(s), 0 warning(s)
  G4b     PASS      type.check passed; format, lint, and SAST clean
  G4c     PASS      55 passed, 0 failed, 8703.9217ms
  LINKS   PASS      all inline and reference Markdown links resolve
  G4d     PASS      no credential patterns found in the working tree
  HISTORY PASS      no credential patterns in any recorded commit
  G4e     PASS      inventory readable; npm audit reported no high or critical advisories
  G4f     PASS      Slice work/0004-config-status-check: declared T2, required T2, 9 changed path(s).

Fast lane PASSED in 15.1s (budget 10m).
Exit code: 0
```

## The check itself (what now fails when drift happens)

`test/config.test.mjs` gains a `WIRED_GATE_EVIDENCE` table (gate id → required wrapper
files + lane-row labels) and six assertions:

1. status vocabulary is `manual | wired | partial | n/a`;
2. `status: "wired"` gate ids exactly equal the table keys (both directions);
3. every declared wrapper file exists;
4. every declared lane row label appears in `scripts/ci/fast.mjs` (`record("<row>"`);
5. `factoryVersion` equals the newest released `## [x.y.z]` CHANGELOG section;
6. `activeSlice` names an existing directory containing `A4-slice-plan.md`.

## Residual risk / follow-ups

- CI (AC-9) not yet observed — the run URL must be added by the verifier.
- The table is hand-maintained by design (A2 v2); a wrapper rename still requires a
  one-line edit, but now an unedited table fails closed.
- `git status` on Windows shows `warning: ... CRLF will be replaced by LF` for files git
  has not re-statted since the attributes file landed; cosmetic, disappears on next touch.
- FU-2 (SAST literal-argument coverage decision) remains the next slice.
