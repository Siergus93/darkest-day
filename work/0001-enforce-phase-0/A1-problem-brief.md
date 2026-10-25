# Problem brief (A1)

| Field | Value |
| --- | --- |
| ID / title | 0001 — Enforce the Phase 0 gates |
| Owner | Siergus |
| Date | 2026-10-23 |
| Risk tier | T2 — escalated by `scripts/ci/**`, `.github/workflows/**`, `factory.config.json`, and `adapters/**` |
| Version | 1 |
| Links | [Spec](A2-spec.md) · [Slice plan](A4-slice-plan.md) · [ADR-0001](../../docs/decisions/ADR-0001-tooling-stack.md) |

## Problem

The factory exists as a complete operating model, but none of its gates can fail. A claim
that "the build is clean" or "the tests pass" is therefore unfalsifiable: there is no
command, no output, and no record. The model's central promise — evidence over claims — is
currently prose about prose.

## Who is affected

The repository owner and any agent working in this repository. They experience the problem
on every change: verification is manual, ad hoc, and inconsistent, so a regression can only
be found by reading carefully. The cost is rework at S5 and a rising chance that a gate is
declared passed without evidence.

## Current workaround and why it is insufficient

Read the docs, run whatever command seems relevant, and trust the summary. This is
insufficient because:

- there is no canonical command, so two runs are not comparable;
- there is no persistent evidence, so a reviewer cannot re-check the claim;
- there is no failure demonstration, so a green result cannot be distinguished from a
  disconnected check.

## Outcome

| Field | Value |
| --- | --- |
| Metric | Number of Phase 0 blocking gates wired and observed failing at least once |
| Baseline | 0 of 3 (clean build, fast tests, secret scan) |
| Target | 3 of 3, plus blast radius and tier escalation observed failing |
| Horizon | End of this slice (2026-10-23) |
| Measurement method | Adapter smoke-test record, with captured failure text and exit codes, linked from A5 |
| What result would prove us wrong | Any wired gate stays green when its deliberate violation is introduced, or a correct tree fails the fast lane |

## Non-goals

- Wiring the full gate catalog; format, lint, and SAST remain manual exceptions.
- Proving the GitHub Actions workflow on a remote runner (manual verification, AC-9).
- Choosing or binding the eventual product stack.
- Scanning git history for secrets.
- Building deep or release lanes.
- Deleting or rewriting the model to fit the tooling.

## Constraints

- Node.js 24 and npm 11 are available; Python is not installed.
- The workspace is not currently a git repository, so local blast-radius checks must accept
  an explicit changed-path list; CI requires git.
- One human owner. Agents may implement at L2 but may not approve their own T2 verification.
- No deployment target and no runtime data, so G5b–G5f and G6–G7 are not applicable yet.
- The fast lane must finish well inside 10 minutes.

## Assumptions and open questions

| # | Statement | How it will be tested | Blocking? |
| --- | --- | --- | --- |
| 1 | Glob matching and tier escalation are the highest-risk logic and can be unit-tested without infrastructure | `test/tiers.test.mjs` covering depth, separators, and escalations | No |
| 2 | A repository-owned secret ruleset is adequate for Phase 0 if its limits are recorded | Smoke test with a fake AWS key; exceptions recorded in the adapter | No |
| 3 | The GitHub Actions workflow can be written correctly before it is run remotely | Review against the delivery adapter guardrails; first PR as manual verification (AC-9) | No |
| 4 | A type-checked TypeScript module plus ESM scripts is simpler than a full build system | Build and fast lane run in seconds; no bundler | No |

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
