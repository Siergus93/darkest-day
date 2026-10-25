# Spec (A2)

| Field | Value |
| --- | --- |
| ID / title | 0001 — Enforce the Phase 0 gates |
| Problem brief | [A1](A1-problem-brief.md) |
| Tier | T2 (escalated by protected paths) |
| Version | 2 |
| Owner | Siergus |

## Scope

Make the Phase 0 gates executable, reproducible, and capable of failing: clean build, fast
tests, secret scan, plus blast-radius and tier-escalation checks. The gates run through one
repository command locally and through a thin GitHub Actions workflow in CI. The factory
model, its obligations, and its stations do not change.

## Behaviors and acceptance criteria

| AC | Behavior | Acceptance criterion (observable) | Verification method | Status |
| --- | --- | --- | --- | --- |
| AC-1 | The fast lane passes on a conforming tree | `npm run fast -- --changed <declared paths>` exits `0`, prints one line per gate, and shows `PASS` for `G4a`, `G4c`, `G4d`, and `G4f` within 10 minutes | Run the command twice; compare verdicts and elapsed time | planned |
| AC-2 | A type error blocks the lane | Introducing a type error in `src/tiers.ts` makes the same command exit non-zero and name `G4a`/`G4b`; restoring the file makes it pass | Break-and-restore with captured output | planned |
| AC-3 | A failing test blocks the lane | Changing one expected value in `test/tiers.test.mjs` makes the command exit non-zero and name `G4c`; restoring it makes it pass | Break-and-restore with captured output | planned |
| AC-4 | A credential blocks the lane without leaking it | A file containing a fake AWS access key makes the scan exit non-zero, report `file:line` and the rule, and never print the value; deleting the file makes it pass | Break-and-restore with captured output | planned |
| AC-5 | A change outside the declared radius blocks the lane | Passing a changed path that no A4 glob covers makes `G4f` exit non-zero and name the path | `--changed` with an undeclared path | planned |
| AC-6 | A protected path escalates the tier | For declared `T1`, a changed `scripts/ci/fast.mjs` resolves to required `T2`; a downgrade with no written reason is rejected and one with a reason is accepted | Unit tests plus a `--changed scripts/ci/fast.mjs` run | planned |
| AC-7 | The manifest is validated before gates | A manifest without an owner fails with a named problem and does not run the remaining gates | Unit test on a temporary manifest | planned |
| AC-8 | Documentation links resolve | `node scripts/ci/links.mjs` exits `0` and reports every broken relative Markdown link otherwise | Run the command; add a broken link temporarily | planned |
| AC-9 | CI runs the same lane and blocks on failure | A pull request runs the fast workflow; a deliberately broken commit fails the check; a correct commit passes it | Manual: first remote PR, owner Siergus, due 2026-11-30 | pending (manual) |
| AC-10 | Every blocking gate has been seen failing | The adapter smoke-test record contains the deliberate violation, observed failure text, restore, and date for `build.clean`, `type.check`, `test.isolated`, `secrets.scan`, and `vcs.diff` | Review the adapter record linked from A5 | planned |

AC-9 cannot be observed in this workspace because there is no git repository, no remote, and
no workflow run. It is recorded as manual verification with an owner and a due date, not
silently marked passed. The local gate proof does not depend on it.

## Non-functional requirements

| Attribute | Target | Measured how | Applies to |
| --- | --- | --- | --- |
| Latency | Fast lane ≤ 10 minutes | Elapsed time printed by the lane | Every run |
| Determinism | Two consecutive runs on the same tree produce the same verdict | Run twice and compare the summary | Fast lane |
| Offline operation | Build, tests, links, secrets, and radius run without network after `npm ci` | Run with the network unavailable or note the exception | Local gates |
| Portability | Same commands work on Windows and Linux with Node 24 | Local Windows run plus CI `ubuntu-24.04` | Gate scripts |
| Availability | Not required, because no service exists | — | — |
| Data durability | Not required, because no data store exists | — | — |

## Authorization

No runtime actors exist. The only actor is a repository contributor, and the operation is
"run gates". The workflow uses `permissions: contents: read`, does not receive secrets, and
runs `pull_request` (not `pull_request_target`).

| Actor | Operation | Data scope | Allowed | Denied behavior |
| --- | --- | --- | --- | --- |
| Repository contributor | Run the fast lane | Working tree | Yes | — |
| Fork pull request | Run the fast lane in CI | Checked-out code only | Yes, without secrets | No access to repository secrets or write tokens |

## Data lifecycle

No user or runtime data is processed. Build output goes to `dist/`, is ignored by git, and is
deleted by a clean checkout. There is nothing to retain, export, or delete.

## Failure modes

