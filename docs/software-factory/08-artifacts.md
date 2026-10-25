# 08 — Artifacts, versions, and waivers

The model says context is a versioned artifact and a gate passes on evidence someone else
can locate. This document defines **where** those artifacts live and **how** they are cited,
so `docs.link` and `vcs.diff` can be checked rather than assumed.

This is a factory convention, not a stack rule. It changes through a decision record like
any other factory change.

---

## 1. Workspace layout

```text
factory.config.json            machine-readable policy: tiers, protected paths, gates, lanes
docs/
  software-factory/            the operating model
  decisions/                   ADRs that outlive a slice
  waivers.md                   the active waiver register
templates/                     blank artifacts A1-A8
work/
  0001-enforce-phase-0/
    A1-problem-brief.md
    A2-spec.md
    A4-slice-plan.md
    A5-evidence-pack.md
    A6-release-record.md       when something is released
    A7-runbook.md              when a capability is operated
    A8-learning-review.md      at the declared horizon
```

Rules:

- **One directory per slice**, named `NNNN-slug`, never reused or renumbered.
- **A3 does not live in the slice.** Decision records go to `docs/decisions/` because they
  outlive the slice that produced them. A2/A4 link to the ADR.
- **A5 is permanent.** Raw logs may expire; the record and the command that produced it do
  not.
- **Do not delete a finished slice.** Supersede it with a later one; the history is the
  evidence trail.

## 2. Identifiers

| Thing | Format | Example |
| --- | --- | --- |
| Slice | `NNNN-slug` | `0001-enforce-phase-0` |
| Acceptance criterion | `AC-N` within a spec | `AC-3` |
| Decision record | `ADR-NNNN-slug` | `ADR-0001-tooling-stack` |
| Gate | Catalog ID | `G4d` |
| Port | Capability name | `secrets.scan` |

Acceptance criterion IDs are stable across spec versions. If a criterion is removed, the
spec version increments and A5 records the removal; IDs are not recycled.

## 3. Versions

Every mutable artifact (A1, A2, A4, A6, A7, A8) has a `Version` field, starting at `1`.
A5 records the versions it verified; A3 is immutable by definition.

- Increment when the artifact changes **after a gate has passed against it**.
- A5 cites the exact A2/A4 versions it verified. A link without a version is not evidence.
- ADRs are immutable. Correct one by writing a new record with `Supersedes:`.
- A1's outcome metric is versioned too: changing the target after results are known is a
  new version and must be recorded in A8, not silently edited.

## 4. Machine-readable conventions

The gate scripts read a small, fixed part of the Markdown. Keep these shapes exact.

**Tier** — in A4:

```markdown
| Tier | T1 |
```

**Downgrade reason** — in A4, required when the declared tier is below the required tier:

```markdown
| Tier downgrade reason | tooling-only; no runtime surface | <!-- required if lowered --> |
```

Use `n/a` when the declared tier was not lowered.

**Blast radius** — in A4, every declared path glob is backticked:

```markdown
| Paths / modules | `src/**`, `test/**`, `factory.config.json` | |
```

The gate compares changed paths to these globs and to `protectedPaths` in
`factory.config.json`. A path outside the globs fails G4f. Touching a protected path
escalates the required tier.

**Gate IDs** — in A5, use the catalog IDs (`G4a`, `G5c`, …). The evidence pack template
already lists the current set.

## 5. The manifest

`factory.config.json` is the single source for:

- the tier scheme and each tier's ceremony,
- protected paths and the tier they escalate to,
- lane membership and budgets,
- the gate catalog, its enforcement class, its ports, and whether it is wired and
  smoke-tested.

If the docs and the manifest disagree, the manifest wins for automation and the docs are
wrong. Changing the manifest is a protected-path change: T2, reviewed, with an ADR if it
changes policy rather than status.

`activeSlice` points at the slice the fast lane checks. Update it when the active slice
changes; in CI the workflow reads the same field. Do not let it drift from the PR.

## 6. Gate coverage

Gate coverage is computed from the manifest, not from a feeling:

```text
coverage = blocking gates for the current tier that are wired AND smoke-tested
           ÷ blocking gates required for the current tier
```

A gate counted as covered must have been observed **failing** at least once. That record
lives in the adapter smoke-test table and is linked from A5. A gate that has only ever been
green is suspected, not trusted.

## 7. Waivers

A waiver is a recorded acceptance of risk. The register is `docs/waivers.md`; each row links
the A5 that holds the detail.

Required fields: gate, slice/A5 link, reason, blast radius, compensating control, owner,
expiry date. An expired waiver fails the gate. Waivers are never allowed for G4d
(secrets), G5c (authorization), or any T3 step without human sign-off.

Add the row when the waiver is granted, not when it is remembered.

## 8. Evidence retention

| Evidence | Record of truth | Lifetime |
| --- | --- | --- |
| Gate verdict and commands | A5 in `work/` | Permanent |
| Raw CI logs and reports | CI artifact | 30–90 days |
| Adapter smoke test | Stack adapter | Permanent |
| Approval | A5 sign-off | Permanent |
| Waiver | `docs/waivers.md` + A5 | Until expiry |

Never cite a CI artifact URL as the only evidence for a decision that must outlive it. Copy
the relevant output into A5.

## 9. Starting a slice

1. Create `work/NNNN-slug/` and copy A1 from `templates/`.
2. Fill A1 and pass G0. If the outcome cannot fail, stop.
3. Fill A2 and pass G1; blocking questions must be zero.
4. Write ADRs only for choices that are expensive to reverse.
5. Fill A4; declare the tier, protection escalation, blast radius globs, and undo.
6. Point `activeSlice` at the new directory.
7. Run the fast lane. Break a gate deliberately once to confirm it can fail.
8. At the horizon, write A8 and feed it into the next A1.
