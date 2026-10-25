# Slice plan (A4)

| Field | Value |
| --- | --- |
| ID / title | 0001 — Enforce the Phase 0 gates |
| Spec | [A2](A2-spec.md) v2; this plan's v3 corrects the review-budget estimate to the delivered diff and follows A2's removal of line-level secret suppression |
| Tier | T2 |
| Tier downgrade reason | n/a |
| Version | 3 |
| Owner | Siergus |
| Target release | Factory v0.2.0 |

## Observable outcome

After this slice, a contributor can run one command and get a reproducible verdict from the
Phase 0 gates. A deliberately broken build, test, secret, or blast radius makes the command
fail with a useful message; a conforming tree passes inside the 10-minute budget. The same
script runs in CI through a workflow that contains no gate logic.

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | `src/**`, `test/**`, `scripts/**`, `.github/**`, `docs/**`, `templates/**`, `work/**`, `adapters/**`, `factory.config.json`, `package.json`, `package-lock.json`, `tsconfig.json`, `.nvmrc`, `.gitignore`, `AGENTS.md`, `CHANGELOG.md`, `README.md` | New verification spine plus the artifacts that describe it |
| Public contracts | `factory.config.json` schema v1; CLI flags `--slice`, `--base`, `--changed`; exit codes 0/1 | Additive; breaking changes need a schema bump and ADR |
| Data / schema | none | No runtime data or database |
| Configuration / secrets | `.nvmrc`; no secrets | Node version only |
| Infrastructure | GitHub Actions fast workflow | No deployed environment |
| Protected paths | yes | Escalated to T2 by `scripts/ci/**`, `.github/**`, `factory.config.json`, `adapters/**` |

## Undo

| Method | Steps | Time to undo | Data loss risk |
| --- | --- | --- | --- |
| Revert commit (once the workspace is a git repository) | `git revert <commit>` | < 5 minutes | none |
| Manual revert | Delete the added files and restore the edited templates/docs from the prior version | < 10 minutes | none |
| Disable CI | Delete or disable `.github/workflows/fast.yml` | < 2 minutes | none; local gates remain |

## Steps

Ordered by risk: the assumption most likely to be wrong is tested first.

1. Implement and unit-test tier ordering, glob matching, protected-path escalation, and
   downgrade validation. This is the logic everything else trusts.
2. Validate the manifest and compose the fast lane in one command, with a summary that names
   gates and exit codes.
3. Add the secret, link, and blast-radius checks; keep each one separately invocable.
4. Add the thin CI workflow, PR template, and CODEOWNERS; review it against the delivery
   guardrails rather than trusting YAML.
5. Write the conventions, ADRs, adapter record, and slice artifacts; run the smoke test for
   every blocking gate and record the observed failure text.

## Verification plan

| AC | Check | Tier of test | Where it runs | Evidence location |
| --- | --- | --- | --- | --- |
| AC-1 | Clean tree passes the fast lane twice | isolated + command | Local | A5 commands and gate summary |
| AC-2 | Type error fails `G4a`/`G4b`, restore passes | isolated | Local | A5 smoke record |
| AC-3 | Wrong expectation fails `G4c`, restore passes | isolated | Local | A5 smoke record |
| AC-4 | Fake AWS key fails `G4d` redacted, restore passes | isolated | Local | A5 smoke record |
| AC-5 | Undeclared path fails `G4f` | isolated | Local | A5 smoke record |
| AC-6 | Protected path escalates; downgrade rules | isolated | Local | `test/tiers.test.mjs` + A5 |
| AC-7 | Invalid manifest fails with a named problem | isolated | Local | `test/config.test.mjs` |
| AC-8 | Links resolve; a broken link is reported | isolated | Local | `test/links.test.mjs` + command |
| AC-9 | Remote CI blocks a broken PR | manual | GitHub Actions | First PR; owner Siergus; due 2026-11-30 |
| AC-10 | Every blocking gate observed failing | manual | Local | Adapter smoke-test record |

## Risks and ordering rationale

| Risk | Why it is first (or last) | Early signal |
| --- | --- | --- |
| Glob or escalation semantics are wrong | Everything downstream depends on the tier verdict | Unit tests fail on depth, separators, or protected paths |
| Secret ruleset misses a real credential class | A false sense of security is worse than no gate | Smoke test catches the known fake; limits are recorded |
| The CI workflow masks a failing pipeline | `tee` without `pipefail` reports success | Review checks for `set -o pipefail`; first PR (manual) |
| Remote CI cannot be proven locally | The workspace has no repository or remote | AC-9 remains pending with owner and expiry |
| Review size exceeds a normal slice | Bootstrap is inherently cross-cutting | Declared budget; human review; follow-up slice if findings grow |
| Protected-path escalation is self-referential | The slice creates the paths it declares protected | Tier T2 declared, not downgraded; recorded in A1/A2 |

## Review budget

| Field | Estimate |
| --- | --- |
| Files changed | 49 (the delivered diff; 55 was the planning estimate) |
| Logical lines changed | 2200 |
| If over budget, split by | Not split: the observable behavior is a single lane. A follow-up slice will remove the manual exceptions. |

This budget is larger than a normal T1 slice because the slice creates the verification spine
itself. It is declared, not hidden; the owner accepts it for the bootstrap.

## Gate G3 checklist

- [x] The slice is vertical and observable on its own.
- [x] Tier is declared; protected paths checked; escalation applied if needed.
- [x] Blast radius is complete.
- [x] Undo is executable by one person and has a time estimate.
- [x] Verification covers every AC, including the expensive ones.
- [x] The diff fits the review budget.
- [x] No blocking dependency on a later slice (AC-9 is a manual verification, not a
  dependency of the local outcome).
