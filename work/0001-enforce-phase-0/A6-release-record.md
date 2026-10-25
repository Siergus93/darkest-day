# Release record (A6)

> Station S6 · Gate G6 · What shipped, where, and how to reverse it. Generated from the
> pipeline where possible; hand-written records drift.

| Field | Value |
| --- | --- |
| Release ID | `factory-v0.2.0` |
| Slices included | 0001 — Enforce the Phase 0 gates |
| Artifact version / digest | `0.2.0` in `package.json`; git commit `4549e6f` |
| Commit | `4549e6f` (squash merge of PR #1) |
| Tier (highest included) | T2 — escalated by protected paths |
| Version | 1 |
| Release owner | Siergus |
| Date | 2026-10-25 |

## Environments

| Environment | Deployed at | By | Verification result |
| --- | --- | --- | --- |
| Local (Windows, Node 24.14) | 2026-10-25 | Siergus | `node scripts/ci/fast.mjs --base main` exit 0; 30/30 tests |
| GitHub Actions `ubuntu-24.04` | 2026-10-25 | Siergus | PR #1: green, deliberate red, revert green; `main` push run 40240114374 green |
| Staging | — | — | not applicable: no deployable artifact |
| Production | — | — | not applicable: no runtime |

## Changes

| Type | Description | Reference |
| --- | --- | --- |
| Behavior | One fast-lane command runs build, type check, tests, secret scan, link check, dependency inventory, and blast radius / tier escalation | `scripts/ci/fast.mjs` |
| Contract / API | `factory.config.json` schema v1; CLI `--slice`, `--base`, `--changed`; exit 0/1 | A2 § Design constraints |
| Schema / data | none | — |
| Configuration | `.nvmrc` Node 24; required status check `fast lane` on `main` | `factory.config.json`; repo ruleset |
| Dependencies | `typescript@^7.0.2`, development only | `package-lock.json` |

## Configuration and secrets

- Config keys added or changed: none at release; policy lives in `factory.config.json`.
- Secret sources (names only, never values): none. The workflow receives `contents: read` only.
- Environment differences: none; the same Node script runs locally and in CI.
- Validation performed: manifest validation, secret scan, link check, blast radius.

## Migrations

| Migration | Order | Forward-compatible | Reversible | Tested against previous version |
| --- | --- | --- | --- | --- |
| none | — | — | — | — |

## Feature flags

| Flag | Default | Owner | Removal date | Behavior when off |
| --- | --- | --- | --- | --- |
| none | — | — | — | — |

## Rollout plan

| Step | Scope | Observation window | Signal to proceed | Signal to stop |
| --- | --- | --- | --- | --- |
| 1 | Merge PR #1 to `main` | one run | `fast lane` green on `main` (run 40240114374) | any gate red |

## Rollback

| Field | Value |
| --- | --- |
| Method | Revert `4549e6f` through a PR; or disable `.github/workflows/fast.yml` |
| Time to execute | under 10 minutes |
| Last rehearsal | not rehearsed; there is no runtime or data to restore |
| Data implications | none |
| Known limits | Reverting removes the gate spine as well as the change. `main` is protected, so the revert must itself pass the lane it is removing; the emergency path is to remove the required check, revert, and re-add it. |

## Post-deploy verification

| Check | Result | Evidence |
| --- | --- | --- |
| Critical journey | pass | PR #1 green on `14b00ff`, `c261399`, `cd63fb8`; `main` push green |
| Error rate vs baseline | n/a | no runtime |
| Latency vs baseline | pass | fast lane 1.1 s–1.6 s in CI against a 600 s budget |
| New alerts firing | n/a | no alerts |
| Logs free of sensitive data | pass | the secret scanner reports rule and location, never the value |

## Observability links

- Dashboard: none; GitHub Actions is the surface.
- Alerts: none; a red `fast lane` check is the signal.
- Runbook: `.github/workflows/fast.yml` (one job) and A5.
- Trace query: not applicable.
- Evidence retention: 30-day CI artifact; A5 is permanent, the artifact is not.

## Approvals

| Gate | Approved by | Date | Notes |
| --- | --- | --- | --- |
| G6 | Siergus | 2026-10-25 | merge `4549e6f`; human signature recorded in A5 |
| Production (T3 only) | — | — | not applicable |

## Outstanding work

Ordered by what unblocks the most. None of these reopens slice 0001; each is a new slice
(A1→A5) or a repository setting. This list is the return point.

| ID | Item | Why it matters | Where | When |
| --- | --- | --- | --- | --- |
| O1 | Fix CODEOWNERS: `@Siergus` is an unknown owner; the account is `@Siergus93` | GitHub reports five "Unknown owner" errors, so review requests are never routed and the protected-path review rule is silently inert | `.github/CODEOWNERS` (T2) | Now |
| O2 | Harden the `main` ruleset: require a pull request, block force pushes, restrict deletions | Only `required_status_checks` is active, so a direct push or force push bypasses the lane; AC-9's "blocks" currently holds for PRs only | repository settings | Now |
| O3 | Enable GitHub security: secret scanning, push protection, Dependabot security updates, validity checks | All four report `disabled`, although they cost nothing on a public repository | repository settings | Now |
| O4 | Wire G4b format, lint, and SAST, and observe each failing | The only Phase 0 gate still carried as a manual exception; expires 2026-12-31 | new slice; `scripts/ci/**`, `adapters/**`, `factory.config.json` (T2) | Next |
| O5 | Make G4e blocking and add a vulnerable-dependency fixture | `npm audit` stays advisory until it has been seen failing; expires 2026-12-31 | new slice; `scripts/ci/**` (T2) | Next |
| O6 | Add the G4d history scan | The scanner covers the working tree only; a credential deleted from a file still lives in history | new slice; deep lane | Next |
| O7 | Fix the local `--base` blind spot | `gitChangedPaths` diffs `<base>...HEAD`, so uncommitted tracked edits are invisible to a local run. Reproduced 2026-10-25: an A5 edit was not counted | `scripts/ci/lib/blast-radius.mjs` and its test (T2) | Next |
| O8 | Add git integration tests for deletions, renames, and the empty-base fallback | F4 and F14 are code-confirmed only; git now exists, so they can finally be exercised | `test/blast-radius.test.mjs` (T2) | Next |
| O9 | Reconcile the 49-path review budget with reality | A4 and A5 cite a 49-file diff, but the initial commit contains 59 paths and history now starts at `e4e22d2`; correct this the next time the artifacts are touched | A4 / A5 (T0 docs) | Next |
| O10 | Decide on a LICENSE | A public repository with no license is viewable and forkable, not reusable; adding one is a root path outside the A4 radius | new slice | Later |
| O11 | Decide on the public commit email | `sirrotto@gmail.com` is permanent in history and in forks; rewriting it now would invalidate the SHAs recorded in A5 | decision only | Later |
| O12 | Decide the secret-scanning tool | The repository-owned ruleset can miss credential classes; replacing it is a stack decision and needs an ADR | ADR plus adapter | Later |
| O13 | Write A8 for slice 0001 | Horizon was 2026-10-23 and has passed. Metric: 3/3 Phase 0 gates wired and observed failing; actual: met, plus blast radius and tier escalation | `work/0001-enforce-phase-0/A8-learning-review.md` | Now |
| O14 | Run the first real T1 slice through S0–S8 | Phase 1 of adoption, and the factory's next milestone; it needs a product problem brief from the owner | `work/0002-*` | Next milestone |

O1–O3 are cheap and decide whether the gate is real or decorative. O14 is the actual next bet.
