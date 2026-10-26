# Adapter — Node.js 24 / TypeScript 7

| Field | Value |
| --- | --- |
| Stack | Node.js 24, npm 11, TypeScript 7, node:test |
| Status | proven (2026-10-26) — local gates; remote delivery pending |
| Proven on | 2026-10-26 |
| Owner | Siergus |
| Toolchain version policy | Node pinned by `.nvmrc` (24); dependencies pinned by `package-lock.json`; TypeScript caret range in `package.json` |
| Related decisions | [ADR-0001](../../docs/decisions/ADR-0001-tooling-stack.md) · [ADR-0003](../../docs/decisions/ADR-0003-gate-tools.md) · [ADR-0004](../../docs/decisions/ADR-0004-sast-and-history-implementation.md) |

This adapter covers the factory's own tooling. It does not bind a product stack.

## Ports

| Port | Mechanism | Command | Evidence | Notes |
| --- | --- | --- | --- | --- |
| `build.clean` | `npm ci` + `tsc` emit | `npm ci && npm run build` | Build log; `dist/` | CI runs on an ephemeral `ubuntu-24.04` runner |
| `format.check` | Biome 2 (npm-pinned binary) | `node scripts/ci/format.mjs` | Formatted-diff report, exit 1 | Same rule source as `lint.check` (`biome.json`), separately invoked |
| `lint.check` | Biome 2 | `node scripts/ci/lint.mjs` | Diagnostics with rule id and file:line | Config: `biome.json` |
| `type.check` | `tsc --noEmit` | `npm run check` | Check output | The build already type-checks; `check` is the local-only variant |
| `sast` | ESLint 9 + `@microsoft/eslint-plugin-sdl` + `eslint-plugin-security` | `node scripts/ci/sast.mjs` | Findings with rule id and file:line | Config: `eslint.config.mjs`; pack deliberately small (ADR-0003/0004) |
| `test.isolated` | `node:test` | `npm test` | Test counts, failures, duration | `test/**/*.test.mjs`, no external services |
| `test.boundary` | Not present | — | — | No external boundaries yet |
| `test.contract` | Not present | — | — | No published interfaces yet |
| `test.journey` | Not present | — | — | No user journeys yet |
| `secrets.scan` | Repository ruleset | `node scripts/ci/secrets.mjs` | Findings with file:line and rule | Working tree |
| `secrets.history` | Same ruleset over `git log -p --all` | `node scripts/ci/secrets-history.mjs` | Findings with commit and file; no secret value printed | Full history both platforms; no third-party engine (ADR-0004) |
| `deps.inventory` | Lockfile + `npm ls` | `npm ls --all --json` | Lockfile diff and dependency tree | Dev-only tree |
| `deps.vuln` | `npm audit` | `npm audit --audit-level=high --json` | Audit JSON | **Blocking**: observed failing once (lodash 4.17.20 fixture, exit 1) before promotion |
| `artifact.immutable` | Not applicable | — | — | No deployable artifact; the commit is the artifact |
| `db.migrate` | Not applicable | — | — | No database |
| `db.compat` | Not applicable | — | — | No schema |
| `config.validate` | Manifest validation | `node scripts/ci/fast.mjs` | `CONFIG` gate line | `factory.config.json` is validated before gates run |
| `flag.control` | Not applicable | — | — | No runtime behavior to flag |
| `deploy.env` | Not applicable | — | — | Nothing is deployed |
| `rollback` | Revert the change | `git revert <commit>` | Commit history | Repository-only change; no data |
| `observe.logs` | Not applicable | — | — | Gate evidence is stdout captured in A5 |
| `observe.metrics` | Not applicable | — | — | No service |
| `observe.traces` | Not applicable | — | — | No service |
| `alert.route` | Not applicable | — | — | No alerts |
| `perf.measure` | Fast lane wall clock | `npm run fast` | Elapsed time in the summary | Budget is 10 minutes from the manifest |
| `docs.link` | Relative link checker | `node scripts/ci/links.mjs` | Broken-link report | Reads Markdown outside fenced code |
| `vcs.diff` | Blast radius checker | `node scripts/ci/blast-radius.mjs` | Radius report and tier escalation | Needs git or an explicit `--changed` list; `--base` combines committed, staged, unstaged, deleted, renamed, untracked, and typechanged paths; both entry points warn without a base |

## Stack conventions

- Formatting, naming, file layout: 2-space indent, LF in git, UTF-8, `src/` for checked
  TypeScript, `scripts/ci/` for orchestration, `test/` for tests. Formatting is enforced by
  Biome (match-then-write: `npx biome check --write`); the rules match the pre-existing style.
- Error handling idiom: throw `Error` with an actionable message; CLIs set `process.exitCode`
  rather than calling `process.exit`.
