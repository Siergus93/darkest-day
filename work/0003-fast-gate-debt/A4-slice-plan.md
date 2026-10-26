# Slice plan (A4)

> Station S3 · Gate G3 · A slice is the smallest change that produces **observable**
> behavior. The tier declared here governs the whole change.

| Field | Value |
| --- | --- |
| ID / title | 0003 — Close the fast-gate debt: format, lint, SAST, audit, and secret history |
| Spec | [A2](A2-spec.md) v2; per [ADR-0003](../../docs/decisions/ADR-0003-gate-tools.md); [ADR-0004](../../docs/decisions/ADR-0004-sast-and-history-implementation.md) supersedes the SAST and history-scan tool choice |
| Tier | T2 |
| Tier downgrade reason | n/a |
| Version | 3 |
| Owner | Siergus |
| Target release | Factory v0.3.0 (unreleased) |

## Observable outcome

A deliberated unformatted file, a lint-violating edit, a SAST-matching injection pattern, a
high/critical-vulnerability lockfile, and a credential-in-history commit each fail the fast
lane (or the named history step) with a file/line or commit message and exit 1. A clean tree
passes the whole lane under the budget. The gate summary reports `FORMAT`, `LINT`, `SAST`,
`AUDIT`, and `SECRETS-HISTORY` rows that are only ever PASS or FAIL — no `PARTIAL` from an
absent tool.

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | `scripts/ci/**` (format.mjs, lint.mjs, sast.mjs, secrets-history.mjs, fast.mjs; lib: engines.mjs, format-lint.mjs, sast.mjs, secrets-history.mjs), `test/**`, `biome.json`, `eslint.config.mjs`, `docs/decisions/ADR-0003-gate-tools.md`, `docs/decisions/ADR-0004-sast-and-history-implementation.md`, `docs/waivers.md`, `docs/**`, `.github/workflows/fast.yml`, `work/0003-fast-gate-debt/**`, `work/README.md`, `factory.config.json`, `adapters/stack/node-typescript.md`, `package.json`, `package-lock.json`, `CHANGELOG.md`, `README.md` | Three tool wrappers + one history scanner + lane composition + the configs the tools read. `scripts/ci/**`, `.github/**`, `factory.config.json`, and `adapters/**` were the paths that forced T2, and they are inside this slice on purpose. A4 v3 adds `biome.json`, `eslint.config.mjs`, and `docs/waivers.md`, which S4 discovered at the first full-lane run; the two configs are the files the wiring exists to read, and `docs/waivers.md` is where 08-artifacts §7 puts the register the retired waiver rows live in. The signed 0002 artifacts are untouched; waiver retirement happens in the register, not in A5. |
| Public contracts | `factory.config.json` gate statuses change `PARTIAL` → `wired` as observations land (additive); new `npm run` targets `check:format` / `check:lint` / `check:sast` / `check:secrets-history`; CLI flags and exit codes unchanged | New tool names are additive. |
| Data / schema | none | No runtime store; fixture files are build-time only. |
| Configuration / secrets | `factory.config.json` (statuses, time budget note), `adapters/*`; no secrets committed — fixture secret patterns live in test code only and are never real. | — |
| Infrastructure | `.github/workflows/fast.yml` gains `install` steps for the three binaries and a `runAudit`, `runSast`, `runHistoryScan` step. No additional workflow file, no second lane. | — |
| Protected paths | yes | Escalated to T2 by `scripts/ci/**`, `.github/**`, `factory.config.json`, `adapters/**`. |

## Undo

| Method | Steps | Time to undo | Data loss risk |
| --- | --- | --- | --- |
| Revert commit | `git revert <commit>` | < 5 min | none |
| Manual revert | Remove the three `scripts/ci` wrapper files and the the repo-owned history scanner rule, restore `fast.mjs` from `main`, restore `factory.config.json` gate statuses to `PARTIAL`/advisory, remove dev deps from `package.json` + `npm install` | < 15 min | none |
| Disable CI | Delete or disable the additions inside `.github/workflows/fast.yml`; lane falls back to the current 0002 behavior | < 2 min | none |

## Steps

Ordered by risk: the assumption most likely wrong is "the tools install and consume the
tree deterministically on both platforms", so installation/finding is first.

1. Install and pin Biome, the SDL security plugin, the repo-owned history scanner at exact versions; record how the CI runner
   downloads each (package-managed or pinned URL). Verify all three run on Windows first.
2. Write the wrapper scripts independently: `format.mjs`, `lint.mjs`, `sast.mjs`,
   `secrets-history.mjs`. Each supports `--check` / `--report` semantics, exit 1 on
   findings, exit 0 on green, and resolves its binary via the script path (no PATH
   dependency). Each gets unit tests including the break-and-restore fixtures.
