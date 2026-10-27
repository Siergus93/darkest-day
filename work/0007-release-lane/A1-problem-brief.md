# Problem brief (A1)

> Station S0 · Gate G0 · Keep this under one page.

| Field | Value |
| --- | --- |
| ID / title | 0007 — Deployment lane: immutable release artifacts on tag (G6a skeleton) |
| Owner | Siergus |
| Date | 2026-10-27 |
| Risk tier | T2 — `.github/workflows/**` and `factory.config.json` protected paths |
| Version | 1 |
| Links | [Spec](A2-spec.md) · [Slice plan](A4-slice-plan.md) · Roadmap: [docs/backlog.md](../../docs/backlog.md) |

## Problem

The factory can build and verify but cannot deploy: gates G6a–G7c are `n/a`, there is no
release workflow, and "deployment" exists only as prose in the README. The decision the
owner set (2026-10-27): deployment starts as a released immutable artifact — a checksummed
product archive attached to a tagged GitHub Release — with the process (tag → build →
checksum → attach) as close to future-production mechanics as possible without owning
infrastructure.

## Who is affected

Anyone who ever consumes a factory output artifact (agents, the owner, future slice
handoffs): today there is no way to pin, verify, or reference "what was produced when".
Without an immutable artifact, rollback (G6c) and provenance remain prose.

## Current workaround and why it is insufficient

Manual commands on one machine (`npm run build; git archive; sha256sum`) — insufficient
because they are unverified, unreproducible by others, and leave no record the gates can
count as evidence.

## Outcome

| Field | Value |
| --- | --- |
| Metric | First external evidence that a product artifact exists, is checksummed, and is re-downloadable |
| Baseline | 0 |
| Target | A `v*` tag produces a release workflow run that builds dist from a clean checkout, packs `factory-cli-v<version>.<ext>` + `SHA256SUMS`, attaches both to the GitHub Release, and the factory config's G6a row says `wired, smoke-tested` only after an observed run; the product is deployed exactly by "tag it" |
| Horizon | End of this slice |
| Measurement method | The workflow run URL in A5; the release URL; the checksum recomputed locally matches |
| What result would prove us wrong | A recreated tag from a different machine produces a different file for the same content, or the release exposes a mutable artifact (tag move changes bytes) |

## Non-goals

- Any hosted runtime (server, page, npm registry): G6b–G7c stay `n/a` with recorded
  reasons; G6b/G6c/G6d/G6e graduation is a later decision per real deployment.
- Sign-off automation: the release is cut by the OWNER's tag push (provenance = the tag
  on main after a merged PR), a process choice recorded here — no secrets beyond the
  default `GITHUB_TOKEN`.
- Windows artifact parity duties beyond what the archive contains: the artifact targets
  Node-24-consumers regardless of platform; CI runs one builder (ubuntu) — platform
  matrix is a later decision (record in A2 non-criteria).
- A second fast-lane workflow; this is a separate, lane-shaped release workflow scoped
  exactly to tagged pushes.

## Constraints

- Version coherence unchanged: the deployed artifact version == `package.json` version
  (v0.4.0 release cut rides with the slice, per the standing pattern).
- The artifact must be reproducible from the repo (no machine-local steps in the
  build pipeline; a pinned npm CI from the lockfile).
- Release automation runs only on `v*` tags — never on other branches/pushes.

## Assumptions and open questions

| # | Statement | How it will be tested | Blocking? |
| --- | --- | --- | --- |
| 1 | The factory CLI artifact is worth deploying first (v0.4.0 as both factory release and the CLI's first release) | The 0006 CLI is merged first; this slice deploys it | Yes — 0006 must be merged |
| 2 | Checksum + tag immutability give a sufficient "rollback": re-referencing the previous release | Recompute + diff against the previous release in A5 | No |
| 3 | GitHub Release is a faithful immutable artifact host for a file | A5: byte-compare re-downloaded artifact vs the local copy | No |

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
