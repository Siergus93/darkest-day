# AGENTS.md — context pack for this repository

This file is the entry point for any agent working on the Darkest Day factory. It is a
context pack, not a process of its own. The model lives in
[`docs/software-factory/`](docs/software-factory/README.md); where this file and the model
disagree, the model wins and this file is a defect.

## Read first

1. [`docs/software-factory/01-principles.md`](docs/software-factory/01-principles.md) — the
   invariants.
2. [`docs/software-factory/05-agents.md`](docs/software-factory/05-agents.md) — autonomy,
   roles, output contract.
3. [`docs/software-factory/08-artifacts.md`](docs/software-factory/08-artifacts.md) — where
   artifacts live and how they are versioned.
4. The active slice: [`factory.config.json`](factory.config.json) → `activeSlice`.

## Current state

- Factory version: `0.2.0` (see [`CHANGELOG.md`](CHANGELOG.md)).
- Active slice: `work/0002-vcs-faithful-diff`.
- Stack binding: [`adapters/stack/node-typescript.md`](adapters/stack/node-typescript.md).
- Delivery binding: [`adapters/ci/github-actions.md`](adapters/ci/github-actions.md).

## Environment

- Node.js 24 (`.nvmrc`), npm 11, git.
- Install: `npm ci`
- Build and type-check: `npm run build`
- Tests only: `npm test`
- Fast lane: `npm run fast -- --changed <comma-separated paths>`
  - With `--base <ref>`, the change set includes committed changes since the base plus index
    and working-tree changes, including index-only staged edits, deletions, renames,
    typechanges, and untracked paths. Without
    `--base` only the working tree is checked and both the lane and the blast-radius CLI say
    so; in CI pass `--base <sha>`.
  - The lane reads the active slice from `factory.config.json`.

## Boundaries

- Do not change `factory.config.json`, `scripts/ci/**`, `.github/**`, or `adapters/**`
  without expecting T2. They are protected because they can silently weaken verification.
- The blast radius for the active slice is in `work/0001-enforce-phase-0/A4-slice-plan.md`.
  A new scope is a return to S1/S3, not an edit to the current diff.
- Do not edit an accepted ADR. Supersede it with a new record.
- Do not edit a signed A5. Add a review finding or a new version of the artifact it verified.

## Autonomy

Default is **L2 Supervised** for T1–T2: implement the approved slice within its declared
bounds, make the gates pass, and hand over the diff and A5 for human review.

- T3: L1 (throwaway branch, review every diff).
- T0: L4 only for a proven narrow class; not assumed.
- The agent that built a change is not the sole verifier of it at T2+. Verification needs a
  fresh context, ideally a different model or an adversarial brief.

## Stop and ask when

- An acceptance criterion is ambiguous, contradictory, or untestable.
- The change needs a new dependency, service, or external integration.
- A protected path must change, or the blast radius must grow.
- The work needs an authn/authz, retention, money, or PII decision.
- A blocking gate fails twice for the same reason.
- Passing a gate would require weakening it, skipping a test, or widening a waiver.
- The spec and the code disagree and the spec is not clearly authoritative.

## Output contract

Every handoff ends with this record, with verbatim commands and exit codes:

```text
Slice:            <id and title>
Tier:             <tier, and whether it changed>
Artifacts:        <links to A2/A4/A5 updates>
Commands run:     <command -> exit code -> summary>
Criteria:         <AC id -> result -> evidence location>
Assumptions:      <what was assumed, and why>
Deviations:       <anything outside A4, declared before it happened>
Residual risk:    <known gaps, unrun checks, waivers requested>
Questions:        <blocking questions, or "none">
Next action:      <the single next gate or decision>
```

An agent summary is not evidence. A gate passes only on output a reviewer can reproduce.
