# Spec (A2)

> Station S1 · Gate G1 (design sections: G2) · Every acceptance criterion must be
> **observable** and mapped to a **verification method**.

| Field | Value |
| --- | --- |
| ID / title | 0002 — Make the local change set VCS-faithful |
| Problem brief | [A1](A1-problem-brief.md) |
| Tier | T2 — escalated by `scripts/ci/**`, `factory.config.json`, and `adapters/**` |
| Version | 3 |
| Owner | Siergus |

## Scope

Make `gitChangedPaths` return one complete change set for a local run: committed changes
since `--base`, staged changes in the index, unstaged tracked edits in the working tree,
deletions, renames, and untracked files. The fast lane and the blast-radius CLI keep their
flags and exit codes; both gain a warning when no base is supplied because committed branch
changes cannot be discovered without one. The diff filter also covers typechanges and
unmerged paths so neither can hide a path. CI behaviour is unchanged except that the change
set is now a union of the same sources.

## Behaviors and acceptance criteria

| AC | Behavior | Acceptance criterion (observable) | Verification method | Status |
| --- | --- | --- | --- | --- |
| AC-1 | A base run includes committed and uncommitted tracked changes | With a committed change and an unstaged edit to another tracked file, `gitChangedPaths(root, base)` returns both paths; a run whose uncommitted path is outside the A4 radius fails `G4f` | Integration test plus A5 scratch-worktree smoke runs | planned |
| AC-2 | A base run includes staged changes | A staged new or modified path appears in the returned set even though it is neither committed nor reported by `git ls-files --others`; this includes an index-only change whose working-tree copy matches `HEAD` | Integration test with a staged modification restored to `HEAD`, plus a staged add followed by a worktree unlink | planned |
| AC-3 | A base run includes deletions | An uncommitted deletion of a tracked path appears in the returned set | Integration test | planned |
| AC-4 | A base run includes both sides of a rename | An uncommitted rename reports the old and new paths; neither is omitted | Integration test | planned |
| AC-5 | A base run still includes untracked files | An untracked file, including one in a nested directory, appears in the returned set | Integration test | planned |
| AC-6 | Empty and all-zero bases fall back safely | An empty or all-zero base uses the index, the working tree, and untracked files; a clean tree yields an empty set, and the guard still rejects it instead of passing | Integration test plus the guard probe in A5 | planned |
| AC-7 | A no-base run states its limitation | `npm run fast` or `node scripts/ci/blast-radius.mjs` without `--base` prints the working-tree-only warning and still evaluates the working tree | CLI runs plus the `changeSetNote` unit test | planned |
| AC-8 | A non-repository fails with an actionable message | Running `gitChangedPaths` outside a git repository throws, the CLI exits 1, and the message names `--changed` as the alternative; the CLI resolves its root from the script path and uses the same function | Integration test | planned |
| AC-9 | Explicit `--changed` behavior is unchanged | Supplying `--changed` uses exactly the supplied list, prints the existing trust note, and does not require git for change discovery | Manual regression run | planned |
| AC-10 | The fix is test-proven and dependency-free | The change-set test file is red against the pre-fix implementation (the original 9 tests: 4 passed, 5 failed), every claimed class has a red test, the full suite passes after the fix, the fast lane passes, and `package.json` and the lockfile are unchanged | Red/green record in A5; `git diff` | planned |

## Non-functional requirements

| Attribute | Target | Measured how | Applies to |
| --- | --- | --- | --- |
| Latency | The added git calls stay below 1s on a local repository; the fast lane remains under its 10-minute budget | Elapsed time and test duration | Every base run |
| Determinism | The same tree and base produce the same sorted path set on consecutive runs | Run the integration test twice; compare output | Change-set collection |
| Portability | The same tests pass on Windows and `ubuntu-24.04` with Node 24 | Local Windows run plus CI | Path collection and tests |
| Offline operation | The change-set collection uses no network | Review; no new dependency | Change-set collection |
| Availability | Not required, because no service exists | — | — |
| Data durability | Not required, because no store exists | — | — |

