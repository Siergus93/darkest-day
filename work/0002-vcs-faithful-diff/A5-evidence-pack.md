# Evidence pack (A5)

> Station S5 · Gate G5 · Proof, not summary. Every result must be reproducible by a
> reviewer from the commands recorded here.

| Field | Value |
| --- | --- |
| Slice | 0002 — Make the local change set VCS-faithful |
| Spec / slice plan | [A2](A2-spec.md) v3 / [A4](A4-slice-plan.md) v3 |
| Tier | T2 — escalated by `scripts/ci/**`, `factory.config.json`, and `adapters/**` |
| Artifact versions verified | A1 v3, A2 v3, A4 v3 |
| Commit / artifact | Uncommitted working tree on `main` at `c12f6ed`; 15 changed paths; no commit or pull request yet |
| Date | 2026-10-26 |
| Author | OpenCode agent (Big Pickle) |
| Verifier | Fresh-context verifier subagent: first pass PASS WITH CONDITIONS; second pass FAIL on the index-only false pass and three minor/nit items; third pass PASS (no blocking findings). Fixes from the first two passes were applied below. Human sign-off recorded at the owner's confirmation on 2026-10-26. |

## Gate results

| Gate | Status | Evidence | Command / location |
| --- | --- | --- | --- |
| G0 problem brief | passed | A1 states the problem, a falsifiable metric, non-goals, tier, and owner | [A1](A1-problem-brief.md) |
| G1 acceptance criteria | passed | Ten ACs, each with an observable result and a verification method; blocking questions zero | [A2](A2-spec.md) |
| G2 design | passed | Boundaries, contracts, failure modes, threats, and the no-ADR decision are recorded | [A2](A2-spec.md) § Design constraints |
| G3 slice plan | passed | A4 declares T2, an executable undo, and a review budget; the 15-path change set stayed inside the declared radius | [A4](A4-slice-plan.md); `node scripts/ci/blast-radius.mjs --base main` |
| G4a clean build | passed | `npm run build` exits 0 through both the test pre-step and the fast lane | `npm test`; `npm run fast -- --base main` |
| G4b format + lint + type + static | partial | Type check passes through the build; format, lint, and SAST are adapter exceptions with an owner and expiry | `npm run build`; [adapter](../../adapters/stack/node-typescript.md) |
| G4c fast tests | passed | 43 passed, 0 failed after the P1 regression test; earlier runs 42 passed, 0 failed | `npm test -- --test-reporter=dot`; `npm run fast -- --base main` |
| G4d secret scan | passed | Clean tree: no credential patterns found | `npm run fast -- --base main` (`G4d PASS`) |
| G4e dependency policy | partial | Lockfile inventory readable; `npm audit` reports no high or critical advisories. The audit stays advisory until it is observed failing | `npm run fast -- --base main` (`G4e PARTIAL`) |
| G4f blast radius | passed | 15 changed paths inside the A4 radius; both the uncommitted and the index-only staged smoke runs reported an outside path and exited 1 | `node scripts/ci/blast-radius.mjs --base main`; scratch worktree smokes below |
| G5a AC verification | passed | Every AC has a reproduced result below; AC-7 and AC-9 are manual runs recorded here | This table |
| G5b contracts | n/a | No published interface; the internal `gitChangedPaths` / `changeSetNote` contract is covered by 12 tests | `test/blast-radius-git.test.mjs` |
| G5c authorization | n/a | No runtime actors or data | — |
| G5d migration compatibility | n/a | No schema or data store | — |
| G5e boundary failure | n/a | No external boundary in the local lane; local git failure probes are recorded under Resilience | — |
| G5f performance | n/a | No hot path; the fast lane wall-clock budget is measured under Performance | — |
| G5g tests can fail | passed | The first integration test failed before the fix; the index-only test failed against the two-source union; the scratch smoke runs exited 1 with the outside path; typechange and note tests were red against the pre-fix code | Red/green record below |
| G5h flaky budget | n/a | No journey tier; repeated local runs are recorded under Commands and Performance | — |

## Acceptance criteria evidence

