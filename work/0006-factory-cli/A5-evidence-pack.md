# Evidence pack (A5)

> Station S4 · Gate G5a · Every AC maps to reproducible evidence. An agent summary
> is not evidence; a gate passes only on output a reviewer can reproduce.

| Field | Value |
| --- | --- |
| Slice | [0006 — First product: the factory CLI](A4-slice-plan.md) |
| Spec | [A2](A2-spec.md) v1 |
| Slice plan | [A4](A4-slice-plan.md) v2 (v2: declares `work/0007-release-lane/**` doc drafts) |
| Verified by | drafting agent (self-verification; fresh-context verification pending) |
| Date | 2026-10-27 |
| Commit | `343211d` slice(0006) on `work/0006-factory-cli` |

## AC-to-evidence map

| AC | Result | Evidence |
| --- | --- | --- |
| AC-1 status output + exit 0 | PASS | hand-run: `node dist/cli.js status` → exit 0, printed `factory 0.3.1` (pre-cut), `active slice: …`, all 28 gates as `<id>\t<tier>\t<status>`. Unit: `test/cli.test.mjs` "status prints version, active slice, and the gate catalog" ✔ (asserts version, slice, gate lines) |
| AC-2 check PASS on clean tree | PASS | Unit: "check on a clean in-radius change set passes with the declared tier" ✔ (exit 0, `factory check: PASS, T1`). Real-tree: `npm run fast -- --base db92084` → G4f PASS, and post-cut `node dist/cli.js check --base db92084` → `factory check: PASS, T2`, exit 0 |
| AC-3 protected-path change → exit 1 naming escalation | PASS (see note) | Unit: "check fails naming the escalation when a protected path changes" ✔ — break-and-restore fixture: T1 plan, protected change → exit 1, output names `escalated by protected/secret.txt … -> T2` and `factory check: FAIL`; restore → exit 0. **Note:** on the real tree the declared tier is T2, so a protected-path change names the escalation but correctly PASSES (`declared T2, required T2` — identical to the lane's G4f semantics, observed in the same lane run). The exit-1 path requires declared < required, which the fixture provides |
| AC-4 outside-radius change → exit 1 naming path | PASS | Real-tree smoke: `scratch-smoke.txt` (untracked, no declared glob) → `factory check: FAIL`, `outside declared radius: scratch-smoke.txt`, **exit 1**; delete → **exit 0**. Unit: "check fails naming the path when a change is outside the declared radius" ✔ |
| AC-5 change-set parity with the lane | PASS | Unit: "check change set matches the lane engine for the same base" ✔ — the CLI's printed change set is compared path-for-path and count-for-count against `gitChangedPaths(root, base)`, the same engine `scripts/ci/blast-radius.mjs` uses. Parity is by construction (shared engines) and by test |
| AC-6 --help + unknown-arg exit 1 | PASS | hand-run: `node dist/cli.js --bogus` → exit 1, stderr names `--bogus` and prints usage. Unit: "--help exits 0 for the top level and both commands" ✔ and "an unknown argument exits 1 naming the argument" ✔ (both `--bogus` and unknown command `deploy`) |
| AC-7 lane green, lockfile version-only | PASS | `npm run fast -- --base db92084` → **Fast lane PASSED in 26.8s** (all 12 gate rows PASS, 64/64 tests). `git diff --stat package-lock.json` → `4 ++--` (both `version` fields only) |
| AC-8 three-way version agreement + pointer | PASS | `test/config.test.mjs` "factoryVersion matches the newest released CHANGELOG section and package.json" ✔ and "activeSlice names an existing slice directory with an A4 plan" ✔ — 0.3.2 == 0.3.2 == [0.3.2], `activeSlice: work/0006-factory-cli` |
| AC-9 CI on PR exits 0 | PENDING | to be observed on the PR (Run URL to be appended before merge) |

## Working-tree smoke 1 (protected path, real tree, verbatim)

```
$ Add-Content factory.config.json "`n"; node dist/cli.js check --base db92084; echo "exit=$LASTEXITCODE"
  escalated by factory.config.json (matches factory.config.json -> T2)
factory check: PASS, T2
exit=0
```

Verdict semantics identical to the lane's G4f row on the same change set
(`escalated by factory.config.json … -> T2` + row PASS).

## Working-tree smoke 2 (outside radius, real tree, verbatim)

```
$ Set-Content scratch-smoke.txt "scratch"; node dist/cli.js check --base db92084; echo "exit=$LASTEXITCODE"
  outside declared radius: scratch-smoke.txt
factory check: FAIL
  outside declared radius: scratch-smoke.txt
exit=1
$ Remove-Item scratch-smoke.txt; node dist/cli.js check --base db92084
exit=0
```

## Unit-test break-and-restore (verbatim, `node --test test/cli.test.mjs`)

```
✔ check fails naming the escalation when a protected path changes (2142.9131ms)
✔ check fails naming the path when a change is outside the declared radius (2054.3278ms)
ℹ pass 8
ℹ fail 0
```

## Probe record (A4 step 1 / A1 assumption 1)

The bridge probe surfaced three mechanics, all resolved inside `src/**`:

1. Import specifiers are written relative to the **compiled** `dist/cli.js`
   (`../scripts/ci/lib/*.mjs`); `src/cli.ts` and `dist/cli.js` share the parent, so
   the same specifier resolves consistently.
2. TS7016 (no declaration for the `.mjs` engines) is only suppressed by
   `@ts-expect-error` when the import is a **single line** — and Biome's import
   organizer re-merges same-module single-line imports. Resolution: one namespace
   import per module (`import * as blastRadius`), which stays on one line.
3. No `@types/node` (no-new-dependency): `src/node-globals.d.ts` declares exactly
   `process` (argv/cwd/exit) and `console` (log/error) — the full surface cli.ts uses.

## Residual risks / notes for the fresh-context verifier

- AC-3's real-tree variant cannot FAIL while the slice declares T2 (see the AC map
  note). If the verifier reads AC-3 as "must exit 1 on the real tree", that is a spec
  wording fix (A2 v2), not a code defect — the lane-equivalent semantics are what the
  A2 design section describes.
- `factory status` exit 0 also when the config is invalid is NOT the behavior: a
  throwing `loadConfig` surfaces as an uncaught error → exit 1 with the message.
  A2 says status "exit 0 always (it is a read-only dump)" — read as "no verdict is
  computed"; a manifest load failure still fails loudly. Verifier to confirm this
  reading.
- AC-9 must be appended with the PR's CI run URL before merge.
