# Problem brief (A1)

> Station S0 · Gate G0 · Keep this under one page.

| Field | Value |
| --- | --- |
| ID / title | 0003 — Close the fast-gate debt: format, lint, SAST, audit, and secret history |
| Owner | Siergus |
| Date | 2026-10-26 |
| Risk tier | T2 — escalated by `scripts/ci/**`, `.github/workflows/**`, `factory.config.json`, and `adapters/**` |
| Version | 2 (assumptions updated by the environment probe; see ADR-0004) |
| Links | [Spec](A2-spec.md) · [Slice plan](A4-slice-plan.md) · [ADR-0003](../../docs/decisions/ADR-0003-gate-tools.md) · [ADR-0004](../../docs/decisions/ADR-0004-sast-and-history-implementation.md) |

## Problem

Three fast-lane gates report `PARTIAL` on every run because their checks were never wired:
`G4b` runs only the type check while format, lint, and SAST are "adapter exceptions";
`G4e` treats `npm audit` as advisory without any observed failure; and `G4d` scans only the
working tree, so a credential merged into git history is never seen. Every run therefore
reports a knowingly incomplete verdict, and ten waiver-with-expiry entries in the 0002 A5
exist only because these checks are absent.

## Who is affected

The repository owner and any agent working here. They run the fast lane for every change and
receive a verdict they know is partially incomplete. The cost is duplicated human review
(every change needs a "manual review against adapter conventions" step that no tool evidence
backs), the risk of an unformatted/linted/SAST-visible defect escaping to review, and a
credential that survives in history forever if the working-tree-only scan misses it.

## Current workaround and why it is insufficient

The workaround is "manual review against the adapter conventions", declared per waiver with
an owner Siergus expiry 2026-12-31. It is insufficient because it is unenforceable: it
depends on a person remembering to check what the tool would have checked, it produces no
reproducible evidence, and it does not scale to a second contributor or a second agent.

## Outcome

| Field | Value |
| --- | --- |
| Metric | Fast-lane gate summary rows that are neither PASS nor n/a |
| Baseline | 2 (`G4b PARTIAL`, `G4e PARTIAL`) plus `G4d`'s uncovered history |
| Target | 0; `G4d` additionally covers history |
| Horizon | End of this slice |
| Measurement method | Gate summary of `npm run fast -- --base main`; smoke records in A5 |
| What result would prove us wrong | A gate is marked wired but an injected defect still passes the lane |

## Non-goals

- Wiring the deep lane's remaining gates (contract, boundary, migration, perf) — those stay
  `n/a`/unwired until a product surface exists.
- Replacing the link-check or the blast-radius logic.
- Enforcing `npm audit` failure modes beyond exit codes from npm itself.
- Choosing tools for a future stack adapter; this slice binds only the Node stack.
- Any product code or runtime capability.

## Constraints

- Node.js 24, npm 11, git; GitHub Actions `ubuntu-24.04` and local Windows must both work.
- New dev dependencies are allowed for the tools themselves and must be justified and
  pinned by the lockfile; package.json/lockfile changes are part of this slice's radius.
- The fast lane must stay under its 10-minute budget (currently ~15 s locally, ~9–15 s in CI).
- Protected paths force T2; `activeSlice` must move to this slice before implementation.

## Assumptions and open questions

| # | Statement | How it will be tested | Blocking? |
| --- | --- | --- | --- |
| 1 | Biome (format+lint, one binary) and the SDL security plugin (SAST, one binary) can run on Node 24, Windows and Linux | Install, run on the current tree; verify Windows paths and exit codes | No |
| 2 | Each tool, run in isolation, fails with a file/line message on an injected defect | Break-and-restore smoke per tool, recorded in A5 | No |
| 3 | the repo-owned history scanner is a single binary that scans full history without network access at runtime | Run against the repo; inject a fake key into a scratch commit, observe the report | No |
| 4 | `npm audit --audit-level=high` exit code 1 on a vulnerable lockfile | Fixture lockfile with a known-vulnerable version range | No |

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