| AC | Criterion (verbatim) | Result | Evidence | Would a wrong implementation fail this? |
| --- | --- | --- | --- | --- |
| AC-1 | With a committed change and an unstaged edit to another tracked file, `gitChangedPaths(root, base)` returns both paths; a run whose uncommitted path is outside the A4 radius fails `G4f` | pass | The first red test returned only `["README.md"]`; after the fix it returns `["README.md","docs/guide.md"]`. The scratch smoke run had a committed `README.md` change plus an uncommitted edit to `docs/software-factory/01-principles.md`; it printed `outside declared radius: docs/software-factory/01-principles.md` and exited 1 | yes |
| AC-2 | A staged new or modified path appears in the returned set even though it is neither committed nor reported by `git ls-files --others`; this includes an index-only change whose working-tree copy matches `HEAD` | pass | `a base run includes staged changes` returns `staged.md`; `a base run includes index-only staged changes` stages a modification, restores the worktree to `HEAD`, stages a new file, unlinks it, and returns `["f.txt","new.txt"]`. The staged smoke run confirmed the same at gate level: `git diff HEAD` omitted the staged docs edit, `git diff --cached HEAD` showed it, and `G4f` reported 16 paths and exited 1 | yes |
| AC-3 | An uncommitted deletion of a tracked path appears in the returned set | pass | `a base run includes uncommitted deletions`; `deleted.md` is returned after `unlinkSync` | yes |
| AC-4 | An uncommitted rename reports the old and new paths; neither is omitted | pass | `a base run includes both sides of an uncommitted rename`; `["new-name.md","old-name.md"]` is returned after `git mv` | yes |
| AC-5 | An untracked file, including one in a nested directory, appears in the returned set | pass | `a base run includes nested untracked files`; `nested/deeper/new.md` is returned | yes |
| AC-6 | An empty or all-zero base uses the index, the working tree, and untracked files; a clean tree yields an empty set, and the guard still rejects it instead of passing | pass | `an empty or all-zero base falls back, and a clean tree is empty` covers `""`, `"0000000"`, whitespace, a real base equal to `HEAD`, and a clean repository. The guard probe with `changedPaths: []` exits 1 with `No changed paths were supplied...`; both CLI `--changed ""` runs exit 1 | yes |
| AC-7 | `npm run fast` or `node scripts/ci/blast-radius.mjs` without `--base` prints the working-tree-only warning and still evaluates the working tree | pass | Both commands printed `Note: G4f is using the working tree only; committed changes on the branch are not included. Pass --base <git-ref> to include them.` and then reported 15 paths. `the change-set note explains the source and the fix` covers the shared helper | yes |
| AC-8 | Running `gitChangedPaths` outside a git repository throws, the CLI exits 1, and the message names `--changed` as the alternative; the CLI resolves its root from the script path and uses the same function | pass | `a workspace that is not a git repository fails with an actionable message` passes; the thrown message ends with `Run inside a git repository, or pass --changed <comma-separated paths>.` | yes |
| AC-9 | Supplying `--changed` uses exactly the supplied list, prints the existing trust note, and does not require git for change discovery | pass | `npm run fast -- --changed "<15 paths>"` printed `Note: G4f is using an explicit --changed list, not a VCS diff...` and passed on exactly 15 paths. The `options.changed ?? gitChangedPaths(...)` branch skips git discovery when a list is supplied | yes |
| AC-10 | The change-set test file is red against the pre-fix implementation (the original 9 tests: 4 passed, 5 failed), every claimed class has a red test, the full suite passes after the fix, the fast lane passes, and `package.json` and the lockfile are unchanged | pass | The first test was 0 passed / 1 failed for the missing unstaged path. The first verifier reproduced the original 9-test file against the pre-fix code: 4 passed, 5 failed. The second verifier reproduced the index-only false pass; the 12th test fails against the two-source union and passes after adding the index source. Current run: 42 passed, 0 failed. `npm run fast -- --base main` passed. `git status --short package.json package-lock.json` is empty | yes |

## Validation matrix

