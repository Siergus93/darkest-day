# Problem brief (A1)

> Station S0 · Gate G0 · Keep this under one page.

| Field | Value |
| --- | --- |
| ID / title | 0005 — SAST coverage: literal-argument command execution |
| Owner | Siergus |
| Date | 2026-10-27 |
| Risk tier | T2 — the likely fix surface is `eslint.config.mjs` and `scripts/ci/**` (protected); the release cut rides with the `activeSlice` pointer |
| Version | 1 |
| Links | [Spec](A2-spec.md) · [Slice plan](A4-slice-plan.md) · [ADR-0004](../../docs/decisions/ADR-0004-sast-and-history-implementation.md) (amendment rider points here) |

## Problem

The SAST gate declares itself wired, but its coverage does not fully match the hazard it is
named against: `security/detect-child-process` fires only on non-literal command first
arguments, verified in slice 0003's smoke 3 — an injected `exec("rm -rf …")` with a literal
argument sails through every gate as PASS. A one-line `child_process.exec("curl … | bash")`
in any committed file is invisible to the gate whose row says "security rule pack: clean".
ADR-0004's amendment rider records that "SAST wired" does not mean literal coverage, but no
decision on whether to widen or to formally own that boundary has been made.

## Who is affected

Anyone whose changes the fast lane verifies, who relies on a green SAST row as evidence.
The gate underreports exactly the class of defect that is easiest to commit accidentally
(templated vs literal is invisible to a reader trusting the PASS row).

## Current workaround and why it is insufficient

The workaround is the ADR-0004 rider: a human note that the rule covers non-literal args
only. It is insufficient because nothing requires a benefactor to read the rider; the gate
row itself continues to say PASS without qualification.

## Outcome

| Field | Value |
| --- | --- |
| Metric | Verdict of the lane on an injected literal-argument `child_process.exec("…")` |
| Baseline | PASS (invisible) |
| Target | Fail with a rule id + file:line — via a widened rule — or a decided, *pinned* boundary: the gate note and the SAST scope note state the coverage in writing and the factory-version changelog records the decision |
| Horizon | End of this slice |
| Measurement method | Break-and-restore smoke on the injected fixture, recorded in A5 |
| What result would prove us wrong | A literal-arg injection still passes while the gate row claims unqualified coverage |

## Non-goals

- Rewriting the secrets/history scans or the audit gate.
- Covering dynamic command construction beyond what the rule pack can express on Windows
  and Linux (the 0003 ADR already picked the tool family; only its coverage changes).
- Blocking `spawn`/`spawnSync` with argument arrays — the repo's only current
  `child_process` usage (`lib/engines.mjs`, `lib/run.mjs`, `lib/secrets-history.mjs`)
  is arg-array based and legitimate; a rule that broke it would need an allowlist that
  weakens the gate.
- The FU-3/FU-4 hardening items (kept in [`docs/backlog.md`](../../docs/backlog.md));
  FU-5 rides this slice's release cut (package.json version joins the coherence chain).

## Constraints

- Pre-existing violations must be probed **before** any rule goes blocking (the 0003
  pattern); today the tree has zero `exec`-family usage, so the widened rule should
  observe a clean tree first run.
- Fast lane budget unchanged (the rule pack already runs; widening adds no second tool).
- Widening ADR-0004 means an amendment or a superseding record, never editing the ADR.

## Assumptions and open questions

| # | Statement | How it will be tested | Blocking? |
| --- | --- | --- | --- |
| 1 | A rule (stock plugin, core rule, or a small local rule) can distinguish literal command execution without exploding on the repo's spawn usage | Probe the candidates against the tree and against fixtures | No |
| 2 | Deciding "widen" is better than "record the boundary" because the hazard (literal injection) is the same hazard as the current rule's, just a different shape | G1 deliberation with the probe results | No |

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
