# Slice plan (A4)

> Station S3 · Gate G3 · A slice is the smallest change that produces **observable**
> behavior. The tier declared here governs the whole change.

| Field | Value |
| --- | --- |
| ID / title | |
| Spec | |
| Tier | T0 / T1 / T2 / T3 |
| Tier downgrade reason | <!-- required if the tier is lowered; otherwise "n/a" --> |
| Version | 1 |
| Owner | |
| Target release | |

## Observable outcome

<!-- What can a user or consumer do after this slice that they could not do before? -->

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | <!-- backticked globs, comma separated: `src/**`, `docs/**` --> | |
| Public contracts | | |
| Data / schema | | |
| Configuration / secrets | | |
| Infrastructure | | |
| Protected paths | yes / no | If yes: tier escalated to |

## Undo

<!-- Pick one and be concrete: revert commit, flag off, forward fix, restore snapshot. -->

| Method | Steps | Time to undo | Data loss risk |
| --- | --- | --- | --- |
| | | | |

## Steps

Ordered by risk: the assumption most likely to be wrong is tested first.

1. 
2. 
3. 

## Verification plan

| AC | Check | Tier of test | Where it runs | Evidence location |
| --- | --- | --- | --- | --- |
| AC-1 | | isolated / boundary / contract / journey | | |

## Risks and ordering rationale

| Risk | Why it is first (or last) | Early signal |
| --- | --- | --- |
| | | |

## Review budget

| Field | Estimate |
| --- | --- |
| Files changed | |
| Logical lines changed | |
| If over budget, split by | <!-- observable behavior, never by layer --> |

## Gate G3 checklist

- [ ] The slice is vertical and observable on its own.
- [ ] Tier is declared; protected paths checked; escalation applied if needed.
- [ ] Blast radius is complete.
- [ ] Undo is executable by one person and has a time estimate.
- [ ] Verification covers every AC, including the expensive ones.
- [ ] The diff fits the review budget.
- [ ] No blocking dependency on a later slice.