| Field | Baseline | Target | Observed |
| --- | --- | --- | --- |
| Change classes in one `--base` run | 2 of 6 | 6 of 6 | 6 of 6: committed, staged, unstaged, deleted, renamed, untracked; index-only staged, typechange, and unmerged are also covered |
| Red test | 0 passed / 1 failed | — | 0 passed / 1 failed, missing the unstaged path; the original 9-test file was 4 passed / 5 failed against old code; the 12th test fails against the two-source union |
| Green suite | 30 existing tests | 43 total | 43 passed / 0 failed (42 before the P1 regression test) |
| Fast lane with `--base` | false green possible | pass on complete set | 15 paths, `G4f PASS`, 12.7s |
| Fast lane without `--base` | silent working-tree-only | explicit warning | warning printed, `G4f PASS`, 13.4s |
| Explicit `--changed` | trusted list | existing trust note | note printed, 15 paths, 13.6s |

## Commands run

| Command | Exit code | Summary |
| --- | --- | --- |
| `node --test test/blast-radius-git.test.mjs` (first red test, before the fix) | 1 | 0 passed, 1 failed; actual `["README.md"]`, expected `["README.md","docs/guide.md"]` |
| `node --test --test-name-pattern "index-only staged changes" test/blast-radius-git.test.mjs` (scratch worktree with the index source removed) | 1 | 0 passed, 1 failed; actual `[]`, expected `["f.txt","new.txt"]`; proves the new test is red against the two-source union |
| `node --test test/blast-radius-git.test.mjs` (final file) | 0 | 12 passed, 0 failed, 7609.9876ms |
| `npm test -- --test-reporter=dot` | 0 | 42 passed, 0 failed, 8973.3694ms |
| `npm run fast -- --base main` | 0 | Fast lane PASSED in 12.7s; `G4c` 42 passed, 0 failed, 7772.8451ms; `G4f` 15 paths |
| `npm run fast` | 0 | Fast lane PASSED in 13.4s; working-tree-only warning printed; `G4c` 42 passed, 0 failed, 8084.9623ms; `G4f` 15 paths |
| `npm run fast -- --changed "<15 paths>"` | 0 | Trust note printed; explicit list used; PASSED in 13.6s; `G4c` 42 passed, 0 failed, 9309.5687ms; `G4f` 15 paths |
| `node scripts/ci/blast-radius.mjs --base main` | 0 | `declared T2, required T2, 15 changed path(s)`; five T2 escalations from `adapters/**`, `factory.config.json`, and `scripts/ci/**` |
| `node scripts/ci/blast-radius.mjs` | 0 | Working-tree-only warning printed; 15 changed paths; same five escalations |
| `node scripts/ci/blast-radius.mjs --base "--output=evil"` | 1 | `Invalid base ref "--output=evil": a base ref must not start with "-".`; no git option injection |
| Guard probe: `checkBlastRadius({ slice, changedPaths: [] })` | 1 | `No changed paths were supplied. Pass --changed <paths> or --base <git-ref>; an empty change set must not pass the blast-radius gate.` |
| `node scripts/ci/blast-radius.mjs --changed ""` | 1 | `--changed must list at least one path; an empty change set must not pass.` |
| `node scripts/ci/fast.mjs --changed ""` | 1 | Same rejection before any gate ran |
| Scratch worktree, uncommitted smoke: `node scripts/ci/blast-radius.mjs --base main` | 1 | 16 changed paths; `outside declared radius: docs/software-factory/01-principles.md`; `SMOKE_EXIT_CODE=1`; worktree removed |
| Scratch worktree, index-only staged smoke: `node scripts/ci/blast-radius.mjs --base main` | 1 | Status `MM docs/...`; `git diff HEAD` omitted the docs path; `git diff --cached HEAD` showed it; 16 changed paths; outside path reported; `SMOKE_EXIT_CODE=1`; worktree removed |
| `node scripts/ci/blast-radius.mjs --base` | 1 | `--base requires a git ref; a valueless --base is a usage error, not a silent no-base run.` (P1 fix) |
| `node scripts/ci/fast.mjs --base` | 1 | Same rejection before any gate ran (P1 fix) |
| `npm run fast -- --base main` (after the P1 fix) | 0 | Fast lane PASSED; 43 passed, 0 failed; 15 paths |
| `git status --short` | 0 | 9 modified tracked paths and 3 untracked paths/groups, all inside the A4 radius |
| `git diff --stat` | 0 | 9 tracked files changed, 131 insertions, 35 deletions; the new test and slice files are untracked |
| `git status --short package.json package-lock.json` | 0 | Empty; no dependency or lockfile change |
| `npm run build` | 0 | TypeScript emit, no diagnostics; also run inside `npm test` and all three fast-lane runs |
| `node scripts/ci/links.mjs` | 0 | All inline and reference Markdown links resolve; run inside all three fast lanes |
| `node scripts/ci/secrets.mjs` | 0 | No credential patterns found; run inside all three fast lanes |
| `npm audit --audit-level=high --json` | 0 | No high or critical advisories; run inside all three fast lanes (`G4e PARTIAL`) |

