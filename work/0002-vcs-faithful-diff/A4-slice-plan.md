# Slice plan (A4)

> Station S3 · Gate G3 · A slice is the smallest change that produces **observable**
> behavior. The tier declared here governs the whole change.

| Field | Value |
| --- | --- |
| ID / title | 0002 — Make the local change set VCS-faithful |
| Spec | [A2](A2-spec.md) v3 |
| Tier | T2 |
| Tier downgrade reason | n/a |
| Version | 3 |
| Owner | Siergus |
| Target release | Factory v0.2.1 (unreleased) |

## Observable outcome

A contributor can run `npm run fast -- --base main` on a dirty branch and the gate evaluates
one complete change set: committed changes since the base, staged changes in the index
(including index-only changes whose working-tree copy matches `HEAD`), unstaged tracked
edits, deletions, renames, untracked files, and typechanges. A green `G4f` can no longer be
claimed while an uncommitted protected or out-of-radius path was left out of the set. Without
`--base`, both the fast lane and `node scripts/ci/blast-radius.mjs` say explicitly that
committed branch changes are not included.

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | `scripts/ci/lib/blast-radius.mjs`, `scripts/ci/fast.mjs`, `scripts/ci/blast-radius.mjs`, `test/**`, `work/0002-vcs-faithful-diff/**`, `work/README.md`, `factory.config.json`, `README.md`, `AGENTS.md`, `CHANGELOG.md`, `adapters/stack/node-typescript.md` | Change-set collection, the shared source note, both CLI entry points, integration tests, the slice artifacts, and the docs that describe the lane |
| Public contracts | `gitChangedPaths(root, baseRef)` now returns the union of the base range, the index, the working tree, and untracked files; `changeSetNote` owns the source warning; CLI flags and exit codes unchanged | Additive in completeness; no breaking change |
| Data / schema | none | No runtime data or store |
| Configuration / secrets | `activeSlice` moves to this slice; G4f note records the union | No secrets |
| Infrastructure | none | No workflow or runner change |
| Protected paths | yes | Escalated to T2 by `scripts/ci/**`, `factory.config.json`, and `adapters/**` |

## Undo

| Method | Steps | Time to undo | Data loss risk |
| --- | --- | --- | --- |
| Revert commit | `git revert <commit>` once the slice is committed | < 5 minutes | none |
| Manual revert | Restore `scripts/ci/lib/blast-radius.mjs`, `scripts/ci/fast.mjs`, and `scripts/ci/blast-radius.mjs` from `main`; set `activeSlice` back to `work/0001-enforce-phase-0`; remove the 0002 directory and test files | < 10 minutes | none; tests and docs are additive |
| Disable the new sources | Revert only the union in `gitChangedPaths`; the 0001 behavior returns | < 5 minutes | none |

## Steps

Ordered by risk: the assumption most likely to be wrong is tested first.

1. Write the first failing integration test: a committed change plus an unstaged tracked edit
   with `--base`. Confirm it fails against the current `<base>...HEAD` implementation.
2. Make `gitChangedPaths` union the committed range with `git diff --cached HEAD`, `git diff HEAD`, and untracked files; confirm the first test passes.
3. Add the remaining class tests one at a time: staged change, index-only staged change, deletion, rename, typechange, untracked file, zero/empty base, clean tree, non-repository, and the explicit-list path.
4. Add the shared source note to the fast lane and the blast-radius CLI; confirm both show it
   when no base is supplied.
5. Move `activeSlice` to this slice, update the lane documentation, and run the full fast
   lane. Write A5 with the red/green evidence and both scratch-worktree smoke runs.

## Verification plan

| AC | Check | Tier of test | Where it runs | Evidence location |
| --- | --- | --- | --- | --- |
| AC-1 | Base + committed + unstaged tracked edit returns both | isolated (git integration) | Local and CI | `test/blast-radius-git.test.mjs`; A5 smoke |
| AC-2 | Base + staged path returns it, including an index-only staged change | isolated | Local and CI | `test/blast-radius-git.test.mjs` |
| AC-3 | Base + uncommitted deletion returns it | isolated | Local and CI | `test/blast-radius-git.test.mjs` |
| AC-4 | Base + uncommitted rename returns old and new | isolated | Local and CI | `test/blast-radius-git.test.mjs` |
| AC-5 | Base + nested untracked file returns the file | isolated | Local and CI | `test/blast-radius-git.test.mjs` |
| AC-6 | Empty/all-zero base falls back; clean tree is empty; the guard rejects it | isolated | Local and CI | `test/blast-radius-git.test.mjs`; A5 guard probe |
| AC-7 | Both no-base entry points print the warning | isolated + manual | Local | `changeSetNote` test; A5 CLI outputs |
| AC-8 | Non-repository library call fails with an actionable message | isolated | Local and CI | `test/blast-radius-git.test.mjs` |
| AC-9 | Explicit `--changed` keeps its behavior and trust note | manual | Local | A5 command output |
| AC-10 | New tests are red before the fix and green after; fast lane passes | manual | Local | A5 commands and gate summary |

## Risks and ordering rationale

| Risk | Why it is first (or last) | Early signal |
| --- | --- | --- |
| The union double-counts or misses a source | The completeness claim is the whole slice | First red test fails on the missing unstaged path; the Set dedupes |
| The working-tree diff misses an index-only staged change | A staged protected path whose worktree copy matches `HEAD` would be a false pass | AC-2's index-only test fails with the old two-source union and passes with the index source |
| A base ref can be mistaken for a git option | An injected `--output` or similar could change git behaviour | `normalizeBase` rejects a leading `-` before git runs; the invalid-base test covers it |
| `--no-renames` hides one side of a rename | A renamed protected file could escape escalation | AC-4 exercises `git mv` |
| Typechanges or conflicts disappear from the filter | A typechange or unmerged path could hide a change | The `T`/`U` filter plus the typechange test |
| Zero base falls back to an empty set | A new branch could pass on nothing | AC-6, the clean-tree assertion, and the guard probe |
| Local runs become stricter | Unrelated dirty files can now fail the radius gate | Intended fail-closed behavior; use a clean worktree or explicit `--changed` |
| No-base mode remains blind to commits | A user can still run without `--base` | Both entry points print the source note; AC-7 records it |
| Windows path or git quoting differs | Tests could pass on Linux and fail locally | Integration tests run on Windows first; `--no-renames` and sorted forward-slash paths |
| Git is absent or the repo is unborn | The gate must fail closed, not pass | AC-8 and the documented unborn-branch limitation |
| `git ls-files` fails silently | A broken index could hide untracked files | The preceding tracked diffs normally fail first; recorded as a residual risk |

## Review budget

| Field | Estimate |
| --- | --- |
| Files changed | 15 (3 code, 2 test, 4 slice artifacts, 6 docs/config) |
| Logical lines changed | 300 |
| If over budget, split by | Not split: the observable behavior is one truthful change set. Audit and tooling gates are separate slices. |

## Gate G3 checklist

- [x] The slice is vertical and observable on its own.
- [x] Tier is declared; protected paths checked; escalation applied if needed.
- [x] Blast radius is complete.
- [x] Undo is executable by one person and has a time estimate.
- [x] Verification covers every AC, including the expensive ones.
- [x] The diff fits the review budget.
- [x] No blocking dependency on a later slice.
