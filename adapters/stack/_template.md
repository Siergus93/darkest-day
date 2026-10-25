# Adapter — <stack name>

> Copy to `adapters/stack/<stack-name>.md`. Fill every row. A binding is **proven** only after the
> smoke test has observed each blocking gate failing and then passing.

| Field | Value |
| --- | --- |
| Stack | |
| Status | draft / proven |
| Proven on | <!-- date --> |
| Owner | |
| Toolchain version policy | |
| Related decisions | |

## Ports

| Port | Mechanism | Command | Evidence | Notes |
| --- | --- | --- | --- | --- |
| `build.clean` | | | | |
| `format.check` | | | | |
| `lint.check` | | | | |
| `type.check` | | | | |
| `sast` | | | | |
| `test.isolated` | | | | |
| `test.boundary` | | | | |
| `test.contract` | | | | |
| `test.journey` | | | | |
| `secrets.scan` | | | | |
| `deps.inventory` | | | | |
| `deps.vuln` | | | | |
| `artifact.immutable` | | | | |
| `db.migrate` | | | | |
| `db.compat` | | | | |
| `config.validate` | | | | |
| `flag.control` | | | | |
| `deploy.env` | | | | |
| `rollback` | | | | |
| `observe.logs` | | | | |
| `observe.metrics` | | | | |
| `observe.traces` | | | | |
| `alert.route` | | | | |
| `perf.measure` | | | | |
| `docs.link` | | | | |
| `vcs.diff` | | | | |

## Stack conventions

- Formatting, naming, file layout:
- Error handling idiom:
- Transaction and concurrency idiom:
- Test tiers and their locations:
- Migration mechanism and compatibility rule:
- Configuration and secret source:
- Packaging and artifact identity:
- Protected paths for this stack:
- Known traps this stack makes easy:

## Exceptions

| Port | Why not automated | Manual fallback | Owner | Expires |
| --- | --- | --- | --- | --- |
| | | | | |

## Smoke test record

| Gate | Deliberate violation | Observed failure message | Restored | Date |
| --- | --- | --- | --- | --- |
| `format.check` | | | | |
| `test.isolated` | | | | |
| `secrets.scan` | | | | |
| `deps.vuln` | | | | |
| `vcs.diff` | | | | |
| | | | | |

## Notes on portability

<!-- Anything in this stack that makes an obligation hard to satisfy, and what would have to
change in the factory if that turns out to be a general problem rather than a stack problem. -->