The exact 15-path list used by the explicit-list run and the final radius check is:

```text
AGENTS.md
CHANGELOG.md
README.md
adapters/stack/node-typescript.md
factory.config.json
scripts/ci/blast-radius.mjs
scripts/ci/fast.mjs
scripts/ci/lib/blast-radius.mjs
test/blast-radius-git.test.mjs
test/helpers/git-repo.mjs
work/0002-vcs-faithful-diff/A1-problem-brief.md
work/0002-vcs-faithful-diff/A2-spec.md
work/0002-vcs-faithful-diff/A4-slice-plan.md
work/0002-vcs-faithful-diff/A5-evidence-pack.md
work/README.md
```

### Red/green record

The first test was written against the old `<base>...HEAD` implementation and failed for the
right reason: the committed `README.md` change was found, but the uncommitted `docs/guide.md`
edit was not.

```text
✖ a base run includes committed and uncommitted tracked changes
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
    [
      'README.md',
  -   'docs/guide.md'
    ]
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

The first verifier independently ran the original 9-test file against the pre-fix
implementation and observed 4 passed / 5 failed. The second verifier found the remaining
index-only false pass: `git add f.txt; git restore --worktree --source=HEAD f.txt` produced
`MM` and an empty `git diff HEAD`, so the two-source union returned `[]`. The index-only test
was added and run in a scratch worktree with the index source removed: 0 passed, 1 failed,
actual `[]`, expected `["f.txt","new.txt"]`. It passes once `git diff --cached HEAD` is added.
The second verifier also measured the then-current 11-test file at 5 passed / 6 failed.

The scratch smokes used a detached worktree at `main`, applied the working-tree patch, copied
the untracked test and slice files plus `dist/`, and committed a `README.md` change. The first
smoke added an uncommitted edit to `docs/software-factory/01-principles.md`; the second staged
the same edit and restored the worktree to `HEAD`, so `git diff HEAD` omitted it and
`git diff --cached HEAD` reported it. Both runs reported the outside path and exited 1. The
worktrees were removed afterwards; `git worktree list` shows only the main workspace.

## Test tiers

| Tier | Count | Failed | Skipped | Duration | Notes |
| --- | --- | --- | --- | --- | --- |
| Isolated | 42 | 0 | 0 | 8973.3694ms | 30 existing unit tests plus 12 new tests: 11 git integration/class tests and the shared-note test |
| Boundary | 0 | 0 | 0 | — | Local git failure probes are under Resilience; no external service |
| Contract | 0 | 0 | 0 | — | No published interface |
| Journey | 0 | 0 | 0 | — | No journey tier |

## Security

| Check | Result | Notes |
| --- | --- | --- |
| Authorization / cross-scope access | n/a | No runtime actors or data |
| Input validation and output encoding | pass | The base ref is an argv element, not shell-interpolated; `normalizeBase` rejects a leading `-` before git runs; invalid refs, a non-repository, an empty set, and a clean tree all fail closed |
| Command injection | pass | `run` uses `shell: false` for git; the only variable git argument is the caller's base ref, which cannot begin with `-`; `node scripts/ci/blast-radius.mjs --base "--output=evil"` exits 1 with a validation error |
| Secrets and sensitive logging | pass | No secrets introduced; `G4d` reports no credential patterns; error messages contain git output, not credentials |
| Dependency vulnerabilities | advisory | No new dependency; audit clean today, but not claimed as a full pass until observed failing |
| Temporary data | pass | Test repositories are removed by `t.after`; the smoke worktree was removed with `git worktree remove --force` |
| Test fixture environment | partial | Fixtures now use an empty global/system git config, empty excludes, and empty hooks; ambient `GIT_DIR`/`GIT_WORK_TREE` are still inherited. CI is clean and no failure was observed |
| Threat-model items from A2 | pass | No network, no GitHub API, no write token, and no runtime deployment |

## Data and migrations

| Check | Result | Notes |
| --- | --- | --- |
| Forward migration | n/a | No schema or stored data |
| Previous version with new schema | n/a | No schema |
| Rollback or forward fix | pass | Revert the commit once made, or restore the three code files and set `activeSlice` back; the tests and slice artifacts are additive |
| Concurrency / duplicate request | n/a | No mutable state; the `Set` de-duplicates paths from overlapping git sources |

## Performance

| G5f | Target | Measured | Environment | Verdict |
| --- | --- | --- | --- | --- |
| Fast lane wall-clock budget | ≤ 10 minutes (600s) | 12.7s with `--base`; 13.4s without; 13.6s with an explicit list | Windows, Node 24, local SSD | measured |
| Added change-set commands | Under 1s on a local repository | Three `git diff`/`git ls-files` calls plus one three-dot diff; the 12-test file completes in 7.4s including eleven repository fixtures | Windows, Node 24, local SSD | measured |

`G5f` remains `n/a` in the manifest because there is no hot path; the wall-clock measurements
are recorded here rather than claimed as a deep-lane pass.

## Resilience

| Boundary | Failure injected | Observed behavior | Meets A2 |
| --- | --- | --- | --- |
| git | Invalid base ref | `git diff ... definitely-not-a-ref...HEAD failed`; exit 1; no partial set | yes |
| git | Base ref starts with `-` | `Invalid base ref "--output=evil": a base ref must not start with "-".`; exit 1 before git runs | yes |
| git | Workspace is not a repository | `Run inside a git repository, or pass --changed <comma-separated paths>.`; exit 1 | yes |
| git | Empty or all-zero base | Falls back to the index, the working tree, and untracked files; whitespace is treated the same way | yes |
| git | Clean tree with base equal to `HEAD` | Returns `[]`; the guard rejects it | yes |
| git | Unborn `HEAD` | `git diff --cached HEAD` or `git diff HEAD` fails; documented as an out-of-scope failure mode, not a pass | yes |
| change set | Untracked file in a new directory | `git ls-files --others --exclude-standard` returns the file path | yes |
| change set | Rename without a commit | `--no-renames` reports the old path as deleted and the new path as added | yes |
| change set | Index-only staged change | `git diff --cached HEAD` returns the path when `git diff HEAD` does not; the staged smoke run proves the gate reports it | yes |
| change set | Staged typechange | The `T` filter returns the path; the typechange test passes | yes |
| change set | Unmerged path | The `U` filter includes it; no local conflict fixture is claimed | yes |
| change set | Same path from several sources | The `Set` reports it once; the duplicate-source test passes | yes |
| change set | `git ls-files` failure | Ignored; the preceding tracked diffs normally fail first. Residual risk, not exercised | partial |

## Known gaps and waivers

| Gate | Reason | Compensating control | Owner | Expires |
| --- | --- | --- | --- | --- |
| G4b format/lint/SAST | Tools not selected; no failure evidence yet | Manual review against the adapter conventions | Siergus | 2026-12-31 |
| G4d history | Scanner covers the working tree only | Full-history scan remains scheduled with the deep lane | Siergus | 2026-12-31 |
| G4e advisory | `npm audit` has not been observed failing | Lockfile inventory on every run; advisory line in the summary | Siergus | 2026-12-31 |
| G4f explicit list | A local `--changed` list is still self-declared | The lane prints the limitation; CI uses `--base`; reviewers compare the list to the diff | Siergus | 2026-12-31 |
| G4f no-base mode | A run without `--base` cannot discover committed branch changes | Both entry points print the working-tree-only warning; CI supplies a base | Siergus | 2026-12-31 |
| G4f unborn HEAD | A repository with no commits cannot produce a `HEAD` diff | Fails closed; use a commit or an explicit list | Siergus | 2026-12-31 |
| G4f `git ls-files` failure | The untracked-file command's failure is not turned into a gate failure | The preceding tracked diffs normally fail first; a broken index is not a silent pass in normal use | Siergus | 2026-12-31 |
| G4f unusual paths | Leading/trailing spaces, newlines, and git-quoted Unicode are outside the line parser | Out of scope for this slice; no such paths exist in the repository | Siergus | 2026-12-31 |
| Entry-point note wiring | Only `changeSetNote` has a unit test; removing its call from either CLI would be caught only by the manual runs | Both entry points were run and their exact output is recorded; a child-process test would couple the suite to the live slice | Siergus | 2026-12-31 |
| Test fixture environment | Ambient `GIT_DIR`/`GIT_WORK_TREE` are inherited by the temporary-repo fixtures; global config, excludes, and hooks are now isolated | CI is clean; a developer can run with a clean environment | Siergus | 2026-12-31 |

These are documented limitations with owners and expiries, not waivers. No waiver is requested
for this slice.

## Agent declaration

- Assumptions: the local workspace is a git repository at `c12f6ed`; the change set is
  intentionally uncommitted so the new union can be demonstrated on a dirty tree; CI will
  supply `--base` and a clean checkout.
- Deviations from A4: A4 v3 estimates 15 files (3 code, 2 test, 4 slice artifacts, 6
  docs/config); the delivered change set is the same 15 paths. The first and second
  verifiers' conditions were addressed inside that radius: the shared source note feeds both
  entry points, the diff filter covers typechanges and unmerged paths, the index source covers
  index-only staged changes, the base ref cannot begin with `-`, and the test file has 12
  cases. No behaviour outside the A4 radius. The adapter smoke-test row was added and then
  exercised with both scratch worktrees, not assumed. After the third verifier pass the owner
  approved one further declared deviation: a valueless `--base` is now a usage error in both
  entry points (P1), with a regression test (suite at 43 tests).
- Residual risk: the explicit `--changed` list remains self-declared; no-base mode still
  cannot see committed branch changes, but both entry points now say so; an unborn `HEAD`
  fails closed rather than producing a partial set; `git ls-files` failure is not promoted to a
  gate failure; newline, leading/trailing-space, and quoted-Unicode paths remain outside the
  line parser; entry-point note wiring is verified manually; fixtures isolate global config,
  excludes, and hooks but still inherit ambient `GIT_DIR`/`GIT_WORK_TREE`. No remote CI run or
  pull request exists yet, so the CI half of the lane is unverified.
- Commands not run and why: remote GitHub Actions (no commit or PR); dependency-vulnerability
  fixture (advisory gate); history scan (not implemented); no `npm ci` because the existing
  install was used.
- Open questions: none blocking.

## Self-review findings

| # | Location | Risk | Condition under which it matters | Resolution |
| --- | --- | --- | --- | --- |
| F1 | `scripts/ci/lib/blast-radius.mjs` | A base run saw only `<base>...HEAD`, so staged, unstaged, deleted, and renamed working-tree paths were invisible; a later two-source union still missed index-only staged changes | A contributor could get a green `G4f` while a changed protected path was not evaluated | Union of the base range, `git diff --cached HEAD`, `git diff HEAD`, and untracked files; 12 integration/unit tests; both scratch smokes |
| F2 | `scripts/ci/fast.mjs` | A no-base run silently checked only the working tree | A contributor could believe committed branch changes were included | Shared `changeSetNote`; both entry points print it; A5 records the exact output |
| F3 | `work/0002-vcs-faithful-diff/A4-slice-plan.md` | The radius is self-declared | A wide radius could hide an out-of-scope path | Protected paths still force T2; the scratch smoke proves an outside path is reported; reviewers check the radius |
| F4 | `test/blast-radius-git.test.mjs` | The integration tests use temporary repositories, not the real project repository | A git-version or platform difference could hide a failure | Tests run on Windows first; the CI lane runs on `ubuntu-24.04`; no shared state |
| F5 | `scripts/ci/fast.mjs` | Explicit `--changed` is still trusted and self-declared | A local pass can be claimed with an incomplete list | The existing trust note remains; CI uses `--base`; recorded as a residual risk |
| F6 | `scripts/ci/lib/blast-radius.mjs` | `git ls-files` failure is ignored rather than failing the gate | A broken index could hide untracked files | In a normal repository the preceding tracked diffs fail first; no new failure path was introduced. Residual, not exercised |

## Fresh-context verifier findings

The first fresh-context verifier returned **PASS WITH CONDITIONS** for local scope. Its
conditions and the dispositions are below; the core union behaviour and the 9 original tests
were accepted.

| # | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| V1 | major | The scratch-smoke row said 13 paths; the current-tree fixture yields 16 | Re-ran the smoke against the current tree: 16 paths, outside `docs/software-factory/01-principles.md`, exit 1. A5 records 16 |
| V2 | major | The no-base warning existed only in the fast lane, not in `scripts/ci/blast-radius.mjs` | Added `changeSetNote` and called it from both entry points; added a unit test; A2 AC-7 covers both; observed both outputs |
| V3 | minor | `--diff-filter=ACMRD` dropped staged typechanges | Added `T` and `U`; added the typechange test; observed it fail with `ACDMR` and pass with `ACDMRTU` |
| V4 | minor | A5 implied every new test failed before the fix, while only the first test was red at first | A5 now records the first red run and the verifier's original-file result (4 passed / 5 failed); AC-10 names both |
| V5 | minor | AC-6 cited only `--changed ""`, not an empty git-derived set | Added a clean-tree assertion to the zero-base test and recorded the direct guard probe (exit 1) |
| V6 | minor | AC-8 said the CLI could be run outside a repository, but the CLI derives its root from the script path | Narrowed AC-8 to `gitChangedPaths`; the CLI uses the same function and the same test |
| V7 | nit | A2 said spaces were preserved without distinguishing leading/trailing spaces | A2 now says interior spaces are preserved and leading/trailing spaces are trimmed |
| V8 | nit | A4's review budget said 15 files but broke down as 2+2+4+7 | A4 records 15 = 3 code + 2 test + 4 artifacts + 6 docs/config |
| V9 | nit | A1/A2 tier lines omitted `adapters/**` | A1 and A2 include `adapters/**` |
| V10 | nit | `work/README.md` moved to `S5 — verify` while G5 sign-off is pending | Accepted: G4 has passed and A5 is under review; the row stays at S5 until human sign-off moves it to S6 |
| V11 | nit | No whitespace-base assertion | Added `gitChangedPaths(root, "   ")` to the zero-base test |
| V12 | nit | Temporary fixtures inherit ambient `GIT_*` variables | Recorded as a residual risk with a clean-environment compensating control; not changed in this slice |

A second fresh-context verifier pass returned **FAIL** for local scope. It confirmed V1–V12
were addressed and, against the then-current suite, reproduced 41 tests / 0 failed, 11 new
tests, 15 `G4f` paths, the 16-path smoke exit 1, and the no-base warning in both entry points.
It found one blocking false pass and three minor/nit items; the dispositions follow.

| # | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| B1 | blocking | The two-source union missed index-only staged changes: `git add f.txt; git restore --worktree --source=HEAD f.txt` returned `[]`; a gate-level clone with a staged/restored outside path printed 15 paths and exited 0 | Added `git diff --cached HEAD` as a fourth source; added `a base run includes index-only staged changes`; re-ran the staged gate-level smoke, which now reports 16 paths, the outside path, and exit 1 |
| M1 | minor | A base ref beginning with `-` was passed to git as an option; `git diff ... '--output=evil...HEAD'` exited 0 and omitted the committed range | `normalizeBase` rejects a leading `-`; the invalid-base test asserts the rejection; `node scripts/ci/blast-radius.mjs --base "--output=evil"` exits 1 with the validation message |
| M2 | minor | The shared-note test exercises only the helper, not the two CLI call sites | Accepted as a residual/known gap: both entry points were run and their exact output is recorded; a child-process test would couple the suite to the live slice |
| N1 | nit | `assert.match(changeSetNote({ baseRef: "0000000" }), /--base/)` also matches the explicit-list note | Now asserts `/working tree only/` and separately asserts explicit precedence with a zero base |
| N2 | nit | A5 conflated the 15 changed paths with the declared radius | A5 now says the 15-path change set stayed inside the declared radius |
| N3 | nit | G5h pointed at Resilience for repeated runs | G5h now points at Commands and Performance |
| N4 | nit | The adapter smoke row said “scratch branch restored”; the smoke uses a detached worktree | Adapter row now says the scratch worktree was removed |
| N5 | nit | A2 AC-8 said `gitChangedPaths` exits 1; the library throws and the CLI exits 1 | A2 and A5 now say the function throws and the CLI exits 1 |
| N6 | nit | Fixtures inherited global git config, `core.excludesFile`, and `core.hooksPath` | `createGitRepo` now uses an empty global/system config plus empty excludes and hooks; A5 narrows the residual to ambient `GIT_DIR`/`GIT_WORK_TREE` |

A third full verifier pass was started and interrupted at the user's request before it produced
a verdict; no third-party verdict is claimed for that pass. A fresh third pass was then
completed and returned **PASS** for local scope. It reproduced: 42 passed / 0 failed; the fast
lane passing with `--base main` on 15 paths; the base-ref injection rejected
(`--base "--output=evil"` exit 1); the working-tree-only warning in both no-base entry points;
an empty `package.json`/`package-lock.json` status; and — at gate level, in a scratch worktree
at `main` — the index-only staged change again detected (16 paths, outside path named, exit 1).
It attempted five false-pass constructions and failed to build one: option injection, missing
`--base` value, missing `--changed` value, nonexistent cwd, and index-only
delete-then-restore. One new finding:

| # | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| P1 | minor | `--base` with no following value silently degrades to no-base mode instead of erroring | Fixed in-slice as a declared deviation: `parseArguments` in both entry points now throws `--base requires a git ref...; a valueless --base is a usage error` and exits 1; regression test added (43 total tests); no-base mode unchanged |

No scratch worktrees were left behind; only the main workspace remains.

The author's short targeted re-check after the
fixes produced:

| Check | Result |
| --- | --- |
| `node --test test/blast-radius-git.test.mjs` | 12 passed, 0 failed, 7609.9876ms |
| `node scripts/ci/blast-radius.mjs --base main` | exit 0; declared T2, required T2, 15 paths; five escalations |
| `node scripts/ci/blast-radius.mjs --base "--output=evil"` | exit 1; `Invalid base ref "--output=evil": a base ref must not start with "-".` |
| `node scripts/ci/links.mjs` | exit 0; all relative Markdown links resolve |
| `git worktree list` | only the main workspace; no scratch worktree left |

The targeted check confirms the index-only fix, the base-option rejection, the 15-path radius,
and the links. It complements, not replaces, the completed third independent pass above.

## Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Verifier | Fresh-context verifier subagent | First pass PASS WITH CONDITIONS; second pass FAIL (index-only staging, base option injection, test nits); third pass PASS, no blocking findings; fixes applied | 2026-10-26 |
| Reviewer | Owner (Siergus) | Reviewed A5 and the verifier record; approved the P1 deviation and continuation | 2026-10-26 |
| Human (T2+) | Siergus | Sign-off confirmed in conversation ("ok, i can confirm we can continue") with the P1 fix in-slice | 2026-10-26 |

## Gate G5 checklist

- [x] Every AC has a reproduced result in A5.
- [x] Failure paths and authorization are exercised.
- [x] No secret, no unjustified dependency, no unrelated change.
- [x] Undo procedure is defined in A4.
- [x] Decisions recorded; docs consistent with behavior.
- [x] Stack delta from the adapter satisfied: [adapter](../../adapters/stack/node-typescript.md).