## Authorization

No runtime actors exist. The only actor is a repository contributor running the gate.

| Actor | Operation | Data scope | Allowed | Denied behavior |
| --- | --- | --- | --- | --- |
| Repository contributor | Run the fast lane | Local working tree and git metadata | Yes | — |
| Fork pull request | Run the fast lane in CI | Checked-out code and the provided base SHA | Yes, without secrets | No access to repository secrets or write tokens |

This slice does not change the authorization surface.

## Data lifecycle

| Data | Created by | Retained | Deleted by | Exported by | Sensitive? |
| --- | --- | --- | --- | --- | --- |
| Temporary git repositories in tests | The test helper | For the duration of a test | `t.after` cleanup | No | No |
| Change-set paths | `gitChangedPaths` | Process memory only | Process exit | No | No |

No user data, secrets, or runtime state are introduced.

## Failure modes

| Dependency or condition | Mode | Expected behavior | User-visible result |
| --- | --- | --- | --- |
| git | Absent | `run` returns a non-zero status or spawn error; `gitChangedPaths` throws | Exit 1 with the failing git command and the `--changed` alternative |
| `--base` | Invalid ref | `base...HEAD` fails; the error names the command and the base | Exit 1; no partial pass |
| `--base` | Starts with `-` | `normalizeBase` rejects it before git runs | Exit 1; no option injection |
| Workspace | Not a git repository | `git diff --cached HEAD` or `git diff HEAD` fails before any result is returned | Exit 1 with an actionable message |
| Repository | No commits yet | `git diff --cached HEAD`/`git diff HEAD` fails because `HEAD` is unborn | Exit 1; documented as out of scope |
| Change set | Empty after filtering | The existing empty-set guard throws | Exit 1; an empty diff must not pass |
| Change set | Index-only staged change | `git diff --cached HEAD` reports the path even when the working-tree copy matches `HEAD` | The path is evaluated |
| Rename | Working tree rename | `--no-renames` plus `--diff-filter=ACDMRTU` reports the old and new paths | Both paths are evaluated |
| Typechange | Staged file-to-gitlink change | The `T` filter includes the path instead of dropping it | The path is evaluated |
| Merge conflict | Unmerged path | The `U` filter includes the path instead of hiding it | The path is evaluated |
| Filenames | Newline in a path | Line-based parsing cannot represent it | Out of scope; no such paths exist in this repository |
| Paths | Spaces or Unicode | Interior spaces are preserved; leading/trailing spaces are trimmed; Unicode may be quoted by git | Current parser is unchanged; not part of this slice |

## Edge cases

- `--base` equal to `HEAD` with a dirty working tree: only the working-tree paths are added.
- All-zero or whitespace-only base: treated as no base, so the working tree and untracked files are still checked.
- A clean tree with a base equal to `HEAD`: the set is empty and the guard rejects it.
- A staged deletion: the index source reports the path; it must not be lost.
- An index-only staged modification with the worktree restored to `HEAD`: `git diff --cached HEAD` reports it.
- A staged add followed by a worktree unlink: the index source reports it.
- A staged typechange: the `T` filter reports the path; it must not be lost.
- An unmerged path: the `U` filter reports the path; a conflict must not hide it.
- An untracked file inside a new directory: `git ls-files --others` reports the file, not just the directory.
- A rename with edits: `--no-renames` reports the old path as deleted and the new path as added; both are checked.
- Duplicate paths from multiple git sources: the `Set` keeps one copy.
- Detached `HEAD`: the three-dot diff still uses the supplied base; no branch name is required.

## Out of scope

- Inferring a branch point when no `--base` is supplied.
- Making the explicit `--changed` list trustworthy or complete.
- Checking untracked files against gitignore semantics beyond `--exclude-standard`.
- Newline-containing filenames and git's path-quoting modes.
- Audit, format, lint, SAST, or secret-history scanning.
- CI workflow changes, required-check changes, or release-lane work.
- Any product or runtime capability.

