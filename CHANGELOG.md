# Changelog

The factory is a product: it has a version, and material changes are recorded here.

## [Unreleased]

### Added

- Slice 0003 — fast-gate debt closed. `FORMAT` and `LINT` (Biome 2), `SAST`
  (ESLint 9 with `@microsoft/eslint-plugin-sdl` 1.1.0 + `eslint-plugin-security`),
  `HISTORY` (the repo-owned ruleset over full `git log -p --all` history), and a
  blocking `npm audit --audit-level=high` join the lane; `G4b`/`G4d`/`G4e` report
  PASS/FAIL only. New commands: `npm run check:format`, `check:lint`, `check:sast`,
  `check:secrets`, `check:secrets-history`.
- The waiver register now lives at [`docs/waivers.md`](docs/waivers.md), per
  08-artifacts §7; format, lint, SAST, history, and the audit waiver instance are
  retired there, each after the gate was observed failing once and green once.
- Decision records [ADR-0003](docs/decisions/ADR-0003-gate-tools.md) (tool choices)
  and [ADR-0004](docs/decisions/ADR-0004-sast-and-history-implementation.md)
  (supersedes ADR-0003's Semgrep/gitleaks clauses after the environment probe found
  no Python and no package manager; SDL + security plugin and in-repo history
  instead).

### Fixed

- `vcs.diff` / `G4f` now evaluates one complete local change set: committed changes since
  `--base`, index changes (including index-only staged edits), unstaged tracked edits,
  deletions, renames, typechanges, and untracked files. A base ref cannot begin with `-`,
  and a valueless `--base` is a usage error rather than a silent no-base run.
  The fast lane and `scripts/ci/blast-radius.mjs` both print the working-tree-only note
  when no `--base` is supplied.

## [0.2.0] — 2026-10-23

- Version control and the GitHub Actions fast lane for the factory repository.

### Added

- Phase 0 gate scaffolding: `factory.config.json`, `scripts/ci/fast.mjs`, and the tier/glob
  library in `src/tiers.ts` with unit tests.
- Machine gates for clean build, type check, fast tests, secret scan, dependency inventory,
  Markdown links, and blast radius.
- GitHub Actions fast lane (`.github/workflows/fast.yml`) that only invokes the repository
  script.
- Concrete Node.js/TypeScript stack adapter, with exceptions and a smoke-test record.
- Artifact convention (`docs/software-factory/08-artifacts.md`), ADR directory, and waiver
  register.
- First slice artifacts under `work/0001-enforce-phase-0/`.
- `AGENTS.md` context pack for agents working in this repository.

### Changed

- All mutable artifact templates now carry a `Version` field.
- The stack adapter template's copy path was corrected to `adapters/stack/`.
- Root README lists the executable layout and the current status.
- `G4d` no longer supports a line-level `secret-scan:allow` marker; a marker cannot suppress a
  credential finding, and A2 v2 records the rule.

### Known gaps

- Format, lint, and SAST ports are manual exceptions until Phase 2.
- The delivery adapter has not been proven on a remote GitHub Actions run.
- Secret scanning covers the working tree only, not history.

## [0.1.0] — 2026-10-23

### Added

- Operating model: principles, stations, gates, stack binding, agents, metrics, adoption.
- Artifact templates A1–A8.
- Adapter model for toolchain and delivery axes, with an illustrative GitHub Actions binding.
