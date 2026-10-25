# 04 — Stack binding

The factory is portable because its rules target **capabilities**, not products. A stack is
adopted by writing an adapter that maps each capability to a concrete mechanism and proving
the mapping works.

This is the only layer allowed to know what language, framework, or tool you use.

## Two axes

A binding has two independent halves. Mixing them is how pipelines become unmaintainable.

| Axis | Answers | Lives in |
| --- | --- | --- |
| Toolchain | Which command produces the evidence for this language or runtime | `adapters/stack/<name>.md` |
| Delivery | Where it runs, how evidence is retained, how artifacts are promoted | `adapters/ci/<platform>.md` |

This document defines the ports and the toolchain side. The delivery side binds the same
ports to a CI/CD platform; see [adapters/README](../../adapters/README.md).

---

## 1. Ports

A port is a capability the factory requires. Each has an obligation it must satisfy and a
minimum evidence it must produce.

| Port | Obligation | Minimum evidence |
| --- | --- | --- |
| `build.clean` | Build from a clean checkout with declared inputs | Build log; manifest/lockfile diff |
| `format.check` | One canonical format, checked automatically | Pass/fail report |
| `lint.check` | Static rules for correctness and dangerous patterns | Rule report with locations |
| `type.check` | Types or equivalents verified where the stack has them | Check report |
| `sast` | Known-dangerous constructs detected | Scan report |
| `test.isolated` | Fast tests of logic and edge cases without external systems | Report: counts, failures, duration |
| `test.boundary` | Tests against real or realistic dependencies, including failure injection | Report per failure mode |
| `test.contract` | Interface compatibility between producer and consumer | Compatibility report |
| `test.journey` | A small set of critical paths exercised end to end | Journey report with artifacts |
| `secrets.scan` | No credential enters the repository or artifact | Scan report; history check |
| `deps.inventory` | Every runtime dependency is enumerated with a version | Manifest/dependency graph |
| `deps.vuln` | Known vulnerabilities are detected and triaged | Scan report; triage record |
| `artifact.immutable` | The shipped thing is versioned, reproducible, and traceable | Digest + provenance |
| `db.migrate` | Schema changes are ordered and repeatable | Migration log |
| `db.compat` | New and previous application versions survive the rollout window | Compatibility test report |
| `config.validate` | Environment configuration is checked before startup | Validation report |
| `flag.control` | Behavior can be enabled independently of deployment, with an owner | Flag registry entry |
| `deploy.env` | The same artifact can be deployed to each environment | Deploy log per environment |
| `rollback` | A defined procedure returns to the last known good state | Rehearsal record or bounded forward-fix plan |
| `observe.logs` | Structured, correlated, secret-free events | Sample event with correlation ID |
| `observe.metrics` | Latency, error, saturation, and outcome signals | Metric names and dimensions |
| `observe.traces` | Request flow across process boundaries, where boundaries exist | Trace sample |
| `alert.route` | Actionable alerts reach an owner | Alert rule + routing test |
| `perf.measure` | Performance is measured against a stated target | Result with target and environment |
| `docs.link` | Artifacts are discoverable from the change | Resolvable links in A4/A5 |
| `vcs.diff` | The changed surface can be compared to the declared radius | Path list and match report |

**Only the first column is factory-level.** Everything to the right is an implementation
choice and belongs in an adapter.

## 2. Binding procedure

For each new stack, in this order:

1. Copy `adapters/stack/_template.md` to `adapters/stack/<stack-name>.md`.
2. Fill the port table: mechanism, command, evidence location, owner.
3. Declare **explicit exceptions** where a port cannot be automated. Each exception needs a
   manual fallback, an owner, and an expiry date. Expired exceptions fail G4.
4. Run the **binding smoke test**: introduce one deliberate violation for each machine gate
   (a formatting error, a failing test, a committed fake secret, a dependency with a known
   vulnerability, a file outside the declared radius) and confirm each gate fails with a
   useful message. Then remove the violations and confirm all pass.
5. Record the binding in an ADR with the date it was proven.

A binding is not complete until every blocking gate has been observed to **fail** at least
once. A gate that has never failed may simply be disconnected.

## 3. Adapter template

```markdown
# Adapter — <stack name>

Status: draft | proven (<date>)     Owner: <name>
Toolchain versions: <pin or range policy>

## Ports

| Port | Mechanism | Command | Evidence | Notes |
| --- | --- | --- | --- | --- |
| build.clean | | | | |
| ... | | | | |

## Stack conventions

- Formatting / naming / file layout:
- Error handling idiom:
- Transaction and concurrency idiom:
- Test tiers and where they live:
- Migration mechanism and compatibility rule:
- Configuration and secret source:
- Packaging and artifact identity:
- Known traps this stack makes easy:

## Exceptions

| Port | Why not automated | Manual fallback | Owner | Expires |
| --- | --- | --- | --- | --- |

## Smoke test record

| Gate | Deliberate violation | Observed failure message | Restored |
| --- | --- | --- | --- |
```

## 4. Illustrative bindings

These rows exist only to show that the same port can be satisfied in different worlds. They
are examples, not recommendations, and they deliberately mix paradigms.

| Port | Example A: compiled, typed, single process | Example B: interpreted, dynamic, service + worker | Example C: client application |
| --- | --- | --- | --- |
| `test.isolated` | Test runner with deterministic fixtures | Same runner, with dependency doubles at process edges | Component tests with a simulated host |
| `test.contract` | Schema comparison against a published consumer | Consumer-driven contract check in the pipeline | Protocol schema check against a recorded fixture |
| `db.compat` | Migrate, run previous binary, then new binary | Expand/contract migration with a dual-read window | Local data-store version upgrade test |
| `artifact.immutable` | Content-addressed package built once | Container image digest promoted between environments | Signed installer or bundle with digest |
| `observe.traces` | In-process spans plus propagated context | Context propagated through the queue envelope | Client-side timing spans correlated to requests |
| `rollback` | Redeploy previous artifact + reverse-compatible schema | Drain workers, redeploy previous image, keep expanded schema | Re-enable previous bundle on the distribution channel |

If a row forces you to change the port definition, the port is wrong — fix the port, not the
adapter. Port definitions are factory-level and change by decision record.

## 5. Rules

- **Adding a stack is additive.** It must not change stations, obligations, or gate meanings.
- **Every blocking gate needs an owner in the adapter.** "The pipeline" is not an owner.
- **Manual fallbacks are debt.** They are visible in the adapter, counted in the monthly
  review, and have an expiry. A fallback that keeps being renewed is a gate that should be
  redesigned or retired.
- **No adapter may lower a tier.** Tier assignment and escalation are factory-level.
- **Adapters are tested, not just written.** The smoke test is the test.
- **Gate logic never lives in pipeline configuration.** The CI platform invokes a repository
  script that can also be run locally. Otherwise the check is untestable and the platform is
  load-bearing.
- **One adapter per deployable unit type.** A repository with two runtimes may need two
  adapters and one shared convention file; prefer that over a single vague adapter.

## 6. Switching stacks

When the implementation stack changes, the factory does not. The steps are:

1. Write the new adapter and run its smoke test.
2. Keep the old adapter until the last artifact produced with it is out of support.
3. Migrate incrementally: new behavior in the new stack, old behavior untouched, with a
   contract check at the seam (G5b).
4. Record the transition and the reason in an ADR.
5. Retire the old adapter only when its gates can no longer fail — that is, when nothing
   ships with it.

The obligations stay constant across the switch. That is the payoff of this design.
