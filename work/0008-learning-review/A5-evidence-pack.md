# Evidence pack (A5)

> Station S4 · Gate G5a · Every AC maps to reproducible evidence.

| Field | Value |
| --- | --- |
| Slice | [0008 — File the first A8 and make fresh-context verification checkable](A4-slice-plan.md) |
| Spec | [A2](A2-spec.md) v1 |
| Verified by | drafting agent (self-verification) |
| Date | 2026-10-27 |

## AC-to-evidence map

| AC | Result | Evidence |
| --- | --- | --- |
| AC-1 template field | PASS | `.github/pull_request_template.md` Evidence section contains the mandatory `Fresh-context verification:` line with the pending-allowed wording; asserted by `test/config.test.mjs` "the pull request template demands a fresh-context verification record" |
| AC-2 config test present/absent | PASS | real tree: "the active slice's A5 records a fresh-context verification field" ✔ (this A5 carries the field); synthetic fixture: "the fresh-context check fails closed on a missing field" ✔ (a field-less A5 is detected) |
| AC-3 A8 filed + linked + links resolve | PASS | `work/0001-enforce-phase-0/A8-learning-review.md` exists (drafted `378fe29`, filed here); `work/README.md` links it; the LINKS gate row in the lane run below proves every link resolves |
| AC-4 pointer + version chain | PASS | `activeSlice: work/0008-learning-review` (A4 exists); config test "factoryVersion matches…" ✔ unchanged — 0.4.0 == 0.4.0 == [0.4.0]; no release cut rides (deliberate, declared in A4) |
| AC-5 lane green, release lane untouched | PASS | `npm run fast -- --base f752cb1` → Fast lane PASSED, 12/12 gate rows, 70/70 tests; `.github/workflows/release.yml` untouched by this diff |

## Fresh-context verification: pending — verifier runs before merge

This slice's own fresh-context record is intentionally the first user of the field it
introduces. The verifier should confirm at minimum: the A8's verdict data (rework
count, lead times, escaped-defect attribution) matches the PR history, and the
config test actually fails when the field is removed from this A5.
