# Problem brief (A1)

> Station S0 · Gate G0 · Keep this under one page.

| Field | Value |
| --- | --- |
| ID / title | 0006 — First product: the factory CLI (`factory status` / `factory check`) |
| Owner | Siergus |
| Date | 2026-10-27 |
| Risk tier | T2 — the v0.3.2 release cut rides with the `activeSlice` pointer (protected `factory.config.json`); the CLI code itself is T1 local behavior |
| Version | 1 |
| Links | [Spec](A2-spec.md) · [Slice plan](A4-slice-plan.md) · Roadmap: [docs/backlog.md](../../docs/backlog.md) |

## Problem

The factory's process loop works for factory work — five slices through specs,
implementation, adversarial review, and gate-tested builds — but has never run against
**product code**. The repo builds tooling, not a product: nothing is invocable by a
person who wants the factory's verdict without reading the lane's 12-row summary. The
owner decided (backlog roadmap, 2026-10-27) that the first product is a factory CLI, so
that the process itself becomes callable — and every future product slice inherits a
known-good product shape.

## Who is affected

The repository owner first, agents second: today verifying "what did this change set do"
means running the lane and reading raw output; a CLI turns that into a single command.
Secondarily, anyone who later works with the first deployed artifact (slice 0007's
GitHub Release) — this CLI is that artifact's content.

## Current workaround and why it is insufficient

The workaround is `npm run fast -- --base <ref>` plus reading the summary and, for tier
details, `node scripts/ci/blast-radius.mjs` — two invocations, no stable *named surface*,
and shaped as internal CI plumbing (paths, no `--help`), not as a product someone can
hand another contributor.

## Outcome

| Field | Value |
| --- | --- |
| Metric | A person can get the factory's change-set verdict with one command and no repo plumbing knowledge |
| Baseline | 0 product commands |
| Target | `factory status` prints the factory version + gate statuses; `factory check --base <ref>` prints the change set, resolved tier, escalations, and problems (outside-radius/escalation as failures); `--help` friendly; exit 0/1 actionable; unit-tested through the built dist like `src/tiers` is |
| Horizon | End of this slice |
| Measurement method | Unit tests + break-and-restore smoke: a change touching a protected path makes `factory check` fail with the escalation named |
| What result would prove us wrong | The CLI reports a different verdict than the lane's gate summary for the same change set |

## Non-goals

- Graduating any `n/a` gates (G5b+ contract/boundary/db/perf — no public contract yet).
- Publishing or deploying anything (slice 0007 owns the release lane).
- A command surface beyond `status` and `check` (no wizard, no init, no scaffold).
- Re-architecting `scripts/ci/**` around the CLI — the CLI consumes the same shared
  logic; no logic moves in this slice (if an import bridge to the mjs libs is needed,
  it is a thin ambient declaration, not a refactor).

## Constraints

- Node 24, ESM, no new runtime dependency (product code must keep the factory's
  dependency-minimalism; stdlib only).
- The CLI must keep the lane green (build via existing tsc; tests via node --test;
  SAST/exec-family rules apply to it like any other code — `spawn`/`spawnSync` with
  argument arrays only).
- The release cut (v0.3.2: CHANGELOG, `factoryVersion`, `package.json`, `activeSlice`)
  rides with the slice per the standing pattern.

## Assumptions and open questions

| # | Statement | How it will be tested | Blocking? |
| --- | --- | --- | --- |
| 1 | The shared engines (`scripts/ci/lib/*.mjs`) are importable from compiled TS output without a new dependency | A bridge would be needed: probe with an ambient `.d.ts` import, run the lane | No — if worse, the CLI reimplements the small slice-plan/engines subset locally and the duplication is declared |
| 2 | Verdict parity between CLI and lane verdicts, because both use the same functions | Test: injected protected-path change → escalation named in CLI output as an error | No |
| 3 | `--help` and actionable exits are testable without a TTY | Unit tests on exit codes and message substrings | No |

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
