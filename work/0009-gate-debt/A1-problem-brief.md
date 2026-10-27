# Problem brief (A1)

> Station S0 · Gate G0 · Keep this under one page.

| Field | Value |
| --- | --- |
| ID / title | 0009 — Close the verifier-flagged gate debt: pin the lane's lib modules (FU-4), harden the SAST resolver (FU-8) |
| Owner | Siergus |
| Date | 2026-10-27 |
| Risk tier | T2 — `scripts/ci/**` is a protected path |
| Version | 1 |
| Links | [Spec](A2-spec.md) · [Slice plan](A4-slice-plan.md) · [Backlog](../../docs/backlog.md) (FU-4, FU-8) |

## Problem

Two verifier-registered weaknesses remain in the gate machinery, and both concern the
same property: a wired gate's evidence must be able to lie.

1. **FU-4** — the wiring-evidence table pins wrapper files, but the lane's logic lives
   in `scripts/ci/lib/*.mjs`, which the table does not name. Today a renamed or
   rewired lib module is caught only accidentally (the lane crashes on a broken
   import). The factory's evidence chain has an unpinned middle link.
2. **FU-8** — the SAST resolver that identifies exec-family calls (banned
   unconditionally by ADR-0004 v2) has three documented blind spots: constant-folded
   computed member keys (`cp["ex" + "ec"]`), template-literal module specifiers
   (`` await import(`node:child_process`) ``), and multi-hop module rebinding
   (`const r = require; …`). The ban is unconditional, but its detection is not
   complete against obfuscation-shaped code.

## Who is affected

Anyone relying on the gates' verdicts — the owner first. A rewired lib module or an
obfuscated exec call would currently pass evidence that says "verified".

## Current workaround and why it is insufficient

FU-4: the lane fails closed by crashing on a missing import — protection by accident,
not by declaration, and it does not catch a *rewired* wrapper that stops importing the
lib. FU-8: the accepted-risk note in FU-8's backlog row; the class is close to
admission-resistant already, but the three static shapes are coverable and uncovered.

## Outcome

| Field | Value |
| --- | --- |
| Metric | Verifier-flagged actionable backlog items closed; new coverage demonstrated failing on injected shapes |
| Baseline | FU-4, FU-8 open; 17-fixture SAST matrix; no declared wrapper→lib links |
| Target | Every wired gate's wrapper→lib links are declared and machine-checked (a renamed lib fails the config test naming gate + module); the three static obfuscation shapes are rejected by the real rule pack with zero new false positives on sanctioned spawn patterns |
| Horizon | End of this slice |
| Measurement method | Break-and-restore smokes (rename; injected shapes) recorded verbatim in A5; fixture matrix through the real eslint pack |
| What result would prove us wrong | A hardened resolver flags the repo's own sanctioned spawn usage, or the declared lib links pass while a lib is actually rewired away |

## Non-goals

- Runtime-computed member keys (FU-8 accepted edge — not coverable by any AST rule).
- FU-3 (second source of truth for `activeSlice`) and FU-9 (spawn-with-shell) — parked
  with recorded mitigations.
- Any change to the product CLI, release lane, or ADR-0004's decision (detection
  widens; the unconditional ban does not move).

## Constraints

- No new dependency; the resolver stays a local ESLint rule.
- The sanctioned pattern (`spawn`/`spawnSync` with argument arrays, including through
  aliases) must stay clean — the hardening may not introduce false positives.
- Data-only evidence-table edit; no new gate rows.

## Assumptions and open questions

| # | Statement | How it will be tested | Blocking? |
| --- | --- | --- | --- |
| 1 | The alias-chase can be bounded (≤ 5 hops, cycle-safe) without losing real-world shapes | Fixture: alias chains at the bound are caught; deeper chains degrade to the accepted-edge class | No |

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
