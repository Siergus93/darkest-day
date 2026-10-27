# Problem brief (A1)

> Station S0 · Gate G0 · Keep this under one page.

| Field | Value |
| --- | --- |
| ID / title | 0008 — File the first A8 and make fresh-context verification a recorded, checkable step |
| Owner | Siergus |
| Date | 2026-10-27 |
| Risk tier | T2 — the `activeSlice` pointer move touches protected `factory.config.json` |
| Version | 1 |
| Links | [A8](../0001-enforce-phase-0/A8-learning-review.md) (the artifact this slice files) · Roadmap: [docs/backlog.md](../../docs/backlog.md) |

## Problem

The factory's most valuable verification step — fresh-context verification, the only
step that has ever caught a shipped-but-wrong claim (slice 0005) — exists purely as
prose. Nothing in the PR template, the config tests, or any gate requires it, so the
next slice can merge without it and nothing goes red. At the same time, the A8 cadence
is overdue: seven slices have run and none has had a learning review, so the
factory's own scorecard (rework rate, escaped defects, lead time) has never been
computed from data.

## Who is affected

The owner and every future agent slice: a merge without fresh-context verification
re-opens the exact failure mode slice 0005 demonstrated (a claim that passes its own
author's context but not a fresh one). The A8 cadence debt means factory-level
decisions (autonomy increases, gate changes) are being made without the review the
model prescribes.

## Current workaround and why it is insufficient

The PR template asks for an evidence pack and the standing pattern says "fresh-context
verification pending" — a convention. Conventions degrade under time pressure; every
other check the factory relies on is machine-checked. The A8 is similar: the template
exists, no slice has ever been asked to produce one.

## Outcome

| Field | Value |
| --- | --- |
| Metric | Slices whose merged A5 carries a recorded fresh-context verification verdict |
| Baseline | 0 of 7 (recorded nowhere) |
| Target | The active slice's A5 cannot pass the config test without the field; the PR template requires it; the trial runs three slices (per the A8's proposed change) |
| Horizon | End of this slice for the mechanics; the three-slice trial verdict at slice 0010's A8 |
| Measurement method | Config test output; PR template diff; A8 re-review at 0010 |
| What result would prove us wrong | The check passes A5s that do not actually contain a verdict (false green), or the trial shows the field degrades into a rubber stamp |

## Non-goals

- Retroactive verification of slices 0001–0007 (their evidence is merged; the A8's
  rework table already attributes their outcomes).
- Automating the fresh-context verification itself (that would defeat the purpose:
  it must be a context that did not write the change).
- Any change to the release lane or the product CLI.

## Constraints

- The check must fail closed: a missing field is a failing test, not a warning.
- Presence-only enforcement at merge time ("pending" allowed while the PR is open,
  verdict required in the A5 before merge) — the human reviewer owns the verdict's
  quality; the machine owns its existence.
- No new dependency; data-only config edit.

## Assumptions and open questions

| # | Statement | How it will be tested | Blocking? |
| --- | --- | --- | --- |
| 1 | Presence-checking the A5 field is worth its false-comfort risk (an unfilled-but-present field) | The PR reviewer refuses unfilled fields; the A8 trial measures whether the verdict content stayed real | No |

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
