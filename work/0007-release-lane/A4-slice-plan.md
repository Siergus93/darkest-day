# Slice plan (A4)

> Station S3 · Gate G3 · A slice is the smallest change that produces **observable**
> behavior. The tier declared here governs the whole change.

| Field | Value |
| --- | --- |
| ID / title | 0007 — Deployment lane: immutable release artifacts on tag (G6a skeleton) |
| Spec | [A2](A2-spec.md) v1 · dependency: slice [0006](../0006-factory-cli/) merged |
| Tier | T2 |
| Tier downgrade reason | n/a |
| Version | 2 (v2: paths glob corrected — `work/0007/**` never matched `work/0007-release-lane/**`; caught by G4f on the first lane run) |
| Owner | Siergus |
| Target release | Factory v0.4.0 — the first deployed artifact (the factory CLI) |

## Observable outcome

Pushing a `v*` tag produces a workflow run that builds from a clean checkout, attaches
`factory-cli-v<version>.zip` + `SHA256SUMS` to the corresponding GitHub Release, and —
only after this is observed — `G6a` reports `wired` in `factory.config.json`.

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | `.github/workflows/**` (new release workflow), `test/**` (extend the 0004 config-status evidence table for release-lane gates), `factory.config.json` (G6a status flip AFTER observation; `activeSlice` pointer; `G6b–G6e` notes extended to say they stay `n/a` and why), `package.json` (version 0.4.0 + `bin`), `package-lock.json` (version), `CHANGELOG.md` (release cut), `AGENTS.md` (version + slice line), `work/README.md` + `work/0007-release-lane/**` (v2 glob), `docs/backlog.md` (roadmap row) | `.github/workflows/**` and `factory.config.json` are protected → the real magic of this slice. No workflow change to the fast lane (A2 AC-8). |
| Public contracts | `package.json` `bin` (→ `dist/cli.js`) — the product's first named surface, inside the artifact only until any registry decision |  |
| Data / schema | none |  |
| Configuration / secrets | workflow uses only the default `GITHUB_TOKEN` (contents write, scoped to the repo); no PAT, no external secret | Recorded in A2. |
| Infrastructure | one new workflow file; no runners added beyond it |  |
| Protected paths | yes | both above. |

## Undo

| Method | Steps | Time to undo | Data loss risk |
| --- | --- | --- | --- |
| Revert commit + delete tag | `git revert <commit>`; delete the remote tag and release (if any were cut) | < 5 min | none (artifact is regenerable) |
| Manual revert | remove the workflow file; restore config statuses to `n/a`; restore version fields | < 10 min | none |

## Steps

1. Write the release workflow per A2 (tag trigger, npm ci + build + test, pack,
   checksum, attach, notes from the CHANGELOG section).
2. Extend the 0004 evidence table for release-lane gates (workflow-file evidence shape)
   BEFORE the status flip, so `G6a: wired` can be declared and verified by the machine
   together with the release-cut tests.
3. Dry-run the packing steps locally ONLY as a smoke of the pack list (the workflow is
   not run locally); record the output as A5 evidence.
4. Merge; then the OWNER cuts `v0.4.0` on main after the v0.4.0 release cut lands
   (version coherence asserted by the config test BEFORE the tag exists, so a merge
   without the cut cannot tag).
5. Observe the run; download the artifact; recompute the checksum (AC-3); spot-check
   the unpacked CLI (AC-5); recomputed byte-compare (AC-4).
6. Flip `G6a` → `wired`, `smokeTested: true` with the run/asset URLs captured in A5;
   extend G6b–G6e notes with reasons they remain `n/a`.
7. Update A6 release record (the 0001 pattern: a release record artifact, not config).

## Verification plan

| AC | Check | Tier | Where | A5 evidence |
| --- | --- | --- | --- | --- |
| AC-1 | Tag → observed workflow run green | observed | GitHub Actions | Run URL |
| AC-2 | Asset list = archive + SHA256SUMS exactly | observed | GitHub | Screens/URL |
| AC-3 | Checksum recomputation matches | manual echo of CI | Local | hash command output |
| AC-4 | Byte-compare redownload | manual | Local | fc/comparison output |
| AC-5 | Unpacked CLI runs status/check sanely | manual+isolated | Local | invocation output |
| AC-6 | G6a wired only post-observation; G6b–G6e n/a with reasons | isolated | Local | config test + A5 |
| AC-7 | v0.4.0 three-way version chain | isolated | Local | config test |
| AC-8 | Fast lane unaffected | command | CI | PR lane run URL |

## Risks and ordering rationale

| Risk | Why the order | Signal |
| --- | --- | --- |
| A tag cut while the release cut hasn't reached main | The version chain (config test) is green BEFORE any tag can pass; owner tags only merged main | Workflow fails at checkout, or the config assertion goes red before the tag |
| Release-asset replacement (immutability violation) | Assets must never be re-uploaded; the workflow fails loudly on a re-run instead of replacing | Workflow upload-step configuration + A5 statement |
| G6a flipped without an observed run | Step order enforces it: steps 1–4 observe, only step 5 touches the config status | The statuses-follow-observations lesson from 0005 |
| The tag is not the commit artifact was built from | The workflow prints the commit sha it built; A5 records sha ↔ artifact checksum together | Mismatch visible in A5 |

## Review budget

| Field | Estimate |
| --- | --- |
| Files changed | 7–9 |
| Logical lines changed | ~150–250 (workflow ~80, config edits ~40, docs ~30, A6 record new) |
| If over budget, split by | Split the A6 release record into a follow-up documentation slice; never split the workflow+status flip |

## Gate G3 checklist

> Self-review done 2026-10-27 by the drafting agent; human G3 review pending.

- [x] The slice is vertical and observable on its own.
- [x] Tier is declared; protected paths checked; escalation applied if needed.
- [x] Blast radius is complete.
- [x] Undo is executable by one person and has a time estimate.
- [x] Verification covers every AC, including the expensive ones.
- [x] The diff fits the review budget.
- [x] No blocking dependency on a later slice. (Depends on 0006 — declared.)
