# Spec (A2)

> Station S1 · Gate G1 (design sections: G2) · Every acceptance criterion must be
> **observable** and mapped to a **verification method**.

| Field | Value |
| --- | --- |
| ID / title | 0003 — Close the fast-gate debt: format, lint, SAST, audit, and secret history |
| Problem brief | [A1](A1-problem-brief.md) v2 |
| Tier | T2 — escalated by `scripts/ci/**`, `.github/workflows/**`, `factory.config.json`, `adapters/**` |
| Version | 2 |
| Owner | Siergus |
| Links | [Slice plan](A4-slice-plan.md) · [ADR-0003](../../docs/decisions/ADR-0003-gate-tools.md) · [ADR-0004](../../docs/decisions/ADR-0004-sast-and-history-implementation.md) |

## Scope

Wire the three incomplete fast-lane gates: `G4b` (format + lint via Biome; SAST via
`@microsoft/eslint-plugin-sdl`), `G4e` (make `npm audit` blocking after it is observed
failing), and `G4d` (full-history secret scan via the repository-owned ruleset applied over
git history). All tooling is npm-pinned by the lockfile; no new runtime platform is
introduced. This v2 replaces ADR-0003's Semgrep/gitleaks clauses per
[ADR-0004](../../docs/decisions/ADR-0004-sast-and-history-implementation.md).

## Behaviors and acceptance criteria

| AC | Behavior | Acceptance criterion (observable) | Verification method | Status |
| --- | --- | --- | --- | --- |
| AC-1 | Biome format check | A newly unformatted file makes `scripts/ci/format.mjs` exit 1 with a message naming the file; the gate summary shows `FORMAT FAIL`; restoring the file returns exit 0 and the summary `FORMAT PASS` | Break-and-restore smoke; output recorded in A5 | planned |
| AC-2 | Biome lint check | A file with a lint error (e.g. unused variable, unsafe equality) makes `scripts/ci/lint.mjs` exit 1 with the rule id and file:line; restore exits 0 | Break-and-restore smoke | planned |
| AC-3 | SDL-security SAST check | A file matching an SDL security rule (e.g. `child_process.exec` on a template literal) makes `scripts/ci/sast.mjs` exit 1 naming the rule and file:line; restore exits 0 | Break-and-restore smoke | planned |
| AC-4 | Lane composition and time budget | `npm run fast -- --base main` on a clean tree passes with `FORMAT`, `LINT`, and `SAST` rows all `PASS`, and total added wall-clock ≤ 30 s locally | Fast-lane run, timings recorded | planned |
| AC-5 | `npm audit` is blocking and observed failing | A fixture lockfile containing a known high/critical advisory makes the audit step exit 1 with the advisory name; the real lockfile exits 0. Until then, audit remains advisory — the gate may only show PASS with the safe lockfile and PARTIAL with a failing fixture unproven | Fixture probe + lane run | planned |
| AC-6 | Secret history scan | A scratch commit containing a fake key (then reverted) makes `scripts/ci/secrets-history.mjs` exit 1 naming the file (and commit); on the clean real history it exits 0; it requires ≤ 5% of the budget on both OSes | Scratch-replica smoke + lane run; timing recorded | planned |
| AC-7 | Config truth | `factory.config.json` marks G4a–G4f statuses accurately (`wired` only for gates with an observed failure and green run; `PARTIAL` or exceptions otherwise), and the waiver register no longer lists the retired items | Config schema test + manual read-back | planned |
| AC-8 | Adapter truth | `adapters/stack/node-typescript.md` lists concrete tool versions/config locations for format, lint, SAST, audit, and history; its "adapter exceptions" table is empty or explains the remaining ones | Manual review against the file | planned |
| AC-9 | Docs and config consistency | A fresh fast-lane run with `--base main` shows `factory.config.json` statuses consistent with the summary; `README.md` and `CHANGELOG.md` describe the wired gates and factory v0.3.0 | Lane run + doc read | planned |
| AC-10 | Binary-boring paths on both platforms | All three tools are invoked by absolute path from a resolved script location, no PATH dependency; both Windows and `ubuntu-24.04` | `npm run fast` locally on Windows and the CI run on the PR | planned |

## Non-functional requirements

| Attribute | Target | Measured how | Applies to |
| --- | --- | --- | --- |
| Fast-lane wall-clock | ≤ 10 min budget; the three new tools total ≤ 30 s locally | Timed `npm run fast -- --base main` | All |
| Audit lane budget | ≤ 20 s locally | Timed audit step | `G4e` |
| History scan budget | ≤ 5% of local budget (≤ 30 s at current repo size); escalate to the deep lane if it ever exceeds 60 s | Timed history step | `G4d` |
| Availability | Not required: local and CI tools, no runtime | — | — |
| Recovery | Not required (no state) | — | — |

## Authorization

| Actor | Operation | Data scope | Allowed | Denied behavior |
| --- | --- | --- | --- | --- |
| Repository owner / CI | Run all three checks and the lane | Local repo, git history, npm registry (audit only) | yes | Exit 1 with a named problem on any finding |

No other actors; no persistent data, no secrets, no runtime surface.

## Data lifecycle

| Data | Created by | Retained | Deleted by | Exported by | Sensitive? |
| --- | --- | --- | --- | --- | --- |
| Fixture lockfile (audit-fault probe) | Slice smoke | Only in A5 evidence | Removed after recording | Copy in A5 | no |
| Fake secret pattern (history-scan probe) | Scratch commit | Scratch repo only | Commit reverted; scratch artifact deleted | A5 (only the redacted report line) | no — fake key, scanner-detected class |

