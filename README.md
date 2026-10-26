# Darkest Day — Software Factory

This repository holds the operating model for a small, **language-agnostic software
factory**: a repeatable way to take a problem to a running, observable product without
tying the process to a stack, framework, or methodology.

It is designed for one human plus AI agents, and scales to a small team without a redesign
because coordination happens through artifacts and gates rather than meetings.

**Start here:** [docs/software-factory/README.md](docs/software-factory/README.md)

```text
docs/software-factory/   the operating model
docs/decisions/          decision records (ADRs)
templates/               the artifacts the model requires
adapters/                stack and delivery bindings (port -> tool -> command)
work/                    artifact instances, one directory per slice
factory.config.json      tiers, protected paths, gates, and lanes
scripts/ci/              gate entry points with local equivalents
src/                     tier and glob logic (TypeScript)
test/                    isolated tests
.github/workflows/       thin CI invocation, no gate logic
AGENTS.md                context pack for agents working in this repository
```

## Commands

```bash
npm ci
npm run build
npm test
npm run fast -- --changed "work/0002-vcs-faithful-diff/A4-slice-plan.md,scripts/ci/fast.mjs"
```

The fast lane reads the active slice from `factory.config.json`. With `--base <ref>` it
combines committed changes since the base with index and working-tree changes, including
index-only staged edits, deletions, renames, typechanges, and untracked paths. Without
`--base` it checks only the working tree; the fast lane and
`node scripts/ci/blast-radius.mjs` print that limitation. CI uses `--base`. Without git, pass
an explicit `--changed` list.

## Status

`v0.3.0` — Phase 0 stream, all fast gates wired. The lane enforces: clean build, type
check, format (Biome), lint (Biome), SAST (ESLint + `@microsoft/eslint-plugin-sdl` +
`eslint-plugin-security`), fast tests, secret scan (working tree **and** full git history),
and a **blocking** high/critical `npm audit` — plus the link check and blast-radius/tier
escalation, in a thin GitHub Actions fast lane. Tool defaults and their ADRs:
[ADR-0003](docs/decisions/ADR-0003-gate-tools.md),
[ADR-0004](docs/decisions/ADR-0004-sast-and-history-implementation.md); the waiver
register is [docs/waivers.md](docs/waivers.md). The VCS-faithful change set, format, lint,
SAST, audit, and history smoke tests are in the
[adapter record](adapters/stack/node-typescript.md). Delivery adapter proven on the first
remote runs (PR #1, PR #3). See [CHANGELOG](CHANGELOG.md) and
[07-adoption](docs/software-factory/07-adoption.md).
