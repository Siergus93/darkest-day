# Changelog

The factory is a product: it has a version, and material changes are recorded here.

## [Unreleased]

## [0.3.1] — 2026-10-27

### Added

- Slice 0005 — the SAST gate's coverage decision (FU-2). A local rule
  (`factory/literal-command-exec`, in `scripts/ci/eslint-rules/`) joins the pack:
  the `child_process` exec family (`exec`, `execFile`, `execSync`, `execFileSync`)
  is banned on raw commands — literal or template — closing the literal-argument
  hole where `exec("…")` sailed through as PASS. Dynamic commands stay covered by
  `security/detect-child-process`. `spawn`/`spawnSync` with argument arrays remains
  the sanctioned pattern (and the repo's only `child_process` usage). Decision and
  coverage matrix recorded in the ADR-0004 amendment and provable in
  `test/sast-literal.test.mjs`. The SAST wrapper output and the G4b factory note
  now state the decided coverage on every PASS. FU-5 closes here: `package.json`
  is the third leg of the version-coherence assertion (version == `factoryVersion`
  == newest released CHANGELOG section).

### Added (planning)

- Slice 0005 prepared (S3): A1/A2/A4 for the SAST literal-argument coverage decision
  (FU-2) — probe-first, decide widen-vs-boundary, record in an ADR-0004 amendment;
  the v0.3.1 release cut rides with it and closes FU-5 (`package.json` joins the
  version-coherence chain).
- Nice-to-have follow-up register at [`docs/backlog.md`](docs/backlog.md)
  (FU-3, FU-4 parked with mitigations stated).
- Slice 0004 — automated config-status check: `test/config.test.mjs` pins every
  `status: "wired"` gate in `factory.config.json` to its wrapper files and lane rows
  (both directions), enforces the status vocabulary, and checks `factoryVersion`
  against the newest released CHANGELOG section and `activeSlice` against its A4.
  A `.gitattributes` (`* text=auto eol=lf`) makes every checkout byte-identical on
  all platforms, closing the Windows `core.autocrlf` CRLF drift that broke the FORMAT
  gate on fresh checkouts.

## [0.3.0] — 2026-10-27

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
