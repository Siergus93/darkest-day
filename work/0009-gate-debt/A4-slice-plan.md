# Slice plan (A4)

> Station S3 · Gate G3 · A slice is the smallest change that produces **observable**
> behavior. The tier declared here governs the whole change.

| Field | Value |
| --- | --- |
| ID / title | 0009 — Close the verifier-flagged gate debt: pin the lane's lib modules (FU-4), harden the SAST resolver (FU-8) |
| Spec | [A2](A2-spec.md) v1 · Backlog: [docs/backlog.md](../../docs/backlog.md) (FU-4, FU-8) |
| Tier | T2 |
| Tier downgrade reason | n/a |
| Version | 1 |
| Owner | Siergus |
| Target release | none — no version bump rides (0.4.0 is current) |

## Observable outcome

Renaming a lib module fails the config test naming the gate and module (not a lane
crash); an obfuscated exec call (`cp["ex" + "ec"]`, template-literal specifier,
require alias chain) fails the SAST gate while sanctioned spawn usage stays green.

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | `test/config.test.mjs` (evidence table data + lib-link tests), `scripts/ci/eslint-rules/index.mjs` (resolver widening), `test/sast-literal.test.mjs` (fixture matrix 17 → ~23), `factory.config.json` (`activeSlice` → this slice; G4b note extended to name the widened resolver), `AGENTS.md` (active-slice line), `work/README.md` + `work/0009-gate-debt/**`, `docs/backlog.md` (FU-4/FU-8 close, roadmap row) | `scripts/ci/**` is protected → T2. The rule file change is detection-widening only; the lane and wrappers are untouched. |
| Public contracts | none | The rule's message and decision are unchanged in kind. |
| Data / schema | none | — |
| Configuration / secrets | `factory.config.json` `activeSlice` pointer + G4b note (protected, declared deliberate) | No secrets. |
| Infrastructure | none — no workflow change; release lane untouched | — |
| Protected paths | yes | `scripts/ci/eslint-rules/index.mjs` + `factory.config.json`. |

## Undo

| Method | Steps | Time to undo | Data loss risk |
| --- | --- | --- | --- |
| Revert commit | `git revert <commit>` | < 2 min | none |

## Steps

1. Draft A1/A2/A4; move `activeSlice` → this slice (protected, declared).
2. FU-4 data edit: `wrapperLibs` per gate + table-level `laneImports`, derived from
   the wrappers' actual imports (verified by reading each file).
3. FU-4 tests: lib existence; wrapper-imports-declared-libs; synthetic fixture for
   the rewired-wrapper gap; break-and-restore rename smoke (AC-2).
4. FU-8 resolver widening in the local rule (three changes, bounded alias chase).
5. Fixture matrix extensions (three caught shapes + two negatives, AC-3/AC-4).
6. Full lane run vs the 0008 merge commit; PR; fresh-context verification (second
   slice of the trial).

## Verification plan

| AC | Check | Tier of test | Where it runs | Evidence location |
| --- | --- | --- | --- | --- |
| AC-1 | declared links exist + are imported; synthetic negative | isolated | Local + CI | A5 row + tests |
| AC-2 | rename smoke fails naming gate + module; restore green | isolated + smoke | Local | A5 smoke |
| AC-3 | three shapes rejected by the real pack | isolated | Local + CI | fixture matrix + A5 |
| AC-4 | sanctioned patterns clean incl. aliases | isolated | Local + CI | fixture matrix |
| AC-5 | lane green; release files untouched | command | Local + CI | A5 lane run |

## Risks and ordering rationale

| Risk | Why the order | Early signal |
| --- | --- | --- |
| Alias-chase over-flags sanctioned spawn usage | AC-4 negatives are written together with the resolver change, same commit | fixture failure on sanctioned patterns |
| Evidence-table data drifts from reality | The wrapper-imports test reads the wrapper sources — drift fails the test by construction | lib-link test failure |
| Resolver change obscures the ADR decision | The doc comment states detection-widening-only; the ADR is untouched | review |

## Review budget

| Field | Estimate |
| --- | --- |
| Files changed | 8–9 |
| Logical lines changed | ~200–280 (fixtures dominate; rule ~60; table data ~25; tests ~80; docs ~50) |
| If over budget, split by | FU-8 slips to its own slice (rule + fixtures); FU-4 never splits from its negative test |

## Gate G3 checklist

> Self-review done 2026-10-27 by the drafting agent; human G3 review pending.

- [x] The slice is vertical and observable on its own.
- [x] Tier is declared; protected paths checked; escalation applied if needed.
- [x] Blast radius is complete.
- [x] Undo is executable by one person and a time estimate.
- [x] Verification covers every AC, including the expensive ones.
- [x] The diff fits the review budget.
- [x] No blocking dependency on a later slice.
