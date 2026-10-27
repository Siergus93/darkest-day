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
| AC-9 CI on PR exits 0 | **PASS** | "fast lane" SUCCESS, 19s — https://github.com/Siergus93/darkest-day/actions/runs/40474204217/job/122088291497 (2026-10-27) |

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

## Fresh-context verification (2026-10-27)

> Adversarial verifier, fresh context, not the diff's author. Every probe below used a
> different victim than the build-time smokes (A5 build used: G6a flip, `sast.mjs` rename,
> SAST row removal, `factoryVersion` 0.2.0, `work/0999-nonexistent` pointer). Machine:
> Windows, `core.autocrlf=true`, Node 24. All commands run in the repo root on branch
> `work/0004-config-status-check` from a clean tree (`git status --short` empty at start).

### AC verdict table

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC-1 wired set ↔ table set equality | **PASS** | Both directions probed with new victims: `G5b` `n/a`→`wired` fails naming G5b (probe 1); `G4e` `wired`→`manual` fails naming G4e as a stale table entry (probe 2) |
| AC-2 flip a gate to `wired` fails naming the gate | **PASS** | Probe 1 (G5b, not G6a): exit 1, "Gates declared \"wired\" without wiring evidence in this table: G5b"; restore green 8/8 |
| AC-3 rename a declared wrapper fails naming gate + path | **PASS** | Probe 3 (`scripts/ci/secrets-history.mjs`→`.bak`, not `sast.mjs`): exit 1, "Wired gates with missing wrappers: G4d: scripts/ci/secrets-history.mjs"; restore green, `git status` clean |
| AC-4 remove a lane row fails naming gate + label | **PASS** | Probe 4 (`record("HISTORY"`→`record("XISTORY"` in `fast.mjs`, not the SAST row): exit 1, "Wired gates with missing lane rows: G4d: lane row \"HISTORY\""; `git checkout -- scripts/ci/fast.mjs` restores green |
| AC-5 drift / pointer failures | **PASS, with a design hole** | Probe 5: status `"Wired"` (capital W) fails twice — vocabulary test + stale-table test — naming G4e, exit 1. Probe 6: `activeSlice` → `work/0002-vcs-faithful-diff` (a real dir with an A4) **passes** — see finding FU-3 |
| AC-6 clean tree green, check < 1 s | **PASS** | `npm test` → 55/55, exit 0; the 6 new tests each ran in ~0.5–3 ms in `node --test test/config.test.mjs` (suite of 8 well under 1 s) |
| AC-7 `npm run fast -- --base b92ad65` green | **PASS** | Reproduced independently: all 13 gate rows PASS (CONFIG, G4a, FORMAT, LINT, SAST, G4b, G4c 55/55, LINKS, G4d, HISTORY, G4e, G4f "declared T2, required T2, 10 changed path(s)"), "Fast lane PASSED in 15.2s", exit 0 |
| AC-8 `.gitattributes`, renormalize no-op, fresh checkout LF | **PASS** | `.gitattributes` contains `* text=auto eol=lf`; `git add --renormalize .` staged nothing (no-op); `Remove-Item test/config.test.mjs; git checkout -- test/config.test.mjs` → byte scan: `contains CR (0x0D): False`, on `core.autocrlf=true` |
| AC-9 CI on the PR exits 0 | **PASS** | `gh pr checks 5` → `fast lane  pass  15s` (run 40474300726/job 122088606841), exit 0 |

### Probe log (verbatim commands and exit codes)

