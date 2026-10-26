# Problem brief (A1)

> Station S0 · Gate G0 · Keep this under one page.

| Field | Value |
| --- | --- |
| ID / title | 0002 — Make the local change set VCS-faithful |
| Owner | Siergus |
| Date | 2026-10-26 |
| Risk tier | T2 — escalated by `scripts/ci/**`, `factory.config.json`, and `adapters/**` |
| Version | 3 |
| Links | [Spec](A2-spec.md) · [Slice plan](A4-slice-plan.md) |

## Problem

A local gate run can inspect less than the change it claims to verify. With `--base`,
`gitChangedPaths` reads `<base>...HEAD`, so staged changes in the index (including index-only
changes whose working-tree copy matches `HEAD`), unstaged tracked edits, deletions, and
renames are invisible. Without `--base`, it reads only the working tree, so committed changes
on the branch are invisible. A contributor can therefore see a green `G4f` while a changed
protected path, or a path outside the declared radius, has not been evaluated.

## Who is affected

The repository owner and any agent working in this repository. They run the fast lane before
opening a pull request and rely on its blast-radius verdict. The cost is a false pass at S4,
discovered later at review or after merge, plus a loss of trust in the gate that is supposed
to make the change set falsifiable.

## Current workaround and why it is insufficient

The workaround is to pass an explicit `--changed` list, or to run the lane twice: once
without `--base` for working-tree edits and once with `--base` for commits. Both are manual
and easy to forget. The explicit list is self-declared and can omit a path; the fast lane
already prints that limitation (A5 F5). Running twice does not produce one authoritative
change set, so the result is still assembled by the contributor rather than by git.

## Outcome

| Field | Value |
| --- | --- |
| Metric | Change classes included in one local `--base` run |
| Baseline | 2 of 6: committed branch changes and untracked files |
| Target | 6 of 6: committed, index-staged (including index-only), unstaged tracked, deleted, renamed, and untracked |
| Horizon | End of this slice (2026-10-26) |
| Measurement method | `test/blast-radius-git.test.mjs` plus A5 smoke runs on scratch worktrees; extract the exact paths reported by `node scripts/ci/blast-radius.mjs --base <ref>` |
| What result would prove us wrong | A committed in-radius change plus an index-only staged out-of-radius tracked edit still produces a green `G4f` |

## Non-goals

- Making no-base mode infer a branch point. It stays working-tree-only and prints a warning.
- Validating or trusting an explicit `--changed` list. That remains the F5 residual risk.
- Changing the CI workflow, its `--base` input, or the required status check.
- Audit, format, lint, SAST, or secret-history scanning.
- Any product code or runtime capability.

## Constraints

- Node.js 24, npm 11, and git are available locally and on `ubuntu-24.04`.
- No new dependencies; the fix uses git plumbing and the Node standard library.
- Windows and Linux must produce the same repo-relative paths.
- `scripts/ci/**`, `factory.config.json`, and `adapters/**` are protected paths, so the slice is T2.
- `activeSlice` must move to this slice so its own gate runs use this A4.
- The 0001 artifacts are history; this slice does not edit them.

## Assumptions and open questions

| # | Statement | How it will be tested | Blocking? |
| --- | --- | --- | --- |
| 1 | `git diff HEAD` covers working-tree changes; index-only staged changes require `git diff --cached HEAD` | Integration tests with one unstaged edit, one staged edit, and one staged edit restored to `HEAD` | No |
| 2 | `git diff --no-renames --diff-filter=ACDMRTU` reports both sides of a rename and includes typechanges | Integration test using `git mv` without committing; typechange test with an embedded repository | No |
| 3 | `git ls-files --others --exclude-standard` reports untracked files, including nested ones | Integration test with a nested untracked file | No |
| 4 | An empty or all-zero base is equivalent to no base | Integration test with a dirty tree and a zero base | No |
| 5 | A no-base run cannot know the branch point, so a warning is the honest control | CLI run; the warning is recorded in A5 | No |
| 6 | Git is present wherever the fast lane runs | CI uses the same checkout as the existing lane; no new dependency | No |

## Decision

- [x] Proceed to S1
- [ ] Needs discovery (what specifically)
- [ ] Stop (why)

## Gate G0 checklist

- [x] The problem is stated without naming a solution.
- [x] The outcome could fail, and we would notice.
- [x] Baseline exists or its absence is recorded.
- [x] Non-goals are explicit.
- [x] Tier is declared and the owner is named.
