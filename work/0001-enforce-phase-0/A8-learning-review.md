# Learning review (A8)

> Station S8 · Gate G8 · Written at the declared horizon, not at merge time.
> This is the factory's first A8. It reviews the bet of slice 0001 — "make the
> process's promises falsifiable" — against seven slices of evidence, and feeds
> one change proposal into slice 0008's A1.

| Field | Value |
| --- | --- |
| Bet / slice | [0001 — Enforce the Phase 0 gates](A1-problem-brief.md) (the factory-wide bet: evidence over claims) |
| Problem brief | [A1](A1-problem-brief.md) v1 · 2026-10-23 |
| Horizon | "End of this slice (2026-10-23)" for the gate wiring; reviewed here at the end of the phase-0 build-out (slice 0007, 2026-10-27) |
| Review date | 2026-10-27 |
| Version | 1 |
| Owner | Siergus |

## Outcome

| Field | Value |
| --- | --- |
| Metric | Blocking gates wired and observed failing ÷ gates required (A1 metric, extended to the full build-out) |
| Baseline | 0 of 3 (clean build, fast tests, secret scan); blast radius unenforced |
| Target | 3 of 3, plus blast radius and tier escalation observed failing |
| Actual | **12 of 12 fast-lane gate rows wired, each observed failing at least once** (smoke-tested notes in `factory.config.json`), plus: tier escalation observed on every slice (G4f), config coherence machine-checked (0004), SAST coverage decided and matrix-tested (0005), a product CLI built and released through the factory (0006), and an immutable checksummed artifact deployed from a tag (0007) |
| Verdict | **hit** |
| Data source | `factory.config.json` gate statuses + smoke-tested flags; A5 evidence packs 0001–0007; PR merge history #1–#10 |

## What happened

Seven slices in three days (2026-10-25 → 2026-10-27), ten PRs, zero rollbacks. Lead time
per slice (first commit → merged) stayed under one day throughout (T1 target: ≤ 3 days);
the slowest was 0005, whose ~10-hour gap between PR #6 and reworked PR #7 was the
fresh-context verification doing its job, not waiting. WIP never exceeded 1 open slice.
The factory crossed from "verifies itself" (0001–0005) to "ships a product" (0006–0007)
without leaving the loop: the CLI and the release lane were built by the same
spec → plan → build → verify → release path as the gates themselves.

## What surprised us

- **The verification loop caught its first real defect in its own spec, not the code:**
  slice 0005's fresh-context check failed the shipped work over a scope note that
  over-claimed coverage. The cost was one fix round; the alternative was a SAST gate
  that passively lied about its coverage.
- **Probes kept paying disproportionate dividends.** Three probes in a row (slices
  0006, 0007), each a first-hour probe that found the design assumption that would
  have failed latest: the
  compiled-TS bridge specifier bug (0006), the non-self-contained artifact pack (0007),
  and a blast-radius glob that never matched its own slice directory (0007). Each was
  fixed before any tag, PR review, or consumer could see it.
- **Gate failures on fresh checkouts are environment drift, not code rot** — the CRLF
  episode (see escaped defects) was invisible on the machine that wrote the gate.
- **The lane budget never came close to binding** (~25s against 10 minutes), so check
  frequency was never rationed; that removed an entire class of "should we run it?"
  debates.

## Rework analysis

| Station re-entered | Times | Cause | Was it a factory defect? |
| --- | --- | --- | --- |
| S5 Verify (slice 0005) | 1 | Fresh-context verification failed the first shipped round: the A2 scope note over-claimed dynamic-command coverage; fixed by ADR-0004 amendment v2 (unconditional exec-family ban), re-verified, PR #7 | No — the defect was in the slice's claim, and the factory's own S5 caught it before merge. Rework rate: 1 of 7 slices = 14% (target < 25%) |
| S1 Spec (slice 0007) | 1 | A2 pack list omitted the shared engines; caught in-slice by the A4's dry-run step before any build was tagged. Spec amended to v2 | No — the A4 step ordering (probe first) worked as designed; the spec defect never escaped the slice |
| S3 Plan (slice 0007) | 1 | A4 glob `work/0007/**` never matched `work/0007-release-lane/**`; caught by the G4f gate on the first lane run | No — the gate caught it; the fix is a one-line A4 amendment |