3. Probe pre-existing violations on the current tree **before** the wrappers gate on any
   rule: format, lint, SAST, secrets. Any finding is fixed here, not shipped red. If a
   class of findings cannot be fixed in-slice, record a `PARTIAL` gate row and a waiver.
4. The audit-failure fixture: create a scratch package-lock (from a known-vulnerable
   package) that makes `npm audit --audit-level=high` exit 1 with its advisory name. Then
   make `G4e` blocking.
5. Compose the lane: add the four rows to `fast.mjs`'s gate summary, with explicit ordering
   (format → lint → SAST → tests → secrets → history) so the cheapest gate fails first.
   Update `.github/workflows/fast.yml` to install and invoke the wrappers.
6. Update `factory.config.json` (`G4b`/`G4e`/`G4d` notes and statuses), the adapter record
   (`adapters/stack/node-typescript.md` — drop the "format, lint, SAST are exceptions"
   clause), the README, CHANGELOG, and ADR-0003's record of the actually-chosen versions.
7. Break-and-restore smokes: inject each AC-1…AC-6 violation, run the lane, watch each fail
   with the exact gate + file/line, restore, run green. Record every output verbatim in A5.
8. Retire four waivers in the 0002 A5 register (G4b format/lint/SAST, G4e audit, G4d
   history) by marking them retired with the gate + evidence link, and moving `activeSlice`
   back if it was left on 0002. Restore `activeSlice` to `work/0003-fast-gate-debt` before
   any gate-affecting commit, then to whatever the next active slice is.

## Verification plan

| AC | Check | Tier of test | Where it runs | Evidence location |
| --- | --- | --- | --- | --- |
| AC-1 | Unformatted file fails `G4b`-format, restore passes; exit 1; file:line message | isolated | Local + CI | A5 smoke 1 (before/after script output) |
| AC-2 | Lint-violating edit fails `G4b`-lint with a rule id and file:line; restore passes | isolated | Local + CI | A5 smoke 2 |
| AC-3 | SAST-pattern injection fails `G4b`-sast with the rule id; restore passes | isolated | Local + CI | A5 smoke 3 |
| AC-4 | All three wired and sum of added lane wall-clock ≤ 30 s | isolated + command | Local (timed) | A5 timing table |
| AC-5 | Audit fixture lockfile exits 1 naming the advisory; real lockfile exits 0 | isolated | Local | A5 audit-fault probe + fixture removed after |
| AC-6 | the repo-owned history scanner exits 1 on a scratch history containing a fake key (naming file + commit); real history exits 0 within the added-time target | isolated | Local + CI | A5 smoke 4 (commit hash + redacted output); timing |
| AC-7 | `factory.config.json` statuses match actual observations for G4b/G4d/G4e | isolated | Local | `test/config.test.mjs` update |
| AC-8 | adapters/stack/node-typescript.md matches the wired set; no stale "format/lint/SAST are exceptions" sentence | isolated + read | Local | File diff in A5 |
| AC-9 | `npm run fast -- --base main` green after all wiring, README/CHANGELOG updated | command | Local | A5 lane-run summary |
| AC-10 | CI run on the PR exits 0 with the same gate rows | manual → observed on first PR run | GitHub Actions | Run URL in A5 |

## Risks and ordering rationale

| Risk | Why it is first (or last) | Early signal |
| --- | --- | --- |
| Binaries install/run differently on Windows vs Linux | Everything else depends on the wrappers existing; step 1 tests this | CI run fails before the lane runs |
| Pre-existing violations exist in the tree today | If unaddressed, step 3 surfaces them immediately; step 4 is only blocking-after-observed-failing | Probe run of each wrapper on the current tree |
| the repo-owned history scanner false positives on the repo's existing text | Rollback path is an allow-list entry, gated by the scratch-commit smoke; recovery is documented | The probe in AC-6 |
| Lane wall-clock drift | Timing is an AC with a numeric target (AC-4/AC-6); regression is visible in every A5 | Timing table |
| `activeSlice` staging | Handled by making step 8 explicit instead of implicit | The lane's `G4f` row names the wrong slice on the lane summary |

## Review budget

| Field | Estimate |
| --- | --- |
| Files changed | ~15–20 (3–4 new wrappers + tests, lane edits, workflow, config, adapter, docs, lockfile) |
| Logical lines changed | ~400–600 (tool configs) |
| If over budget, split by | The audit-failure fixture and the the repo-owned history scanner history scan into a follow-up slice; do not split Biome/lint/SAST, they share the same wiring pattern. |

## Gate G3 checklist

> Self-review done 2026-10-26 by the drafting agent; human G3 review pending.

- [x] The slice is vertical and observable on its own.
- [x] Tier is declared; protected paths checked; escalation applied if needed.
- [x] Blast radius is complete.
- [x] Undo is executable by one person and has a time estimate.
- [x] Verification covers every AC, including the expensive ones.
- [x] The diff fits the review budget.
- [x] No blocking dependency on a later slice.
