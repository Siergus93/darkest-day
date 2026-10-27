# Release record (A6)

> Station S6 · Gate G6 · What shipped, where, and how to reverse it. Generated from the
> pipeline where possible; hand-written records drift.

| Field | Value |
| --- | --- |
| Release ID | `factory-cli-v0.4.0` — the factory's first deployed artifact |
| Slices included | 0006 — the factory CLI; 0007 — the deployment lane (G6a skeleton) |
| Artifact version / digest | `0.4.0` in `package.json`; sha256 `b16349c7839d4ce6169adbd1a6423bee61006f0780a072a76a01d30ea4a035bb` |
| Commit | `6a83203` (merge of PR #9); tag `v0.4.0` pushed by the owner |
| Tier (highest included) | T2 — escalated by protected paths |
| Version | 1 |
| Release owner | Siergus |
| Date | 2026-10-27 |

## Environments

| Environment | Deployed at | By | Verification result |
| --- | --- | --- | --- |
| GitHub Release (artifact host) | 2026-10-27 | the `release` workflow, triggered by the owner's tag push | run [40574701583](https://github.com/Siergus93/darkest-day/actions/runs/40574701583) green; checksum + re-download verified (A5) |
| Local (Windows, Node 24.14) | 2026-10-27 | Siergus | unpacked released artifact: `status` exit 0, `check` exit 0 in a fixture checkout |
| Staging | — | — | not applicable: no hosted runtime |
| Production | — | — | not applicable: the artifact host is the deployment for now |

## Changes

| Type | Description | Reference |
| --- | --- | --- |
| Behavior | `factory status` / `factory check [--base <ref>]` — the factory's verdicts are callable by a person | `src/cli.ts` (slice 0006, PR #8) |
| Behavior | A `v*` tag push builds, packs, checksums, and attaches the product artifact to a GitHub Release | `.github/workflows/release.yml` (slice 0007, PR #9) |
| Contract / API | First named product surface: `package.json` `bin` (`factory` → `dist/cli.js`), shipped inside the artifact; not yet a registry contract | `package.json` |
| Schema / data | none | — |
| Configuration | `G6a` → `wired, smokeTested: true` after the observed v0.4.0 run; G6b–G6e stay `n/a` with recorded reasons; `factoryVersion`/`activeSlice` release cut | `factory.config.json` |
| Dependencies | no new dependency (stdlib + devDependencies only) | `package-lock.json` |

## Configuration and secrets

- Config keys changed: `factoryVersion` 0.4.0, `activeSlice` → `work/0007-release-lane`, `G6a` status.
- Secret sources (names only, never values): default `GITHUB_TOKEN` only, `contents: write`, scoped to the repo. No PAT, no environment secrets.
- Environment differences: the artifact is dependency-free; consumers need only Node 24.

## Rollback

| Aspect | Procedure |
| --- | --- |
| Artifact | The release is immutable: the tag is never moved and assets are never re-uploaded (the workflow fails loudly on re-existence). Roll back = re-reference the previous release. v0.4.0 is the first release, so there is no previous to re-reference. |
| Workflow | `git revert` the slice commits; delete the tag and release if a bad one was cut (< 5 min, artifact regenerable). |
| Config | Restore `G6a` to `n/a` with the original note; the config test refuses a wired status without its evidence row. |

## Verification chain

Tag `v0.4.0` → commit `6a83203` (main after PR #9, fast lane green in CI) →
release run [40574701583](https://github.com/Siergus93/darkest-day/actions/runs/40574701583)
→ asset sha256 `b16349c7…` == recomputed == re-downloaded → unpacked artifact
invoked successfully. Evidence: [A5](../0007-release-lane/A5-evidence-pack.md).
