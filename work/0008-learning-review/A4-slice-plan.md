# Slice plan (A4)

> Station S3 · Gate G3 · A slice is the smallest change that produces **observable**
> behavior. The tier declared here governs the whole change.

| Field | Value |
| --- | --- |
| ID / title | 0008 — File the first A8 and make fresh-context verification a recorded, checkable step |
| Spec | [A2](A2-spec.md) v1 · Source: [A8](../0001-enforce-phase-0/A8-learning-review.md) (this slice files and implements it) |
| Tier | T2 |
| Tier downgrade reason | n/a |
| Version | 1 |
| Owner | Siergus |
| Target release | none — no version bump rides (0.4.0 is current); the trial verdict lands in slice 0010's A8 |

## Observable outcome

A slice whose A5 lacks a `Fresh-context verification:` record fails the config test
(exit 1, named) before merge; the PR template demands the field; the factory's first
A8 exists and is linked. `activeSlice` points here.

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | `work/0001-enforce-phase-0/A8-learning-review.md` (filed by this slice, drafted in commit `378fe29`), `.github/pull_request_template.md` (field added), `test/config.test.mjs` (one new test), `factory.config.json` (`activeSlice` → this slice; no version change), `AGENTS.md` (active-slice line), `work/README.md` (0007 state + A8 link, 0008 row), `docs/backlog.md` (roadmap row), `work/0008-learning-review/**` | |
| Public contracts | none | No product surface changes. |
| Data / schema | none | — |
| Configuration / secrets | `factory.config.json` `activeSlice` pointer only (protected, declared deliberate) | No secrets. |
| Infrastructure | none — no workflow change; the release lane (v0.4.0 shipped) is untouched | — |
| Protected paths | yes | `factory.config.json` only. `.github/pull_request_template.md` is not under `.github/workflows/**` and is not CODEOWNERS — not a protected path. |

## Undo

| Method | Steps | Time to undo | Data loss risk |
| --- | --- | --- | --- |
| Revert commit | `git revert <commit>` | < 2 min | none |

## Steps

1. Draft A1/A2/A4 (done in this commit set); move `activeSlice` → this slice so the
   lane can see the change set (protected path, declared).
2. File the A8 (already drafted on this branch); link it from `work/README.md`.
3. Add the PR-template field.
4. Add the config test: presence-check `Fresh-context verification:` in the active
   slice's A5; synthetic-fixture positive/negative cases; real-tree PASS (this
   slice's A5 carries the field, marked pending until the verifier records it).
5. Record the three-slice trial start in the A8 (decision column: accepted on this
   branch's merge; verdict at 0010).
6. Full lane run vs the 0007 merge commit; PR; the PR's own fresh-context
   verification is the first real use of the new field.

## Verification plan

| AC | Check | Tier of test | Where it runs | Evidence location |
| --- | --- | --- | --- | --- |
| AC-1 | template contains the field | isolated | Local + CI | A5 row |
| AC-2 | config test passes present / fails absent | isolated | Local + CI | A5 row + test itself |
| AC-3 | A8 exists, linked, links resolve | isolated | Local + CI | LINKS gate row |
| AC-4 | pointer + A4 existence + version chain untouched | isolated | Local + CI | config test rows |
| AC-5 | lane green, release files untouched | command | Local + CI | A5 lane run |

## Risks and ordering rationale

| Risk | Why the order | Early signal |
| --- | --- | --- |
| The presence-check degrades into a rubber stamp | The A8 names the trial (three slices, re-review at 0010); content quality stays the reviewer's duty | 0010 A8 re-review of verdict substance |
| Retroactive enforcement demands break the running of old slices | The test checks only the ACTIVE slice — old slices are never re-run | n/a |
| The active-slice pointer move happens without a release cut, breaking the "cut rides" habit | Deliberate: 0.4.0 is current and correct; the config test's version chain asserts nothing changed | config test failure |

## Review budget

| Field | Estimate |
| --- | --- |
| Files changed | 9 |
| Logical lines changed | ~120 (A8 already drafted; template ~3, test ~35, config/pointers ~10, docs ~70) |
| If over budget, split by | Drop the PR-template change (the config test alone enforces the field); never split the A8 filing from the pointer move |

## Gate G3 checklist

> Self-review done 2026-10-27 by the drafting agent; human G3 review pending.

- [x] The slice is vertical and observable on its own.
- [x] Tier is declared; protected paths checked; escalation applied if needed.
- [x] Blast radius is complete.
- [x] Undo is executable by one person and a time estimate.
- [x] Verification covers every AC, including the expensive ones.
- [x] The diff fits the review budget.
- [x] No blocking dependency on a later slice.