```
npm test                                                        EXIT=0  (55/55)
npm run fast -- --base b92ad65                                  EXIT=0  (all gates PASS)

P1  edit factory.config.json: G5b "n/a" -> "wired"
    node --test test/config.test.mjs                            EXIT=1
      Gates declared "wired" without wiring evidence in this table: G5b
    git checkout -- factory.config.json; re-test                EXIT=0  (8/8)

P2  edit factory.config.json: G4e "wired" -> "manual"
    node --test test/config.test.mjs                            EXIT=1
      Wiring evidence for gates that are not declared "wired" (stale table entries): G4e
    git checkout -- factory.config.json; re-test                EXIT=0  (8/8)

P3  Rename-Item scripts/ci/secrets-history.mjs secrets-history.mjs.bak
    node --test test/config.test.mjs                            EXIT=1
      Wired gates with missing wrappers: G4d: scripts/ci/secrets-history.mjs
    rename back; re-test; git status scripts/ci/                EXIT=0  (8/8, clean)

P4  replace record("HISTORY" -> record("XISTORY" in scripts/ci/fast.mjs
    node --test test/config.test.mjs                            EXIT=1
      Wired gates with missing lane rows: G4d: lane row "HISTORY"
    git checkout -- scripts/ci/fast.mjs; re-test                EXIT=0  (8/8)

P5  edit factory.config.json: G4e status -> "Wired" (capital W)
    node --test test/config.test.mjs                            EXIT=1 (2 failures)
      Unknown gate status values (known: manual, wired, partial, n/a): G4e: "Wired"
      Wiring evidence for gates that are not declared "wired" (stale table entries): G4e
    git checkout -- factory.config.json; re-test                EXIT=0  (8/8)

P6  edit factory.config.json: activeSlice -> work/0002-vcs-faithful-diff (real dir + A4)
    node --test test/config.test.mjs                            EXIT=0  (passes — hole, FU-3)
    git checkout -- factory.config.json

C1  Rename-Item scripts/ci/lib/format-lint.mjs format-lint.mjs.bak
    npm run fast -- --base b92ad65                              EXIT=1
      Error [ERR_MODULE_NOT_FOUND]: Cannot find module ...lib\format-lint.mjs
      imported from ...scripts\ci\fast.mjs   (lane fails closed, no silent pass)
    rename back
    (also: test/gates.test.mjs imports ../scripts/ci/lib/format-lint.mjs directly,
     so npm test would crash loudly in the same state — the lib is behaviorally pinned)

C2  add fake gate { "id": "G9z", "tier": "T1", "status": "wired" } to factory.config.json
    node --test test/config.test.mjs                            EXIT=1
      Gates declared "wired" without wiring evidence in this table: G9z
    node -e "loadConfig(repoRoot)"                              accepted G9z: true
      (loader has no enum check, as claimed — enforcement is test-side; fine, but see FU-4)
    git checkout -- factory.config.json

C3  git add --renormalize .                                     EXIT=0, nothing staged (no-op)
    Remove-Item test/config.test.mjs; git checkout -- test/config.test.mjs
    byte scan                                                    contains CR (0x0D): False
    git config core.autocrlf                                    true

C4  gh pr diff 5 --name-only                                    EXIT=0
    .gitattributes, AGENTS.md, CHANGELOG.md, factory.config.json, test/config.test.mjs,
    work/0004-config-status-check/{A1,A2,A4,A5}.md, work/README.md
    → all inside the A4 v2 declared radius (test/**, work/0004-config-status-check/**,
    .gitattributes, factory.config.json, AGENTS.md, CHANGELOG.md, work/README.md).
    No out-of-radius file. No scripts/ci/**, .github/**, adapters/** source changes.

C5  gh pr checks 5                                              EXIT=0  (fast lane pass, 15s)
```

### Findings

None that fail an AC. Three follow-ups registered:

- **FU-3 (accepted residual)** — `activeSlice` pointing at a *wrong-but-existing* slice
  (probe 6) passes the assertion: the test checks structure (dir + A4 exist), and no
  machine can know which slice is "current" without another source of truth. Partially
  mitigated in practice: the G4f lane summary names the slice every run ("Slice
  work/0004-config-status-check: declared T2, required T2"), so the mismatch is visible
  at lane time. This is within A2's declared scope (the AC promises
  "a directory without an A4 fails"), so PASS with the hole recorded. Candidate hardening:
  cross-check `activeSlice` against the CHANGELOG's current-slice mention or the newest
  `work/` row in `work/README.md`.
- **FU-4 (thin pin, fails closed today)** — "wrapper exists + row present" does not prove
  the lane executes that wrapper: the lane imports `scripts/ci/lib/*.mjs`, never the
  wrapper entry scripts. Evidence the ecosystem still fails closed: renaming
  `scripts/ci/lib/format-lint.mjs` crashes the lane at import (exit 1, probe C1), and
  `test/gates.test.mjs` behaviorally imports the same lib, so `npm test` fails too. A
  future edit that points a table entry at a wrapper nothing imports would still pass
  both checks. Candidate hardening: pin the lib modules the lane actually imports (or
  assert each wrapper is reachable from `fast.mjs`'s import graph). Also noted: the
  status enum lives only in the test; `loadConfig` accepts `"Wired"`/`"G9z"`-style
  entries (probe C2) — acceptable since the test is the declared enforcement point.
- **FU-5 (version coherence gap, outside radius)** — `package.json` still says
  `0.2.0` while `factoryVersion`/`CHANGELOG.md` say `0.3.0` (visible in every npm banner
  above: `darkest-day-factory@0.2.0`). The release-cut AC promised only
  `factoryVersion` ↔ CHANGELOG, and `package.json` is outside the declared blast radius,
  so this is not an AC failure — but the repo now has two version authorities that can
  drift. Decision needed: sync `package.json` in the release cut or record it as
  intentionally independent (and optionally pin it in `test/config.test.mjs`).

### Verdict

All nine ACs reproduced green with fresh victims; every adversarial probe failed closed
exactly as the spec promised; the PR diff is inside the declared blast radius; CI passes.
The residual holes (FU-3/4/5) are scope gaps the A2/A4 did not promise to close.

VERDICT: PASS — every AC reproduced and every adversarial probe failed closed as designed; residual holes are registered as follow-ups, not AC failures.
