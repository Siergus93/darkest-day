# Slice plan (A4)

> Station S3 · Gate G3 · A slice is the smallest change that produces **observable**
> behavior. The tier declared here governs the whole change.

| Field | Value |
| --- | --- |
| ID / title | 0005 — SAST coverage: literal-argument command execution |
| Spec | [A2](A2-spec.md) v1 · [ADR-0004](../../docs/decisions/ADR-0004-sast-and-history-implementation.md) rider · origin FU-2 in [0003 A4 v4](../0003-fast-gate-debt/A4-slice-plan.md) |
| Tier | T2 |
| Tier downgrade reason | n/a |
| Version | 1 |
| Owner | Siergus |
| Target release | Factory v0.3.1 (unreleased) |

## Observable outcome

An injected literal-argument `child_process.exec("…")` now fails the SAST gate with a rule
id + file:line (and the repo's own arg-array spawn usage stays clean) — or, if widening
cannot be done without weakening the gate, the decided boundary is stated in the gate row,
the SAST scope note, and CHANGELOG, and the ADR records why. The v0.3.1 release cut
(`package.json` joins the version-coherence chain, FU-5) rides record. The v0.3.1 release cut
(`package.json` joins the version-coherence chain, FU-5) rides with the pointer move.

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | `eslint.config.mjs` (the rule pack — or a local-rules plugin file it points to), `scripts/ci/**` (sast scope note in `lib/sast.mjs` output; no wrapper logic changes expected), `test/**` (fixtures for AC-2/AC-3/AC-4), `docs/decisions/ADR-0004-*.md` (amendment/supersede record; the original stays untouched), `factory.config.json` (release cut: `factoryVersion` 0.3.1, `activeSlice` pointer, possibly the G4b note wording after the decision), `package.json` + `package-lock.json` (version field only, FU-5), `CHANGELOG.md` (0.3.1 + decision note), `AGENTS.md` (active-slice line), `work/README.md` (rows), `docs/backlog.md` (new follow-up register), `work/0005-sast-literal-coverage/**`, `docs/**` | `eslint.config.mjs`, `scripts/ci/**`, `factory.config.json` are protected → T2. Probe-first: the widened pack must observe the clean tree before going blocking. |
| Public contracts | Gate output wording; new rule id in SAST failure output; `factory.config.json` G4b note may be re-worded after the decision | No exit-code or CLI changes. |
| Data / schema | none | — |
| Configuration / secrets | `factory.config.json` values only; ESLint config gains a rule | Declared; no secrets. |
| Infrastructure | none — the rule runs inside the existing `sast.mjs` invocation | — |
| Protected paths | yes | `eslint.config.mjs`, `scripts/ci/**`, `.github/**` untouched but the first two are inside the slice on purpose. |

## Undo

| Method | Steps | Time to undo | Data loss risk |
| --- | --- | --- | --- |
| Revert commit | `git revert <commit>` | < 5 min | none |
| Manual revert | Remove the added rule(s) from `eslint.config.mjs` + any local-rules file; restore the pack's warning level for `security/detect-child-process`; revert the gate-note/scope-note wording, config values, version fields | < 15 min | none |

## Steps

Ordered by risk: the rule-choice probe is first — everything else hangs on its outcome.

1. Probe candidate rules (A2 preference order) against: the clean tree, the literal-exec
   fixture, the non-literal fixture, and the repo's own spawn usage. Document which
   stock rule (if any) has the exact signature.
2. Decide widen-vs-boundary per the probe results; write the ADR-0004 amendment (or the
   superseding record) with the deliberation.
3. Land the chosen option in `eslint.config.mjs` (rule entry, or local-rules plugin +
   file). Probe the clean tree: 0 violations before any blocking.
4. Add the fixtures/tests for AC-2 (literal), AC-3 (non-literal regression), AC-4
   (spawn stays clean), and the scope-note for AC-5.
5. Release cut v0.3.1: CHANGELOG, `factoryVersion`, `package.json` version (+ lockfile
   root version), `activeSlice` → this slice, AGENTS.md line, work README rows,
   `docs/backlog.md` register (FU-3/FU-4 parked, FU-5 closed here).
6. Break-and-restore smokes; record outputs verbatim in A5.
7. Full lane `npm run fast -- --base 8e9da3a`; PR; fresh-context verification.

## Verification plan

| AC | Check | Tier of test | Where it runs | Evidence location |
| --- | --- | --- | --- | --- |
| AC-1 | Clean tree: SAST 0 violations, lane budget respected | isolated + command | Local + CI | A5 timing + lane run |
| AC-2 | Literal-exec injected → SAST FAIL with rule id; restore green | isolated | Local | A5 smoke 1 |
| AC-3 | Non-literal fixture still fails | isolated | Local | A5 smoke 2 |
| AC-4 | Repo spawn usage clean with the widened rule | isolated | Local | A5 smoke 3 + lane run |
| AC-5 | Scope note states the coverage; PASS row no longer unqualified | read | Local | A5 + file diff |
| AC-6 | ADR record present; original ADR-0004 unchanged | read | Local | File list in A5 |
| AC-7 | Three-way version agreement | isolated | Local | `test/config.test.mjs` (extended in this slice? no — the 0004 chain assertion covers it; only the values change) → lane CONFIG/CHANGELOG coherence |
| AC-8 | Lane green vs `8e9da3a`; CI on PR green; fresh-context verdict in A5 | command + manual | Local + CI | A5 |

## Risks and ordering rationale

| Risk | Why this order | Early signal |
| --- | --- | --- |
| No stock rule has the right signature → local rule needed | Probe first (step 1) so the ADR records reality, not intent | Probe output table |
| Widened rule false-positives on the repo's own spawn usage | Probed with real usage before any gate goes blocking | Step 1 probe 4 |
| Decision deferred instead of made | Hard commit: this slice ends with EITHER a failing injected literal-exec OR a pinned written boundary — "no decision" is a violation of the outcome | Smoke 1 must have a verdict |
| Version chain grows a third leg (FU-5) | Trivial value edit landing with the cut; the 0004 assertion catches drift from now on | `npm test` in step 6 |

## Follow-ups registered at opening

| ID | Item | Why it matters | Where | When |
| --- | --- | --- | --- | --- |
| FU-3 | activeSlice pointer-vs-slice cannot verify "current" | Wrong-but-existing pointers pass; mitigation is the G4f summary naming the slice every run | [docs/backlog.md](../../docs/backlog.md) | Nice to have |
| FU-4 | Evidence table pins wrappers, not what the lane imports | A future wired gate could name an orphaned wrapper; today fails closed | [docs/backlog.md](../../docs/backlog.md) | Nice to have |
| FU-5 | package.json version joins the coherence chain | Closes in THIS slice's release cut (AC-7) | This slice | This slice |

## Review budget

| Field | Estimate |
| --- | --- |
| Files changed | 8–12 (config + local-rule file, tests, ADR, docs/config/CHANGELOG, slice dir) |
| Logical lines changed | ~200–350 |
| If over budget, split by | The ADR + decision could be its own slice, keeping the fixture work with the implementation; do not split AC-2/AC-3/AC-4 |

## Gate G3 checklist

> Self-review done 2026-10-27 by the drafting agent; human G3 review pending.

- [x] The slice is vertical and observable on its own.
- [x] Tier is declared; protected paths checked; escalation applied if needed.
- [x] Blast radius is complete.
- [x] Undo is executable by one person and has a time estimate.
- [x] Verification covers every AC, including the expensive ones.
- [x] The diff fits the review budget.
- [x] No blocking dependency on a later slice.
