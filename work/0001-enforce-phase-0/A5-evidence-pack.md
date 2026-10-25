# Evidence pack (A5)

| Field | Value |
| --- | --- |
| Slice | 0001 — Enforce the Phase 0 gates |
| Spec / slice plan | [A2](A2-spec.md) v2 / [A4](A4-slice-plan.md) v3 |
| Tier | T2 — escalated by protected paths |
| Artifact versions verified | A2 v2, A4 v3 |
| Commit / artifact | PR #1 on branch `ci/ac-9-smoke`; base `e4e22d2` on `main`; evidence observed at head `c261399` (the A5 update itself follows on the same branch) |
| Date | 2026-10-23 |
| Author | OpenCode agent (Big Pickle) |
| Verifier | Fresh-context verifier subagent; third pass returned PASS for local scope (F15 and N1–N5 resolved; AC-9 pending manual remote verification). Human sign-off pending at T2+. |

## Gate results

| Gate | Status | Evidence | Command / location |
| --- | --- | --- | --- |
| G0 problem brief | passed | A1 states the problem, a falsifiable metric, non-goals, tier, and owner | [A1](A1-problem-brief.md) |
| G1 acceptance criteria | passed | Ten ACs, each with a verification method; blocking questions zero | [A2](A2-spec.md) |
| G2 design | passed | Boundaries, contracts, failure modes, threats, and ADRs recorded | [A2](A2-spec.md) § Design constraints; [ADR-0001](../../docs/decisions/ADR-0001-tooling-stack.md), [ADR-0002](../../docs/decisions/ADR-0002-artifacts-and-manifest.md) |
| G3 slice plan | passed | A4 v3 declares T2, a backticked radius, an executable undo, and a review budget; radius check exits 0 on the 49-path diff | [A4](A4-slice-plan.md); `node scripts/ci/blast-radius.mjs --slice work/0001-enforce-phase-0 --changed "<49 paths>"` |
| G4a clean build | passed | `npm run build` exit 0; an injected type error made the same command exit 1 with `TS2322` at `src/tiers.ts(147,7)` | `npm run build` |
| G4b format + lint + type + static | partial | Type check passes through the build; format, lint, and SAST are manual exceptions with owner and expiry | `npm run build`; [adapter exceptions](../../adapters/stack/node-typescript.md) |
| G4c fast tests | passed | 30 passed, 0 failed, 210.3ms; a deliberately wrong expectation made it 29 passed, 1 failed, exit 1 | `npm test` |
| G4d secret scan | passed | Clean tree: 0 findings; a fake AWS key produced 1 finding, exit 1, and the value was not printed | `node scripts/ci/secrets.mjs` |
| G4e dependency policy | partial | Lockfile inventory readable; `npm audit` reports no high/critical advisories. The audit stays advisory until it is observed failing, so this gate is not claimed as a full pass | `npm ls --all --json`; `npm audit --audit-level=high --json` |
| G4f blast radius | passed | 49 changed paths inside the A4 radius; `assets/logo.png` was rejected as outside it; a temporary T1 plan touching `scripts/ci/fast.mjs` was escalated to T2 and rejected for a missing downgrade reason | `node scripts/ci/blast-radius.mjs`; `test/blast-radius.test.mjs`; `test/tiers.test.mjs` |
| G5a AC verification | passed | Every AC has a result below; AC-9 is manual with an owner and expiry | This table |
| G5b contracts | n/a | No published interface yet | — |
| G5c authorization | n/a | No runtime actors or data | — |
| G5d migration compatibility | n/a | No schema or data store | — |
| G5e boundary failure | n/a | No external boundary in the local lane | — |
| G5f performance | n/a | No hot path yet; the fast lane has a wall-clock budget and is enforced to pass within 600s; consecutive runs measured 4.2s and 4.2s | Gate summary |
| G5g tests can fail | passed | Type-error and wrong-assertion breaks were both caught, then restored | [Adapter smoke-test record](../../adapters/stack/node-typescript.md) |
| G5h flaky budget | n/a | No journey tier | — |

## Acceptance criteria evidence