- Transaction and concurrency idiom: not applicable; no shared state.
- Test tiers and their locations: isolated tests in `test/`, run against `dist/`; other tiers
  do not exist yet.
- Migration mechanism and compatibility rule: none. `factory.config.json` is additive;
  breaking changes bump `schemaVersion` through an ADR.
- Configuration and secret source: policy in `factory.config.json`; no runtime configuration;
  no secrets are used by the tooling.
- Packaging and artifact identity: private npm package; `dist/` is generated and ignored.
- Protected paths for this stack: see `protectedPaths` in `factory.config.json`.
- Known traps this stack makes easy: Windows `.cmd` shims need a shell (handled in
  `scripts/ci/lib/run.mjs`); shell globs are not expanded by Node on Windows (tests pass a
  quoted glob); CRLF vs LF; ESM resolution requires explicit `.js` extensions in TypeScript
  imports; TypeScript 7 ships platform-specific optional binaries.

## Smoke test record

Every blocking gate must be observed failing, then passing. `deps.vuln` was observed failing
(fixture lockfile) before promotion, so its row is blocking now too.

| Gate | Deliberate violation | Observed failure message | Restored | Date |
| --- | --- | --- | --- | --- |
| `build.clean` | `const smokeTypeError: number = "not a number";` appended to `src/tiers.ts` | `src/tiers.ts(147,7): error TS2322: Type 'string' is not assignable to type 'number'.`; `npm run build` and `tsc -p tsconfig.json` exit 1 | yes | 2026-10-23 |
| `type.check` | Same injected type error | Same `TS2322` diagnostic through the build; `tsc -p tsconfig.json` exits 1 | yes | 2026-10-23 |
| `format.check` | Appended `const   breaks    =1` to `scripts/ci/lib/blast-radius.mjs` | `format.check FAILED: files do not match the Biome formatting rules.` with the diff; exit 1 | yes | 2026-10-26 |
| `lint.check` | Appended `const vs  = 1` (double equality) | `noDoubleEquals` diagnostic naming the file; exit 1 | yes | 2026-10-26 |
| `sast` | Fixture `sast-smoke-tmp.mjs` calling `exec()` with a template literal | `sast-smoke-tmp.mjs:3:3 [error] security/detect-child-process: Found child_process.exec() with non-Literal first argument`; exit 1 | yes (fixture deleted) | 2026-10-26 |
| `test.isolated` | Changed one expected glob result in `test/tiers.test.mjs` from `true` to `false` | `29 passed, 1 failed`; `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: true !== false` at `test/tiers.test.mjs:19`; exit 1 | yes | 2026-10-23 |
| `secrets.scan` | Wrote `aws_access_key_id = <fake key>` to `smoke-secret.txt` | `smoke-secret.txt:1 [aws-access-key] AWS access key id`; exit 1; the value was not printed | yes (file deleted) | 2026-10-23 |
| `secrets.history` | Committed a fake AWS key in a fixture repository (automated: `test/gates.test.mjs`) | design-point `aws-access-key` finding: rule, file `leak.txt`, 12-char commit prefix, added-line; the value is never printed; real history exits 0 | yes (fixture removed) | 2026-10-26 |
| `deps.vuln` | Scratch project with `lodash@4.17.20` | `1 high severity vulnerability`; `npm audit --audit-level=high` exit 1 | yes (scratch dir removed) | 2026-10-26 |

## Notes on portability

The secret scanner (tree and history) is repository-owned: one ruleset, one allow-list
policy, no third-party engine. If an independent scanner is adopted, only this adapter and
the invocation change; G4d stays the same obligation. Engines are resolved from the npm tree
that ships the scripts, never from the caller's PATH. The gate scripts invoke `node`
directly and do not depend on a task runner, which keeps a future CI swap a
delivery-adapter change.
| `vcs.diff` | Passed `assets/logo.png`, which no A4 glob covers | `outside declared radius: assets/logo.png`; exit 1 | n/a (no write) | 2026-10-23 |
| `vcs.diff` (tier) | Temporary T1 plan changed `scripts/ci/fast.mjs` | `declared T1, required T2`; escalation message; downgrade without a reason rejected; exit 1 | yes (temp slice deleted) | 2026-10-23 |
| `vcs.diff` (working tree) | Committed `README.md` change plus an uncommitted tracked edit outside the 0002 radius | The uncommitted path was missing before the fix; after the fix it is reported as `outside declared radius` and the command exits 1 | yes (scratch worktree removed) | 2026-10-26 |
| `vcs.diff` (index-only) | Committed `README.md` change plus a staged tracked edit outside the 0002 radius, with the working-tree copy restored to `HEAD` | `git diff HEAD` omitted the path; after the fix the index source reports it as `outside declared radius` and the command exits 1 | yes (scratch worktree removed) | 2026-10-26 |