## Assumptions and open questions

| # | Assumption or question | Owner | Blocking? | Resolution |
| --- | --- | --- | --- | --- |
| 1 | `git diff HEAD` covers working-tree changes; index-only staged changes require `git diff --cached HEAD` | Siergus | No | Verified by AC-1 and AC-2 |
| 2 | `--no-renames` yields a delete plus an add for a working-tree rename | Siergus | No | Verified by AC-4 |
| 3 | A three-dot diff against an ancestor is the intended committed range | Siergus | No | Preserved from 0001; the base is supplied by the caller |
| 4 | A no-base run cannot be made branch-aware without choosing a base | Siergus | No | Accepted; warning is the control |
| 5 | Git is available in every environment that runs the fast lane | Siergus | No | Existing adapter and CI already require it |

## Design constraints and boundaries (T2+)

| Component | Owns | May depend on | Must not depend on | Owner |
| --- | --- | --- | --- | --- |
| `scripts/ci/lib/blast-radius.mjs` | Collecting and de-duplicating changed paths from the base range, index, working tree, and untracked files; the shared change-set note | Node standard library, `run`, git CLI | Network, GitHub APIs, `dist/tiers.js` for path collection | Siergus |
| `scripts/ci/fast.mjs` | Lane composition and the G4f verdict | `scripts/ci/lib/*` | Gate logic of its own | Siergus |
| `scripts/ci/blast-radius.mjs` | CLI flag parsing, the source note, and the exit code | `scripts/ci/lib/*` | Gate logic of its own | Siergus |
| `test/blast-radius-git.test.mjs` | Integration proof of the change classes and the source note | Node test runner, temp directories, git CLI | The network or a shared repository | Siergus |
| `factory.config.json` | `activeSlice` and the G4f note | — | Code or environment | Siergus |

- **Contracts and compatibility rule:** `gitChangedPaths(root, baseRef)` returns a sorted, de-duplicated array of repo-relative paths. It throws on an unusable repository or base. `changeSetNote({ baseRef, explicit })` returns the source warning or `undefined`, and both entry points use it so their notes cannot drift. The CLI flags `--slice`, `--base`, and `--changed` and the exit codes 0/1 are unchanged. The change is additive in completeness, not a breaking API change.
- **Transaction boundaries / consistency:** Not applicable; each call reads a snapshot of the working tree. Concurrent edits during the call are outside the gate's contract.
- **Trust boundaries and threats specific to this change:** Git output is data, not code. Git arguments are constants or the caller's base ref; `run` uses `shell: false` for git. The base ref is passed as an argv element, not interpolated into a shell command, and a leading `-` is rejected so it cannot become a git option. The change does not add network or secret access.
- **Deployment and observability shape:** Nothing is deployed. Evidence is the test output and the A5 smoke record.
- **Migration approach (expand / migrate / contract):** Not applicable; no schema or stored data.
- **Decisions recorded (A3 links):** None. The change is reversible and does not select a new tool or policy.

## Definition of Done

- [ ] Every AC has a reproduced result in A5.
- [ ] Failure paths and authorization are exercised.
- [ ] No secret, no unjustified dependency, no unrelated change.
- [ ] Undo procedure is defined in A4.
- [ ] Decisions recorded; docs consistent with behavior.
- [ ] Stack delta from the adapter satisfied: [`adapters/stack/node-typescript.md`](../../adapters/stack/node-typescript.md).

## Gate G1 checklist

- [x] Every AC is observable and has a verification method.
- [x] Every NFR is numeric or explicitly waived with a reason.
- [x] Authorization matrix is complete for all actors and operations.
- [x] Data lifecycle covers deletion and retention.
- [x] Blocking questions: **zero**.
- [x] Out of scope is non-empty.