| AC | Criterion (verbatim) | Result | Evidence | Would a wrong implementation fail this? |
| --- | --- | --- | --- | --- |
| AC-1 | The fast lane passes on a conforming tree | pass | Two consecutive runs exited 0 in 4.2s and 4.2s with identical PASS verdicts | yes |
| AC-2 | A type error blocks the lane | pass | `src/tiers.ts(147,7): error TS2322: Type 'string' is not assignable to type 'number'.`; `npm run build` exit 1; the lane reported `G4a FAIL`, `G4b FAIL`, and `G4c`/`G4f` as "not run"; restored file built with exit 0 | yes |
| AC-3 | A failing test blocks the lane | pass | 29 passed, 1 failed, exit 1; `AssertionError [ERR_ASSERTION]: true !== false` at `test/tiers.test.mjs:19`; restored file passed 30/30 | yes |
| AC-4 | A credential blocks the lane without leaking it | pass | `smoke-secret.txt:1 [aws-access-key] AWS access key id`, exit 1; the key value was not printed; the same key with `secret-scan:allow` still failed; file removed and scan returned exit 0 | yes |
| AC-5 | A change outside the declared radius blocks the lane | pass | `outside declared radius: assets/logo.png`, exit 1 | yes |
| AC-6 | A protected path escalates the tier | pass | Unit tests plus a temporary T1 plan: `scripts/ci/fast.mjs` escalated T1 → required T2 and the missing downgrade reason was rejected, exit 1 | yes |
| AC-7 | The manifest is validated before gates | pass | `test/config.test.mjs`: a manifest without an owner is rejected with a named problem and the remaining gates do not run | yes |
| AC-8 | Documentation links resolve | pass | A temporary file with a missing path and a missing fragment produced 2 findings and exit 1; after deletion the checker exited 0. Unit tests cover inline links, reference definitions, fenced-code exclusion, and fragments | yes |
| AC-9 | CI runs the same lane and blocks on failure | partial (manual) | PR #1 runs the lane in GitHub Actions: green on `14b00ff` (run 40234548217), red on a deliberate `src/tiers.ts` type error at `419f481` (run 40235462464: `G4a`/`G4b` FAIL, `G4c`/`G4f` not run), green again after the revert at `c261399` (run 40235510817). `main` reports `protected=false`, so the check is not required and a red run does not yet block merge. Owner Siergus; due 2026-11-30 | yes |
| AC-10 | Every blocking gate has been seen failing | pass | The adapter smoke-test record contains the violation, observed message, restore, and date for `build.clean`, `type.check`, `test.isolated`, `secrets.scan`, and `vcs.diff` | yes |

## Commands run

