# ADR-0001 — Node.js and TypeScript for factory tooling

| Field | Value |
| --- | --- |
| ID | ADR-0001 |
| Title | Node.js and TypeScript for factory tooling |
| Status | accepted |
| Date | 2026-10-23 |
| Owner | Siergus |
| Tier | T2 |
| Supersedes | — |

## Context

Phase 0 requires three machine gates — clean build, fast tests, secret scan — plus a blast
radius check, and a way to run them locally before CI. The factory is language-agnostic, so
this decision binds only the **tooling that enforces the factory**, not the eventual product
stack.

The workspace has Node.js 24.14 and npm 11.11 installed, git 2.39, and no Python. One human
plus agents operate the repository. The tooling must run on Windows now and Linux in CI
without a platform-specific second implementation.

## Decision drivers

- Available without provisioning a new runtime.
- A real type check, because the tier and glob logic is a correctness boundary.
- A test runner with no external framework dependency.
- Cross-platform commands that behave identically locally and in CI.
- Minimal dependency surface: every dependency is supply-chain risk.

## Options considered

### Option 1 — Node.js 24 + TypeScript 7 + node:test

**Description:** Tier/glob logic in `src/tiers.ts`, compiled by `tsc`; tests in `test/`
using the built-in `node:test`; CI scripts in ESM.

**Pros:** runtime already present; one dev dependency (`typescript`); built-in test runner;
the same runtime runs the gates and the code under test; native type stripping and a native
compiler keep startup fast.

**Cons:** TypeScript 7's native toolchain is young; Node-only; the secret scanner is
repository-owned rather than a maintained security product.

**Cost to reverse:** low. Replace the stack adapter and the scripts; tiers, gates, and
stations do not change.

### Option 2 — Python + pytest + ruff

**Description:** Gate logic and tests in Python, invoked from CI.

**Pros:** concise scripts; mature linting.

**Cons:** Python is not installed; adds a runtime and packaging step to a one-person
factory; does not remove the need for a Node-free CI image.

**Cost to reverse:** low to medium, but the bootstrap cost is paid immediately.

### Option 3 — Go or Rust single binary

**Description:** Compile one gate runner binary.

**Pros:** strong typing; no runtime dependency at run time.

**Cons:** neither toolchain is installed; cross-compilation and release handling are extra
work before the first gate exists.

**Cost to reverse:** medium.

## Decision

Use Node.js 24 and TypeScript 7 for the factory's own tooling. TypeScript is used only for
the tier/glob logic; gate orchestration stays in plain ESM so it runs without a build step.
The product stack remains undecided and this record does not bind it.

## Consequences

**Positive:** gates can be written and run today; one dev dependency; the tier logic is
type-checked and unit-tested; the same command runs locally and in GitHub Actions.

**Negative:** the secret scanner is a repo-owned ruleset with known limits; format, lint,
and SAST remain unwired and are recorded as adapter exceptions; TypeScript 7 must be
re-tested when the toolchain changes.

**Neutral / follow-up:** adopt a maintained secret scanner and a formatter in Phase 2; pin
the toolchain through the lockfile and `.nvmrc`.

## Revisit trigger

Reopen this decision when any of the following becomes true:

- a product stack is chosen and its tooling conflicts with Node 24,
- the fast lane exceeds its 10-minute budget for two consecutive weeks,
- TypeScript 7 breaks the build on a pinned runner,
- a maintained secret scanner replaces the repository ruleset.

## Links

- Problem brief: [`../../work/0001-enforce-phase-0/A1-problem-brief.md`](../../work/0001-enforce-phase-0/A1-problem-brief.md)
- Spec: [`../../work/0001-enforce-phase-0/A2-spec.md`](../../work/0001-enforce-phase-0/A2-spec.md)
- Related decisions: [ADR-0002](ADR-0002-artifacts-and-manifest.md)
- Evidence: [`../../work/0001-enforce-phase-0/A5-evidence-pack.md`](../../work/0001-enforce-phase-0/A5-evidence-pack.md)
