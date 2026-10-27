# Slice plan (A4)

> Station S3 · Gate G3 · A slice is the smallest change that produces **observable**
> behavior. The tier declared here governs the whole change.

| Field | Value |
| --- | --- |
| ID / title | 0004 — Automated config-status check: keep gate declarations honest |
| Spec | [A2](A2-spec.md) v1; origin FU-1 in [0003 A4 v4](../0003-fast-gate-debt/A4-slice-plan.md) |
| Tier | T2 |
| Tier downgrade reason | n/a |
| Version | 2 |
| Owner | Siergus |
| Target release | Factory v0.3.1 (unreleased) |

## Observable outcome

Flipping a gate to `wired` without wiring, deleting a wrapper a `wired` gate depends on,
removing its lane row, or drifting `factoryVersion` from `CHANGELOG.md` each fail
`npm test` with a message naming the gate/field; a clean tree passes; the v0.3.0 release
cut lands (CHANGELOG, `factoryVersion`, `activeSlice` → this slice, AGENTS.md sync).

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | `test/**` (config.test.mjs: expectations table + assertions), `work/0004-config-status-check/**`, `.gitattributes` (new root file: `* text=auto eol=lf`), `factory.config.json` (release cut: `factoryVersion` 0.3.0, `activeSlice` pointer), `AGENTS.md` (current-state sync), `CHANGELOG.md` (release cut + new `[Unreleased]`), `work/README.md` (0003/0004 rows) | v2 adds `.gitattributes` (owner decision 2026-10-27): the drafting agent's lane run hit the Windows CRLF checkout defect — `core.autocrlf=true` with no attributes file materializes CRLF working trees the FORMAT gate rejects; the drift class is what this slice exists to prevent. `factory.config.json` is protected → T2. The release cut rides here because the `activeSlice` pointer must name a slice whose A4 exists. No `scripts/ci/**`, `.github/**`, or `adapters/**` source changes; break-and-restore smokes temporarily edit `scripts/ci/sast.mjs`/`fast.mjs` in the working tree and restore before commit. |
| Public contracts | none | Test-only additions; config fields change value, not shape. |
| Data / schema | none | — |
| Configuration / secrets | `factory.config.json` values only (`factoryVersion`, `activeSlice`) | Declared above; no secrets. |
| Infrastructure | none | — |
| Protected paths | yes | `factory.config.json` — the release cut, deliberate and declared. |

## Undo

| Method | Steps | Time to undo | Data loss risk |
| --- | --- | --- | --- |
| Revert commit | `git revert <commit>` | < 2 min | none |
| Manual revert | Delete the new assertions in `test/config.test.mjs`, restore `factoryVersion`/`activeSlice`/CHANGELOG/AGENTS.md/work README lines | < 10 min | none |

## Steps

Ordered by risk: the release cut is the most visible change and must land first so the
pointer is honest before the enforcement that reads it.

1. Release cut: `CHANGELOG.md` `[Unreleased]` → `## [0.3.0] — 2026-10-27` + empty
   `[Unreleased]`; `factoryVersion` → `0.3.0`; `activeSlice` →
   `work/0004-config-status-check`; AGENTS.md current-state + boundaries lines sync;
   `work/README.md` rows for 0003 (S5, merged via PR #4) and 0004.
2. Pin line endings: add `.gitattributes` (`* text=auto eol=lf`), run `git add --renormalize .`
   (must be a no-op — the index is already LF), and prove a fresh checkout materializes LF
   even on `core.autocrlf=true` (delete a tracked file, `git checkout --` it, read bytes).
3. Write the expectations table and assertions AC-1…AC-5 in `test/config.test.mjs`
   (set equality, status enum, wrapper existence, lane-row presence, version coherence).
4. Break-and-restore smokes for AC-2/AC-3/AC-4/AC-5; record every output verbatim in A5.
5. Full lane run `npm run fast -- --base b92ad65` (the 0003 merge commit); PR.

## Verification plan

| AC | Check | Tier of test | Where it runs | Evidence location |
| --- | --- | --- | --- | --- |
| AC-1 | Set equality wired gates ↔ table | isolated | Local + CI | A5 smoke (table diff) |
| AC-2 | Flip `G6a` → wired fails naming G6a; restore green | isolated | Local | A5 smoke 1 |
| AC-3 | Rename `scripts/ci/sast.mjs` fails naming G4b + path; restore green | isolated | Local | A5 smoke 2 |
| AC-4 | Remove `SAST` row label from `fast.mjs` fails naming G4b + label; restore green | isolated | Local | A5 smoke 3 |
| AC-5 | `factoryVersion`/CHANGELOG drift and pointer-without-A4 each fail; restore green | isolated | Local | A5 smoke 4 |
| AC-6 | Clean tree `npm test` green, added check < 1 s | isolated (timed) | Local + CI | A5 timing |
| AC-7 | `npm run fast -- --base b92ad65` green | command | Local | A5 lane run |
| AC-8 | `.gitattributes` present; renormalize no-op; fresh checkout of a tracked file is LF on `core.autocrlf=true` | isolated + command | Local | A5 smoke 5 |
| AC-9 | CI on the PR exits 0 | manual → observed | GitHub Actions | Run URL in A5 |

## Risks and ordering rationale

| Risk | Why this order | Early signal |
| --- | --- | --- |
| Set equality fails on first run (an actually-wired gate is mis-declared, or vice versa) | Step 2 surfaces it before any smoke; the fix is a status correction or a table line, both in-radius | First `npm test` after writing the table |
| Release cut breaks version-coherence assertion by construction | Cut lands in step 1, assertion in step 2 reads the already-consistent state | Same first test run |
| Smokes temporarily edit protected `scripts/ci/**` | Working-tree only, restored before commit, lane re-run proves restoration | Lane run in step 4 |

## Review budget

| Field | Estimate |
| --- | --- |
| Files changed | 6 (test + 3 docs + config + slice dir) |
| Logical lines changed | ~150 (test ~80, docs/release ~70) |
| If over budget, split by | Release cut into its own commit inside the slice; the check is not splittable |

## Gate G3 checklist

> Self-review done 2026-10-27 by the drafting agent; human G3 review pending.

- [x] The slice is vertical and observable on its own.
- [x] Tier is declared; protected paths checked; escalation applied if needed.
- [x] Blast radius is complete.
- [x] Undo is executable by one person and has a time estimate.
- [x] Verification covers every AC, including the expensive ones.
- [x] The diff fits the review budget.
- [x] No blocking dependency on a later slice.
