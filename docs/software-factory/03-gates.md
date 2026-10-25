# 03 — Gates

A gate is a **falsifiable check** on an artifact. It exists to retire a specific risk. If it
cannot fail, it is not a gate.

Gates are defined by obligation and evidence. The command, tool, or human action that
produces the evidence belongs to a [stack adapter](04-stack-binding.md).

---

## Enforcement classes

| Class | Meaning | Behaviour |
| --- | --- | --- |
| `M` | Machine-blocking | Automated; failure stops the change |
| `A` | Automated advisory | Automated; reported, does not stop the change |
| `R` | Recorded | An artifact must exist and be linked; checked by script or review |
| `H` | Human sign-off | A named human accepts the result, recorded in A5 |

`R` and `H` gates are not weaker than `M` gates — they cover judgment that automation cannot
supply. They are weaker only when the record is missing.

## Gate invariants

Every gate must be:

- **Deterministic** — same inputs, same verdict. A flaky gate is a broken gate and is fixed
  or demoted before it is trusted.
- **Actionable** — the failure message names what failed, where, and the first step to fix it.
- **Reproducible** — runs from a clean checkout with documented commands.
- **Bounded** — the fast lane finishes in minutes. Slow checks move to a deeper lane and
  report asynchronously.
- **Versioned** — gate definitions live with the code and change through review.
- **Owned** — every gate has a person accountable for its signal quality.
- **Portable** — pipeline configuration invokes the check; it does not contain the check.
  Gate logic lives in a repository script with a local equivalent.

## Gate catalog

Tier column lists the lowest tier at which the gate applies; higher tiers inherit it.

| ID | Obligation | Tier | Class | Evidence | Port |
| --- | --- | --- | --- | --- | --- |
| G0 | The problem, outcome metric, and non-goals are stated and the tier is declared | T1 | R + H | A1 linked from A4 | `docs.link` |
| G1 | Every acceptance criterion is observable and has a verification method; no blocking question remains | T1 | R | A2 with AC → verification table | `docs.link` |
| G2 | Boundaries, ownership, contracts, failure modes, and threats are explicit; irreversible choices have decisions | T2 | R + H | A2 design section + A3 records | `docs.link` |
| G3 | The slice is vertical, tiered, bounded, ordered by risk, and undoable | T1 | A | A4 validated against changed paths | `vcs.diff` |
| G4a | Clean checkout builds reproducibly | T0 | M | Build log, lockfile/manifest unchanged or justified | `build.clean` |
| G4b | Formatting, lint, static analysis, and type checks pass | T0 | M | Check report | `format.check`, `lint.check`, `sast` |
| G4c | Fast test tier passes | T0 | M | Test report with counts and timing | `test.isolated` |
| G4d | No secret or credential is introduced | T0 | M | Secret scan report | `secrets.scan` |
| G4e | New dependencies pass policy and vulnerability checks | T1 | M + R | Dependency diff, scan report, justification | `deps.inventory`, `deps.vuln` |
| G4f | The diff stays inside the declared blast radius; protected paths are escalated | T0 | M | Path comparison report | `vcs.diff` |
| G5a | Each acceptance criterion has a reproduced result | T1 | M + R | A5 AC table with commands and outcomes | `test.isolated`, `test.boundary` |
| G5b | Changed interfaces are contract-compatible | T2 | M | Contract verification report | `test.contract` |
| G5c | Authorization and cross-scope access are exercised | T2 | M | Negative test results | `test.boundary` |
| G5d | Migrations are forward- and backward-compatible across the rollout window | T2 | M + R | Migration test report against previous version | `db.compat` |
| G5e | Changed external boundaries handle slow, failing, and malformed responses | T2 | M | Failure-injection results | `test.boundary` |
| G5f | Changed hot paths meet their stated performance target | T2 | M + R | Benchmark or load result vs target | `perf.measure` |
| G5g | Tests can fail: at least one deliberate break is caught | T1 | A | Mutation or manual break report | `test.isolated` |
| G5h | Flaky tests are within budget and quarantined with an owner | T1 | A | Flake report | `test.journey` |
| G6a | The artifact is immutable, versioned, and traceable to a commit | T2 | M | Artifact digest, provenance record | `artifact.immutable` |
| G6b | Configuration is valid for the target environment and secrets are externally supplied | T2 | M | Config validation report | `config.validate` |
| G6c | Rollback or forward-fix is defined, and rehearsed for T3 | T2 | R + H | A6 rollback section | `rollback` |
| G6d | Risky behavior is flag-controlled and off by default | T2 | R | Flag name, default, owner, removal date | `flag.control` |
| G6e | Observability for new failure modes exists before traffic | T2 | R | Dashboard/alert links in A6 | `observe.metrics`, `alert.route` |
| G7a | Every new alert has an owner and a first action | T2 | R | A7 alert table | `alert.route` |
| G7b | The new capability has an SLO or an explicit statement that none applies | T2 | R | A7 SLO section | `observe.metrics` |
| G7c | Recovery procedure is executable by someone who did not write the code | T3 | H | A7 walked through by a second party | `docs.link` |
| G8a | Outcome versus baseline is reviewed at the declared horizon | T1 | R | A8 with data | `docs.link` |
| G8b | Rework and escaped defects are attributed to a station and a gate | T1 | R | A8 analysis | `docs.link` |

> The port column names a capability, not a product. See
> [04-stack-binding](04-stack-binding.md) for the port definitions and how to bind them.

## Fast lane and deep lane

| Lane | Trigger | Budget | Contains |
| --- | --- | --- | --- |
| Fast | Every change | Under ~10 minutes | G4a–G4f, G5a (unit + fast boundary) |
| Deep | Before merge or nightly | Longer, may parallelise | G5b–G5h, G6a–G6e, integration and journey tiers |
| Release | Before production | Per release | G6*, G7*, smoke verification |

The fast lane exists so the normal case is cheap. If the fast lane takes long enough that
people batch changes to avoid it, the lane is misdesigned — split it, do not ignore it.

## Waivers

A waiver is a recorded acceptance of risk, not a bypass.

Required fields: gate ID, reason, blast radius, compensating control, owner, expiry date.
Waivers are listed in A5 and expire automatically. An expired waiver fails the gate.

Waivers are never allowed for: G4d (secrets), G5c (authorization), or anything at T3 without
human sign-off. If a waiver is requested repeatedly for the same gate, the gate is wrong —
change the gate.

## Changing the gate catalog

1. Name the escaped failure or the false positive that motivates the change.
2. Write a decision record: what the gate will catch, what it costs, how it can be wrong.
3. Run it in advisory mode for one slice.
4. Promote to blocking only after it has produced a correct signal and an acceptable runtime.
5. Retire gates that have produced no signal across a meaningful number of slices and cover
   low risk. Record the retirement.

A gate added "because it is best practice" is how factories become theaters.
