# Spec (A2)

> Station S1 · Gate G1 · Each acceptance criterion is observable and has a tier of test.
> Version 1 · Owner Siergus · 2026-10-27

## Problem being solved

The factory's verdicts exist but have no named product surface: checking a change set
means running CI plumbing and reading raw output. This slice turns the verdict into two
stable product commands.

## Design

Two commands, new TypeScript entry `src/cli.ts` (compiled by the existing tsc build to
`dist/cli.js`), no new dependency, stdlib only:

- **`factory status`** (also `node dist/cli.js status`)
  Prints: factory version (`factory.config.json`), the active slice, and the gate
  catalog one gate per line (`<id> <tier> <status>`). Exit 0 always (it is a read-only
  dump of the manifest, not a verdict).
- **`factory check [--base <ref>]`** (also `node dist/cli.js check …`)
  Prints: the change set (paths), the active slice's declared tier vs. the resolved
  required tier, escalations with the protected-path rule that caused each, and any
  problems (paths outside the declared blast radius, a written downgrade reason, an
  unusable `--base`). Exit 0 with `factory check: PASS, <tier>` when clean; exit 1 with
  the problems listed when not. Same verdict semantics as the lane's G4f row because it
  consumes the same engines; without `--base` it prints the same working-tree-only note
  the lane prints.
- Sharing: both commands call the **same functions the lane uses** — `loadConfig`,
  `scanChangeSet`-equivalent via the existing lib, `checkBlastRadius`, `resolveTier`
  (`src/tiers`). If importing the `.mjs` engines from compiled TS needs help, the
  bridge is a hand-written ambient `.d.ts` for the specific modules; the implementation
  must record in the code comment which functions are shared and where logic was
  re-declared. All `child_process` use is `spawn`/`spawnSync` with argument arrays
  (SAST rule).
- Human surface: `--help` on both commands and the top-level (via a `usage()` string,
  no dependency); unknown argument → exit 1 with the usage line naming the bad argument.

The release cut (v0.3.2) rides with the slice; `package.json` gains no `bin` yet — the
deployment slice (0007) owns the artifact and the `bin` decision together.

## Acceptance criteria

| AC | Statement | Tier of test |
| --- | --- | --- |
| AC-1 | `factory status` prints factory version, active slice, and every gate as `<id> <tier> <status>`; exit 0 | isolated |
| AC-2 | `factory check --base <clean-ref>` on the working tree at rest prints PASS with the declared tier; exit 0 | isolated |
| AC-3 | A change touching a protected path (scratch commit) makes `factory check` exit 1 naming the escalation (`required tier T2` class message) — break-and-restore vs. `git checkout --` | isolated |
| AC-4 | A change outside the declared blast radius makes `factory check` exit 1 naming the path — break-and-restore | isolated |
| AC-5 | `--base` parity with the lane: the CLI's change set for the same base matches `scripts/ci/blast-radius.mjs`'s output paths (test compares the two) | isolated |
| AC-6 | `--help` for both commands and at top level; unknown argument exits 1 naming it | isolated |
| AC-7 | The clean-tree lane run stays green and the CLI adds no new dependency (lockfile diff: version bump only) | command |
| AC-8 | The v0.3.2 release cut holds: package.json version == factoryVersion == newest released CHANGELOG section; `activeSlice` points at this slice | isolated |

## Non-criteria

- `factory dev`-style interactive commands (wizard, scaffold).
- Contract exports (the CLI is not a published API while its artifact is undeployed).
- Any behavior change in `scripts/ci/**` beyond none required by sharing.

## Open questions

None blocking. The import-bridge mechanics are implementation detail per constraint 1;
if the bridge fails, fallback (local re-implementation + declared duplication) is named
in the A1 assumptions.
