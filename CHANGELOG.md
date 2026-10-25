# Changelog

The factory is a product: it has a version, and material changes are recorded here.

## [0.2.0] — 2026-10-23

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
