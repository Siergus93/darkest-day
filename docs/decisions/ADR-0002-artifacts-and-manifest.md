# ADR-0002 — Artifact layout, manifest, and waiver register

| Field | Value |
| --- | --- |
| ID | ADR-0002 |
| Title | Artifact layout, manifest, and waiver register |
| Status | accepted |
| Date | 2026-10-23 |
| Owner | Siergus |
| Tier | T2 |
| Supersedes | — |

## Context

The model names eight artifacts and a gate catalog, but the repository defined neither where
artifact instances live nor how a gate finds them. Three consequences followed:

1. `docs.link` evidence could point anywhere, so G0–G2 were unfalsifiable.
2. Waivers were recorded inside individual A5 files, so the "expiring waivers" health check
   had no single place to run against.
3. The tier scheme and protected paths existed only as prose, so G3/G4f could not be
   checked mechanically.

The first slice needs a convention, not a platform. A generator or database would add a
component before there is evidence it is needed.

## Decision drivers

- Evidence must be locatable by a third party from a change.
- Waivers must expire visibly, not by memory.
- One machine-readable source for tiers, protected paths, lanes, and gate status.
- Conventions must survive a stack change and a new contributor.

## Options considered

### Option 1 — Directory convention plus a manifest

**Description:** `work/NNNN-slug/` for A1/A2/A4–A8; `docs/decisions/` for ADRs;
`docs/waivers.md` for waivers; `factory.config.json` for policy. Gate scripts parse a small,
fixed set of Markdown shapes.

**Pros:** no new service; diffable; works with any editor; the manifest doubles as the gate
coverage source; conventions are testable with a link checker and unit tests.

**Cons:** Markdown parsing is a small failure surface; authors must keep the machine-readable
rows exact; the manifest can drift from the docs without review.

**Cost to reverse:** low. Move the directories and re-point the scripts.

### Option 2 — Generated artifacts from a tool

**Description:** A small CLI creates slice directories and validates schemas.

**Pros:** consistent shapes; less parser code.

**Cons:** builds the tool before the first slice proves the shapes; another component to own;
slower to start.

**Cost to reverse:** medium.

### Option 3 — Status quo: prose only

**Description:** Keep artifact names and let reviewers find evidence.

**Pros:** no convention to maintain.

**Cons:** the model's central claim — reproducible evidence — stays unenforceable.

**Cost to reverse:** high, because every early slice records evidence differently.

## Decision

Adopt Option 1. Slice artifacts live under `work/NNNN-slug/`; ADRs live in
`docs/decisions/`; waivers are registered in `docs/waivers.md`; `factory.config.json` is the
single machine-readable source for tiers, protected paths, lanes, and gate status. A4 keeps
its tier and backticked blast-radius globs in fixed rows so `vcs.diff` can check them.

## Consequences

**Positive:** G0–G2 gain resolvable links; G3/G4f become mechanical; waivers have an expiry
surface; gate coverage is computed rather than asserted.

**Negative:** authors must follow the exact row shapes; a generated artifact tool may still
be worth building after several slices.

**Neutral / follow-up:** revisit after five slices with real A8 data; if the conventions
caused rework at S3 or S5, simplify them.

## Revisit trigger

- Two slices in a row re-enter S3 because of the artifact layout.
- The waiver register has no entries after five slices (the mechanism may be unnecessary).
- A second deployable unit needs a different layout.

## Links

- Problem brief: [`../../work/0001-enforce-phase-0/A1-problem-brief.md`](../../work/0001-enforce-phase-0/A1-problem-brief.md)
- Spec: [`../../work/0001-enforce-phase-0/A2-spec.md`](../../work/0001-enforce-phase-0/A2-spec.md)
- Convention: [`../software-factory/08-artifacts.md`](../software-factory/08-artifacts.md)
- Related decisions: [ADR-0001](ADR-0001-tooling-stack.md)
