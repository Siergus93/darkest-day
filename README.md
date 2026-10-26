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

`v0.2.0` — Phase 0 gate scaffolding is wired: clean build, type check, fast tests, secret
scan, link check, and blast-radius/tier escalation, plus a thin GitHub Actions fast lane and
a Node.js/TypeScript stack adapter. Format, lint, and SAST remain manual exceptions; the
delivery adapter is pending its first remote run. See
[CHANGELOG](CHANGELOG.md) and [07-adoption](docs/software-factory/07-adoption.md).