| Dependency or condition | Mode | Expected behavior | User-visible result |
| --- | --- | --- | --- |
| git | Absent or not a repository | Blast radius requires `--changed` or a git workspace | Actionable error naming both options |
| `dist/` | Missing when the radius check runs | Build first | Error: run `npm run build` |
| npm | Missing or offline | Build/test fail; audit becomes advisory | Named failing gate and command |
| GitHub Actions | Unavailable | Local lane still runs | AC-9 stays manual |
| Secret scanner | Large or binary file | File skipped | No crash; limitation documented in the adapter |
| Security advisories | Offline | Audit records advisory, not a false pass | `ADVISORY` line in the summary |

## Edge cases

- Windows path separators and CRLF line endings.
- Untracked files in the git working tree (included in the radius check).
- An all-zero base SHA for a new branch (treated as no base).
- A zero-length or whitespace-only downgrade reason (rejected).
- A glob that matches nothing (the A4 is wrong, not the gate).
- A false-positive secret is fixed by narrowing the rule; there is no line-level suppression.
- Markdown links inside fenced code examples (ignored).

## Out of scope

- Formatting, linting, and SAST automation; manual exceptions with expiry cover them.
- Secret scanning of git history and CI artifacts.
- Deep and release lanes.
- Remote CI proof (manual AC-9).
- A vulnerable-dependency fixture for the advisory audit.
- Mutation testing; the break-and-restore record is the G5g evidence.
- Any product stack choice.

## Assumptions and open questions

| # | Assumption or question | Owner | Blocking? | Resolution |
| --- | --- | --- | --- | --- |
| 1 | A repository ruleset is an acceptable Phase 0 secret scan | Siergus | No | Accepted; limits recorded; replace in Phase 2 |
| 2 | The workflow can be reviewed against the delivery guardrails before its first run | Siergus | No | Accepted; AC-9 manual |
| 3 | TypeScript 7 is stable enough for one module | Siergus | No | Build and tests pass locally |
| 4 | The default review budget can be larger for the bootstrap slice | Siergus | No | Recorded in A4 with rationale |

## Design constraints and boundaries (T2+)

| Component | Owns | May depend on | Must not depend on | Owner |
| --- | --- | --- | --- | --- |
| `src/tiers.ts` | Tier ordering, glob matching, escalation, downgrade validation | Standard library only | File system, environment, CI | Siergus |
| `factory.config.json` | Policy data: tiers, protected paths, lanes, gate status | — | Code, environment | Siergus |
| `scripts/ci/lib/*` | Reading policy, running checks, reporting | `src/tiers.ts` via `dist/`, Node standard library | CI platform APIs | Siergus |
| `scripts/ci/fast.mjs` | Lane composition and verdict | `scripts/ci/lib/*` | Gate logic of its own | Siergus |
| `.github/workflows/*` | Scheduling, environment, evidence upload | Repository scripts | Gate logic, shell pipelines without `pipefail` | Siergus |

- **Contracts and compatibility rule:** `factory.config.json` schema v1 is additive; a
  breaking change bumps `schemaVersion` and requires an ADR. CLI flags are `--slice`,
  `--base`, `--changed`; exit code `0` means pass, `1` means fail or not run. The module API
  is `resolveTier`, `applyDeclaredTier`, and `matchesGlob`.
- **Transaction boundaries / consistency:** not applicable; no mutable shared state.
- **Trust boundaries and threats specific to this change:** CI executes repository code from
  a pull request. Threats are script injection through event expressions, token theft, and
  secret exfiltration. Countered by permissions read-only, no secrets, `pull_request` rather
  than `pull_request_target`, values passed through `env`, pinned action SHAs, and no
  credential printing.
- **Deployment and observability shape:** nothing is deployed. Evidence is stdout captured in
  A5 and a 30-day CI artifact.
- **Migration approach (expand / migrate / contract):** not applicable; new files only.
- **Decisions recorded (A3 links):** [ADR-0001](../../docs/decisions/ADR-0001-tooling-stack.md),
  [ADR-0002](../../docs/decisions/ADR-0002-artifacts-and-manifest.md).

## Definition of Done

- [ ] Every AC has a reproduced result in A5 (AC-9 manual, with owner and expiry).
- [ ] Failure paths and authorization are exercised.
- [ ] No secret, no unjustified dependency, no unrelated change.
- [ ] Undo procedure is defined in A4.
- [ ] Decisions recorded; docs consistent with behavior.
- [ ] Stack delta from the adapter satisfied:
  [`adapters/stack/node-typescript.md`](../../adapters/stack/node-typescript.md).

## Gate G1 checklist

- [x] Every AC is observable and has a verification method.
- [x] Every NFR is numeric or explicitly waived with a reason.
- [x] Authorization matrix is complete for all actors and operations (the runtime matrix is
  empty and stated).
- [x] Data lifecycle covers deletion and retention (not applicable and stated).
- [x] Blocking questions: **zero**.
- [x] Out of scope is non-empty.