## Escaped defects and incidents

| Defect / incident | Impact | Gate that should have caught it | Why it did not |
| --- | --- | --- | --- |
| CRLF drift: the FORMAT gate failed on fresh checkouts while passing on the author's machine (found during slice 0004, introduced with slice 0001's tooling) | Every fresh clone was red on format; a contributor's first `npm run fast` failed spuriously | FORMAT (G4b) — it ran green because the *author's* tree was already normalized | The gate checked the tree, not the checkout environment; single-machine evidence could not see the drift. Fixed by `.gitattributes` (`* text=auto eol=lf`) in slice 0004 |
| The v0.4.0 release run's cache save/restore and Node-20 action deprecation warnings | None (non-blocking annotations) | n/a | Recorded in the 0007 A5; watch at the next release |

## Decisions to revisit

| Decision | Evidence against it | Action |
| --- | --- | --- |
| Fresh-context verification is a standing instruction, not a wired gate (it is not in the PR template's required checks) | The only S5 re-entry in factory history was caught by exactly this step — and its being ad hoc means the next slice can merge without it | Proposed factory change below (the one change this review makes) |
| Zip artifacts are not byte-reproducible (archive timestamps) | v0.4.0 repack produced a different hash (`22b9a78…` vs `54a58e7…`) | Parked follow-up: `SOURCE_DATE_EPOCH`-style reproducibility — only worth it when a second builder or external verification exists (recorded in 0007 A5) |
| `factory status` exits 1 on an unparseable manifest, while the A2 says "exit 0 always" | Wording ambiguity flagged by the 0006 A5; lane-equivalent semantics chosen | Resolve in the next A2 that touches the CLI (one-line wording fix, no behavior change needed) |

## Debt

| Debt created or found | Owner | Trigger to pay it |
| --- | --- | --- |
| FU-4: lane evidence table does not pin `scripts/ci/lib/*` modules (wired gates verified only via wrapper files) | Siergus | Before autonomy increases, or before any second builder/agent runs the lane independently |
| FU-8: SAST resolver hardening (constant-folded computed keys, multi-hop rebinding, template-literal specifiers) | Siergus | When obfuscation-resistant coverage matters (external contribution, security-sensitive product code) |
| FU-9: spawn-with-shell exec-equivalence uncovered | Siergus | The moment `spawn(…, { shell: true })` is adopted anywhere |
| FU-3: `activeSlice` has no second source of truth | Siergus | Parked: the lane names the active slice on every run |
| No LICENSE file; artifact not distributable beyond the owner | Siergus | Before any third party consumes the released artifact |
| A8 cadence debt: this is the first A8 after seven slices (health check: "the last three slices have an A8") | Siergus | Immediately — write a (even one-line) A8 verdict per slice at its horizon |

## Factory changes proposed

<!-- At most one. More than one change at a time and you cannot tell which helped. -->

| Change | Type | Evidence | Trial slice | Decision |
| --- | --- | --- | --- | --- |
| Make fresh-context verification a recorded, checkable step: the PR template's Evidence section gains a mandatory "fresh-context verifier" field (model/context id + A5 link), and the 0004 config gate pattern gains a test that every merged slice's A5 carries it | gate (process, then data-checked) | The only rework event in seven slices was caught by fresh-context verification (0005); it is currently the factory's most valuable check and the only one that exists purely as prose | 0008 | Pending owner decision at S0 |

## Next bet

| Field | Value |
| --- | --- |
| Hypothesis | Requiring fresh-context verification per merge (instead of trusting it to discipline) keeps the rework-catch rate without adding meaningful latency — the verifier runs in parallel with human review, and seven slices show verification cost is minutes |
| Cheapest test | Apply it for the next three slices: template change + config-test check, then re-read this A8's rework table |
| Success metric | Rework rate stays ≤ 25% with 3 of 3 slices carrying a recorded fresh-context verdict; zero merges of A5s missing the field |
