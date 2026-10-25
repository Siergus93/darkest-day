# Adapter — Node.js 24 / TypeScript 7

| Field | Value |
| --- | --- |
| Stack | Node.js 24, npm 11, TypeScript 7, node:test |
| Status | proven (2026-10-23) — local gates; remote delivery pending |
| Proven on | 2026-10-23 |
| Owner | Siergus |
| Toolchain version policy | Node pinned by `.nvmrc` (24); dependencies pinned by `package-lock.json`; TypeScript caret range in `package.json` |
| Related decisions | [ADR-0001](../../docs/decisions/ADR-0001-tooling-stack.md) |

This adapter covers the factory's own tooling. It does not bind a product stack.

## Ports

| Port | Mechanism | Command | Evidence | Notes |
| --- | --- | --- | --- | --- |
| `build.clean` | `npm ci` + `tsc` emit | `npm ci && npm run build` | Build log; `dist/` | CI runs on an ephemeral `ubuntu-24.04` runner |
| `format.check` | Not automated | — | — | See Exceptions |
| `lint.check` | Not automated | — | — | See Exceptions |
| `type.check` | `tsc --noEmit` | `npm run check` | Check output | The build already type-checks; `check` is the local-only variant |
| `sast` | Not automated | — | — | See Exceptions |
| `test.isolated` | `node:test` | `npm test` | Test counts, failures, duration | `test/**/*.test.mjs`, no external services |
| `test.boundary` | Not present | — | — | No external boundaries yet |
| `test.contract` | Not present | — | — | No published interfaces yet |
| `test.journey` | Not present | — | — | No user journeys yet |
| `secrets.scan` | Repository ruleset | `node scripts/ci/secrets.mjs` | Findings with file:line and rule | Working tree only; history scan is a deep-lane follow-up |
| `deps.inventory` | Lockfile + `npm ls` | `npm ls --all --json` | Lockfile diff and dependency tree | Only one direct dev dependency today |
| `deps.vuln` | `npm audit` | `npm audit --audit-level=high --json` | Audit JSON | **Advisory** until observed failing; promotion needs a smoke test |
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
| `vcs.diff` | Blast radius checker | `node scripts/ci/blast-radius.mjs` | Radius report and tier escalation | Needs git or an explicit `--changed` list |

## Stack conventions

- Formatting, naming, file layout: 2-space indent, LF, UTF-8, `src/` for checked TypeScript,
  `scripts/ci/` for orchestration, `test/` for tests. No formatter is enforced yet.
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

## Exceptions

| Port | Why not automated | Manual fallback | Owner | Expires |
| --- | --- | --- | --- | --- |
| `format.check` | No formatter selected yet; adding one without a demonstrated failure is ceremony | Reviewer checks consistency against the conventions above; adopt a formatter in Phase 2 | Siergus | 2026-12-31 |
| `lint.check` | No linter selected yet | Reviewer checks for dangerous patterns and dead code; adopt a linter in Phase 2 | Siergus | 2026-12-31 |
| `sast` | No SAST tool selected yet | Secret scan plus dependency audit plus the reviewer's security pass | Siergus | 2026-12-31 |

An expired exception fails G4b. Renewing one requires a decision record, not an edit.

## Smoke test record

Every blocking gate must be observed failing, then passing. `deps.vuln` is advisory, so its
row is not blocking.

| Gate | Deliberate violation | Observed failure message | Restored | Date |
| --- | --- | --- | --- | --- |
| `build.clean` | `const smokeTypeError: number = "not a number";` appended to `src/tiers.ts` | `src/tiers.ts(147,7): error TS2322: Type 'string' is not assignable to type 'number'.`; `npm run build` and `tsc -p tsconfig.json` exit 1 | yes | 2026-10-23 |
| `type.check` | Same injected type error | Same `TS2322` diagnostic through the build; `tsc -p tsconfig.json` exits 1 | yes | 2026-10-23 |
| `test.isolated` | Changed one expected glob result in `test/tiers.test.mjs` from `true` to `false` | `29 passed, 1 failed`; `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: true !== false` at `test/tiers.test.mjs:19`; exit 1 | yes | 2026-10-23 |
| `secrets.scan` | Wrote `aws_access_key_id = <fake key>` to `smoke-secret.txt` | `smoke-secret.txt:1 [aws-access-key] AWS access key id`; exit 1; the value was not printed | yes (file deleted) | 2026-10-23 |
| `vcs.diff` | Passed `assets/logo.png`, which no A4 glob covers | `outside declared radius: assets/logo.png`; exit 1 | n/a (no write) | 2026-10-23 |
| `vcs.diff` (tier) | Temporary T1 plan changed `scripts/ci/fast.mjs` | `declared T1, required T2`; escalation message; downgrade without a reason rejected; exit 1 | yes (temp slice deleted) | 2026-10-23 |
| `deps.vuln` | Not exercised (advisory) | — | — | — |

## Notes on portability

The secret scanner is repository-owned: it has a narrow ruleset and no history scan. If a
maintained scanner is adopted, only this adapter and the invocation change; G4d stays the
same obligation. The gate scripts invoke `node` directly and do not depend on a task runner,
which keeps a future CI swap a delivery-adapter change.