## Failure modes

| Dependency or condition | Mode | Expected behavior | User-visible result |
| --- | --- | --- | --- |
| Biome/ESLint binary missing | absent | Check script exits 1 with the tool name + install-pointer; it does not pass | Gate FAIL, actionable message |
| Tool crashes or times out | partial | Same as missing: exit 1, never a silent pass | Gate FAIL |
| tool reported an advisory (audit) | advisory | Report advisory rows but only fail on high+ | Message in gate summary |
| History scan on a huge repo | slow | Retain as wired only while ≤ 60 s; beyond that, mark deep-only (documented in the config note) | Documented |
| Windows line endings / CRLF | edge | Biome config pins line endings to the repo's existing LF for .mjs/json/template; enforced by lint pass | Deterministic result |
| A "secret" match is a false positive | false positive | Allow-list mechanism in the scan config, one line per rule, with a comment naming why | No red herring failures |

## Edge cases

- A file that is fine and not scanned (`node_modules`, `dist`, `.git`, docs) — every tool config must skip them in their defaults; only the lane owns the filter.
- A pre-existing violation blocked by a new gate: format/lint rules must ship clean, not as a follow-up. If the codebase is not clean after installing the tools, that must be recorded as an explicit `PARTIAL` row, and it stays until it is fixed by the same slice or the next.
- Zero commits (fresh clone before init), repo with no default branch, refname empty.
- `npm audit` returning non-high field update (e.g. moderate advisory) without failing.

## Out of scope

- Contract, boundary, migration, perf, journey gates (`G5b`–`G5h`) — no product surface exists.
- A staging environment, release-record automation, observability, or rollback rehearsal (Phase 2 items gated on the first product slice).
- Changing CI workflow internals beyond what wiring a gate requires (workflow stays thin).
- Migrating 0001/0002 artifacts; their history is frozen.

## Assumptions and open questions

| # | Assumption or question | Owner | Blocking? | Resolution |
| --- | --- | --- | --- | --- |
| 1 | Tool choices (Biome, SDL plugin, in-house history scan) are defaults, not a ratchet — swap in review without redesign | Siergus | No | Defaults declared; recorded in ADR-0004 after the environment probe (no Python, no package manager) |
| 2 | History scan wired as a fast-lane step while the repo is small; moves to deep if > 60 s | Siergus | No | Recorded in AC-6 |
| 3 | Does the 2026-12-31 expiry apply after wiring, or does the waiver retire only on first observed failure? | Siergus | No | Spec takes "waiver retires when observed failing + passing once"; A5 records both |
| 4 | Are there pre-existing lint/format/SAST violations in the current tree? | Siergus | No | Discovered in step 2 of A4; recorded before any rule is marked blocking |

## Design constraints and boundaries (T2+)

| Component | Owns | May depend on | Must not depend on | Owner |
| --- | --- | --- | --- | --- |
| `scripts/ci/format.mjs` | Biome invocation + exit-code mapping | Biome binary, repo-local config | fast.mjs internals, other gates | Siergus |
| `scripts/ci/lint.mjs` | Biome lint-mode invocation | Biome binary, repo-local config | other gates | Siergus |
| `scripts/ci/sast.mjs` | SDL ESLint invocation + security rule config | ESLint + `@microsoft/eslint-plugin-sdl`, rule config | Node/npm runtime | Siergus |
| `scripts/ci/secrets-history.mjs` | The repo-owned ruleset from `secrets.mjs` re-applied over `git log -p --all` | repo-owned scanner, git | npm | Siergus |
| `fast.mjs` | Composition, ordering, gate rows | All of the above | Tool internals | Siergus |
| Biome + ESLint SDL | Their own verdicts (independent engines) | — | — | Upstream / repo-owned ruleset |

- **Contracts and compatibility rule:** Gate statuses move additively from `PARTIAL` to `wired`; exit codes and CLI flags unchanged. Breaking them needs a new slice.
- **Transaction boundaries:** nothing stateful.
- **Trust boundaries:** the history scanner is the one gate reading git history — its verdict must not be the working-tree scanner's; both must be independently invocable.
- **Deployment shape:** none; CI-only and local.
- **Migration:** none; no schema/data changes.
- **Decisions recorded:** [ADR-0003](../../docs/decisions/ADR-0003-gate-tools.md) — Biome, audit-blocks-after-probe, waiver-retires-after-fail-then-pass; [ADR-0004](../../docs/decisions/ADR-0004-sast-and-history-implementation.md) supersedes its clauses 2–3 (SDL-plugin SAST; repo-owned history scan).

## Definition of Done

- [ ] Every AC has a reproduced result in A5.
- [ ] Failure paths and authorization are exercised.
- [ ] No secret, no unjustified dependency, no unrelated change.
- [ ] Undo procedure is defined in A4.
- [ ] Decisions recorded; docs consistent with behavior.
- [ ] Stack delta from the adapter satisfied (link): adapters/stack/node-typescript.md

## Gate G1 checklist

- [x] Every AC is observable and has a verification method.
- [x] Every NFR is numeric or explicitly waived with a reason.
- [x] Authorization matrix is complete for all actors and operations.
- [x] Data lifecycle covers deletion and retention.
- [x] Blocking questions: **zero**.
- [x] Out of scope is non-empty.
