# Problem brief (A1)

> Station S0 · Gate G0 · Keep this under one page.

| Field | Value |
| --- | --- |
| ID / title | 0004 — Automated config-status check: keep gate declarations honest |
| Owner | Siergus |
| Date | 2026-10-27 |
| Risk tier | T2 — the slice carries the v0.3.0 release cut, which edits protected `factory.config.json` |
| Version | 1 |
| Links | [Spec](A2-spec.md) · [Slice plan](A4-slice-plan.md) · Origin: FU-1 in [0003 A4 v4](../0003-fast-gate-debt/A4-slice-plan.md) |

## Problem

`factory.config.json` gate statuses are declarations, not observations: nothing fails when a
gate is marked `wired` but its wrapper or lane row is gone, or when a status is flipped to
`wired` without any wiring behind it. Slice 0003's A4 v3 promised an automated AC-7 check in
`test/config.test.mjs`; what shipped was an import reorder. Today the only guard is human
review, the exact hazard AC-7 was written to prevent. The same class of drift already
happened once: AGENTS.md named slice 0002 as active for a day after the pointer moved.

## Who is affected

The repository owner and any agent working here. They trust `status`/`smokeTested` fields to
decide which gates still need manual review; a stale declaration silently weakens
verification without any gate failing.

## Current workaround and why it is insufficient

The workaround is "the verifier re-checks statuses by hand each slice" (0003 A5, AC-7 note).
It is insufficient because it is per-slice labor, produces no reusable evidence, and is
skipped exactly when a diff looks boring.

## Outcome

| Field | Value |
| --- | --- |
| Metric | Automated assertions pinning gate statuses to wiring (in `test/config.test.mjs`) |
| Baseline | 0 |
| Target | A drift in either direction — a `wired` status without wiring, or wiring without a `wired` status — fails `npm test` naming the gate; `factoryVersion` drift from `CHANGELOG.md` fails the same way |
| Horizon | End of this slice |
| Measurement method | Break-and-restore smokes recorded in A5 |
| What result would prove us wrong | A gate is flipped to `wired` (or a wrapper deleted) and `npm test` still exits 0 |

## Non-goals

- Rewriting the lane or the wrappers (`scripts/ci/**` unchanged unless a smoke needs a
  temporary edit that is restored before commit).
- Verifying `manual`/`partial`/`n/a` gates — only `wired` claims are pinned; the
  human-review path stays human.
- Deep/release-lane gates: they have no wiring today; the check covers any future `wired`
  flip automatically because the gate set is compared exhaustively.
- The SAST literal-argument coverage decision (FU-2, next slice).

## Constraints

- The check must run inside `npm test` (node --test, no new dependency, no network).
- The release cut (v0.3.0 in `CHANGELOG.md`, `factoryVersion`, `activeSlice` pointer) rides
  in this slice because the pointer must move to a slice whose A4 exists — splitting it
  would leave the pointer naming a slice with no plan.

## Assumptions and open questions

| # | Statement | How it will be tested | Blocking? |
| --- | --- | --- | --- |
| 1 | Every gate the lane actually runs is declared `wired`, and every `wired` gate has an invocable wrapper or lane row | The AC-1 set comparison, both directions | No |
| 2 | A hand-maintained expectations table in the test is the right mapping layer (port names like `format.check` do not map to filenames mechanically) | Review in A2/G1; the table is data, adding a gate is a one-line edit | No |
| 3 | `factoryVersion` and the newest released `CHANGELOG.md` section should always agree | AC-7 assertion; break by editing one side | No |

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