| Command | Exit code | Summary |
| --- | --- | --- |
| `npm ci` | 0 | Installed the pinned toolchain: 2 packages, 0 vulnerabilities |
| `npm run build` | 0 | TypeScript emit, no diagnostics |
| `npm test` | 0 | 30 passed, 0 failed, 210.3177ms |
| `npm audit --audit-level=high --json` | 0 | No high or critical advisories |
| `node scripts/ci/links.mjs` (clean tree) | 0 | All relative Markdown links resolve |
| `node scripts/ci/links.mjs` (with `smoke-links.md`) | 1 | 2 broken links: a missing file and a missing fragment |
| `node scripts/ci/secrets.mjs` (clean tree) | 0 | No credential patterns found |
| `node scripts/ci/secrets.mjs` (with fake AWS key) | 1 | `smoke-secret.txt:1 [aws-access-key]`; value redacted; file removed |
| `node scripts/ci/secrets.mjs` (fake AWS key plus `secret-scan:allow`) | 1 | The marker no longer suppresses the finding; the bypass is closed |
| `node scripts/ci/blast-radius.mjs --changed "assets/logo.png"` | 1 | `outside declared radius: assets/logo.png` |
| `node scripts/ci/blast-radius.mjs --slice work/9999-smoke --changed "scripts/ci/fast.mjs"` | 1 | T1 → required T2 escalation; downgrade without a reason rejected |
| `node scripts/ci/blast-radius.mjs --changed ""` | 1 | Empty change set rejected with an actionable message |
| `node scripts/ci/fast.mjs --changed ""` | 1 | Empty change set rejected before any gate runs |
| `node scripts/ci/fast.mjs --changed "<49 slice paths>"` (run 1) | 0 | All gates pass in 4.2s; G4b and G4e show `PARTIAL` for the documented exceptions |
| `node scripts/ci/fast.mjs --changed "<49 slice paths>"` (run 2) | 0 | Identical verdict in 4.2s |
| `node scripts/ci/fast.mjs --changed "<49 slice paths>"` (injected type error) | 1 | `G4a`/`G4b` FAIL; `G4c`/`G4f` not run; `LINKS`, `G4d`, and `G4e` still ran |
| `npm run build` (with `smokeTypeError`) | 1 | `src/tiers.ts(147,7): error TS2322: Type 'string' is not assignable to type 'number'.` |
| `npm test` (with wrong expectation) | 1 | 29 passed, 1 failed; `AssertionError: true !== false`; restored |
| GitHub Actions `fast / fast lane` (PR #1, `14b00ff`, green) | 0 | `G4a PASS`; `G4c` 30 passed, 0 failed; `G4f PASS` (1 changed path); run 40234548217 |
| GitHub Actions `fast / fast lane` (PR #1, `419f481`, injected type error) | 1 | `G4a`/`G4b` FAIL; `G4c`/`G4f` not run; `LINKS`/`G4d`/`G4e` still ran; `Fast lane FAILED`; run 40235462464 |
| GitHub Actions `fast / fast lane` (PR #1, `c261399`, revert) | 0 | Same gate summary as the first green run; run 40235510817 |
| Secret history scan | not run | Not implemented; recorded as a gap |
| Vulnerable-dependency fixture | not run | Audit is advisory; promotion requires a smoke test |

The CI runs above produced the following summaries. The text is copied from the job logs so
the record survives the 30-day artifact retention; the run IDs resolve to the same output.

```text
# run 40234548217 — 14b00ff, green
  CONFIG  PASS      factory.config.json is valid
  G4a     PASS      clean build (tsc emit)
  G4b     PARTIAL   type.check passed; format, lint, and SAST are adapter exceptions
  G4c     PASS      30 passed, 0 failed, 226.60382ms
  LINKS   PASS      all inline and reference Markdown links resolve
  G4d     PASS      no credential patterns found in the working tree
  G4e     PARTIAL   inventory readable; npm audit reported no high or critical advisories
  G4f     PASS      Slice work/0001-enforce-phase-0: declared T2, required T2, 1 changed path(s).
Fast lane PASSED in 1.1s (budget 10m).

# run 40235462464 — 419f481, deliberate type error, red
  CONFIG  PASS      factory.config.json is valid
  G4a     FAIL      build failed; see G4a output
  G4b     FAIL      type.check failed through the build
  G4c     FAIL      not run: build failed, so the test result would describe stale output
  LINKS   PASS      all inline and reference Markdown links resolve
  G4d     PASS      no credential patterns found in the working tree
  G4e     PARTIAL   inventory readable; npm audit reported no high or critical advisories
  G4f     FAIL      not run: build failed, so dist/ cannot be trusted
Fast lane FAILED in 0.8s (budget 10m).

# run 40235510817 — c261399, revert, green
  CONFIG  PASS      factory.config.json is valid
  G4a     PASS      clean build (tsc emit)
  G4b     PARTIAL   type.check passed; format, lint, and SAST are adapter exceptions
  G4c     PASS      30 passed, 0 failed, 303.424124ms
  LINKS   PASS      all inline and reference Markdown links resolve
  G4d     PASS      no credential patterns found in the working tree
  G4e     PARTIAL   inventory readable; npm audit reported no high or critical advisories
  G4f     PASS      Slice work/0001-enforce-phase-0: declared T2, required T2, 1 changed path(s).
Fast lane PASSED in 1.6s (budget 10m).
```

### Exact baseline command

The 49-path list is the working-tree diff for this slice. The order is not significant; CI
uses `--base` instead so a human does not supply the list.

```text
node scripts/ci/fast.mjs --changed "src/tiers.ts,test/tiers.test.mjs,test/secrets.test.mjs,test/links.test.mjs,test/blast-radius.test.mjs,test/config.test.mjs,scripts/ci/fast.mjs,scripts/ci/secrets.mjs,scripts/ci/links.mjs,scripts/ci/blast-radius.mjs,scripts/ci/lib/config.mjs,scripts/ci/lib/files.mjs,scripts/ci/lib/links.mjs,scripts/ci/lib/run.mjs,scripts/ci/lib/secrets.mjs,scripts/ci/lib/blast-radius.mjs,.github/workflows/fast.yml,.github/pull_request_template.md,.github/CODEOWNERS,factory.config.json,package.json,package-lock.json,tsconfig.json,.nvmrc,.gitignore,AGENTS.md,CHANGELOG.md,README.md,docs/software-factory/08-artifacts.md,docs/software-factory/README.md,docs/decisions/README.md,docs/decisions/ADR-0001-tooling-stack.md,docs/decisions/ADR-0002-artifacts-and-manifest.md,docs/waivers.md,adapters/ci/github-actions.md,adapters/stack/_template.md,adapters/stack/node-typescript.md,templates/waiver-register.md,templates/problem-brief.md,templates/slice-plan.md,templates/evidence-pack.md,templates/release-record.md,templates/runbook.md,templates/learning-review.md,work/README.md,work/0001-enforce-phase-0/A1-problem-brief.md,work/0001-enforce-phase-0/A2-spec.md,work/0001-enforce-phase-0/A4-slice-plan.md,work/0001-enforce-phase-0/A5-evidence-pack.md"
```

## Test tiers

| Tier | Count | Failed | Skipped | Duration | Notes |
| --- | --- | --- | --- | --- | --- |
| Isolated | 30 | 0 | 0 | 210.3177ms | `node:test`, no external services |
| Boundary | 0 | 0 | 0 | — | None exist |
| Contract | 0 | 0 | 0 | — | None exist |
| Journey | 0 | 0 | 0 | — | None exist |

## Security

| Check | Result | Notes |
| --- | --- | --- |
| Authorization / cross-scope access | n/a | No runtime actors or data |
| Input validation and output encoding | pass | Unknown CLI flags fail; an empty `--changed` list fails; no user input enters a shell; npm arguments are constants |
| Secrets and sensitive logging | pass | Scanner reports rule and location, never the value; no line-level suppression exists |
| Dependency vulnerabilities | advisory | One direct dev dependency; audit clean today; not blocking until observed failing |
| Threat-model items from A2 | pass | Workflow: read-only token, no secrets, `pull_request` (not `pull_request_target`), pinned action SHAs, event values passed via `env`, `pipefail` set |

## Data and migrations

| Check | Result | Notes |
| --- | --- | --- |
| Forward migration | n/a | No schema |
| Previous version with new schema | n/a | No schema |
| Rollback or forward fix | pass | Revert the commit or delete the added files; `dist/` is generated by `npm run build` |
| Concurrency / duplicate request | n/a | No mutable state |

## Performance

| G5f | Target | Measured | Environment | Verdict |
| --- | --- | --- | --- | --- |
| Fast lane wall-clock budget | ≤ 10 minutes (600s) | 4.2s and 4.2s on consecutive runs | Windows, Node 24.14, local SSD | pass |

## Resilience

| Boundary | Failure injected | Observed behavior | Meets A2 |
| --- | --- | --- | --- |
| git | Workspace is not a repository | Blast radius requires `--changed` or `--base`; the error names both options | yes |
| build | Injected type error | `G4a`/`G4b` fail and `G4c`/`G4f` are skipped, so stale `dist/` cannot produce a false test or radius pass | yes |
| change set | Empty `--changed ""` | Fast lane and blast-radius both exit 1 with an actionable message | yes |
| npm audit | Network or advisories unavailable | Advisory line, never a false pass | yes |
| Secret scanner | Binary/oversized file | Skipped without crashing; limitation documented | yes |

## Known gaps and waivers

| Gate | Reason | Compensating control | Owner | Expires |
| --- | --- | --- | --- | --- |
| AC-9 / delivery | The lane runs and fails correctly in CI, but `main` reports `protected=false`, so the `fast lane` check is not required and cannot yet block a merge | PR #1 is the smoke test (runs 40234548217, 40235462464, 40235510817); add a ruleset requiring `fast lane` on `main` | Siergus | 2026-11-30 |
| G4b format/lint/SAST | Tools not selected; no failure evidence yet | Manual review against adapter conventions | Siergus | 2026-12-31 |
| G4d history | Scanner covers the working tree only | Full-history scan scheduled with the deep lane | Siergus | 2026-12-31 |
| G4e advisory | `npm audit` has not been observed failing | Lockfile inventory on every run; advisory line in the summary | Siergus | 2026-12-31 |
| G4f explicit list | A local `--changed` list is trusted and is not a VCS diff | The lane prints the limitation; CI uses `--base`; reviewers check the list against the diff | Siergus | 2026-12-31 |
| G4f radius / tier | Radius and downgrade reason are declared by the author | Config-owned protected paths force escalation; A4 is reviewed separately; downgrade needs a written reason | Siergus | 2026-12-31 |

These are manual fallbacks with owners and expiries, not waivers. No waiver is requested for
G4d or G5c.

## Agent declaration

- Assumptions: the workspace stays non-git for local verification; remote CI is a manual AC;
  the local lane receives an explicit changed-path list, while CI derives it from `--base`.
- Deviations from A4: A2 v1 → v2 removed the line-level secret suppression so G4d cannot be
  bypassed by a marker; A4 v2 → v3 records the review budget as the delivered 49 files (55 was
  the planning estimate). No blast-radius or other behavior change. The post-verifier edits
  correct evidence and gate reporting; they do not add gate behavior outside A4.
- Residual risk: a repository-owned secret ruleset can miss credential classes; the local
  changed-path list and the A4 radius are self-declared; the CI workflow has not run remotely;
  no commit provenance exists until git is initialized. G4d no longer has a line-level bypass.
  The link checker treats a GFM footnote definition as a reference link; no footnotes exist
  today, so this is latent and recorded rather than fixed.
- Commands not run and why: remote workflow (no repository/remote); vulnerable dependency
  fixture (advisory gate, not blocking); history scan (not implemented).
- Open questions: none blocking.
- Post-delivery (2026-10-25): the workspace became a git repository at `e4e22d2`; PR #1
  produced the green, deliberate-red, and revert runs recorded above. AC-9 stays
  `partial (manual)` because `main` reports `protected=false` and the `fast lane` check is not
  required. The assumptions above describe the delivery date, not this later state.

## Review findings

| # | Location | Risk | Condition under which it matters | Resolution |
| --- | --- | --- | --- | --- |
| F1 | `adapters/stack/node-typescript.md`, `factory.config.json`, A5 AC-10 | The smoke-test record was empty and `smokeTested` was false while A5 claimed AC-10 passed | A gate could be marked proven without a failed run | Filled the record with observed violations and messages; set `smokeTested` true only for exercised gates; A5 cites the record. Second pass: resolved |
| F2 | A5 sign-off | The author pre-filled the verifier decision | A blocking defect could be waived by the author at T2 | Replaced with the finding record; human sign-off remains pending. Second pass: resolved |
| F3 | `scripts/ci/fast.mjs`, `scripts/ci/blast-radius.mjs` | An empty `--changed ""` list passed | A broken or empty diff could produce a false radius pass | Both reject an empty list with exit 1; observed |
| F4 | `scripts/ci/lib/blast-radius.mjs` | Deletions and renames were omitted from the diff | A deleted protected file could escape escalation | `--diff-filter=ACMRD --no-renames` plus untracked files; code reviewed; cannot be exercised without git. Partially resolved |
| F5 | `scripts/ci/fast.mjs` | An explicit `--changed` list is trusted and is not a VCS diff | A local pass can be claimed with an incomplete list | Prints the limitation; CI uses `--base`; reviewers compare the list to the diff; recorded as a residual risk. Accepted residual |
| F6 | `A4` / `scripts/ci/lib/blast-radius.mjs` | The radius and tier downgrade are self-declared | A wide radius or unjustified downgrade could hide impact | Config-owned protected paths force escalation; A4 review is separate; downgrade needs a written reason; recorded as a residual risk. Accepted residual |
| F7 | `scripts/ci/fast.mjs` | The summary labelled markdown checks as `G0`/`G1`, which the lane does not execute | A reader could believe the station gates were automated | Removed the fake IDs; the link check is reported as `LINKS` |
| F8 | `scripts/ci/fast.mjs` | `G4e` was reported `PASS` while `npm audit` was only advisory | A vulnerable dependency could appear green | `G4e` is `PARTIAL` with an explicit advisory detail; A5 and config agree |
| F9 | `scripts/ci/fast.mjs` | The fast-lane budget was hardcoded | A config change would not affect enforcement | Budget is read from `lanes.fast.budgetMinutes`; an overrun records `BUDGET FAIL` |
| F10 | `package.json`, `tsconfig.json` | Tests could run against stale `dist/` output | A removed type error could still pass tests | `pretest` builds; `noEmitOnError` is set; build failure skips `G4c`/`G4f`; observed |
| F11 | `scripts/ci/lib/links.mjs` | Only inline links were checked | Reference definitions and fragments could rot | Reference definitions and heading fragments are checked; tests and a temporary broken file exercise both |
| F12 | `scripts/ci/fast.mjs` | Config and radius errors were truncated in the summary | A reviewer could not see the actual cause | Full errors are printed; the summary keeps the first line for scanning |
| F13 | A5 AC-2 | The recorded line number was not reproducible | A reviewer could not reproduce the build failure | Re-observed `src/tiers.ts(147,7)` and updated A5, the adapter record, and the manifest note |
| F14 | `.github/workflows/fast.yml`, `scripts/ci/lib/blast-radius.mjs` | An empty CI base SHA was accepted | A new-branch run could diff against nothing and pass | Empty/zero base falls back to `git diff HEAD`; an empty change set fails; remote run still pending. Partially resolved |
| F15 | `scripts/ci/lib/secrets.mjs`, `scripts/ci/secrets.mjs`, `test/secrets.test.mjs` | The allow-marker bypassed G4d and was effectively a waiver | A contributor could hide a credential | Removed the bypass; a marker no longer suppresses findings; added a regression test and updated the error message; A2 v2 records the rule. Resolved |
| F16 | `tsconfig.json` | `tsc` overwrote `dist/` even when it reported errors | A broken build could leave stale or partial output that later gates trust | `noEmitOnError` and skip-on-build-failure; observed `G4c`/`G4f` not running |
| N1 | `adapters/stack/node-typescript.md` | The adapter said the underlying `tsc` exits 2; the current tree exits 1 | A reviewer would see a stale diagnostic and doubt the record | Corrected the record to exit 1 for both `npm run build` and `tsc -p tsconfig.json` |
| N2 | `scripts/ci/lib/links.mjs` | Findings after a fenced code block pointed at the wrong line | A reviewer would look at the wrong source line | The collector now walks lines in one pass and preserves source line numbers; regression test added |
| N3 | A5 G5f, `factory.config.json` | A5 said `G5f` passed while the manifest said `n/a` | The docs and the automation disagreed | A5 now records `n/a` and keeps the wall-clock measurement under Performance, matching the manifest |
| N4 | `A4-slice-plan.md`, A5 | A4 estimated 55 files; the delivered diff is 49 | A reviewer could not reconcile the review budget | A4 v3 records 49 as the delivered diff and 55 as the planning estimate; A5 states the reconciliation |
| N5 | `scripts/ci/lib/links.mjs`, `scripts/ci/fast.mjs` | Malformed percent-encoding crashed the link checker and aborted the lane | A malformed link would fail without a gate summary | Decode failures are reported as findings; the fast lane catches checker exceptions and records `LINKS FAIL`; regression test added |

## Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Verifier | Fresh-context verifier subagent (third pass) | Re-verification 2026-10-23: local build, 30/30 tests, links, secrets, marker-bypass regression, malformed-link diagnostics, type/test break-and-restore, and the 49-path fast lane reproduce. F15 and N1–N5 resolved; no blocking defect found. AC-9 remains unverified (no git remote or CI run); F4/F14 remain code-confirmed only. Verdict: PASS for local scope, with AC-9 pending manual remote verification | 2026-10-23 |
| Reviewer | Pending | — | — |
| Human (T2+) | Siergus | Reviewed the diff and this pack; AC-9 observed in PR #1 as green, deliberate red, and revert. Requiring `fast lane` on `main` remains open under the AC-9 gap | 2026-10-25 |
