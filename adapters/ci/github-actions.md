# Delivery adapter — GitHub Actions

| Field | Value |
| --- | --- |
| Platform | GitHub Actions |
| Status | fast lane authored; remote smoke test pending |
| Owner | Siergus |
| Decided | 2026-10-23 |
| Related decisions | [ADR-0001](../../docs/decisions/ADR-0001-tooling-stack.md) |

## Binding status (Phase 0)

Only the fast lane is wired. It invokes `scripts/ci/fast.mjs` and contains no gate logic.
The deep and release lanes remain specifications, not running jobs.

| Wired now | Evidence | Limit |
| --- | --- | --- |
| `.github/workflows/fast.yml` | Job log + 30-day `fast-lane.log` artifact | Not yet observed on a remote runner |
| `build.clean`, `type.check`, `test.isolated`, `secrets.scan`, `vcs.diff` | Job failure and log | Secret history scan and maintained scanner still pending |
| `deps.vuln` | Advisory line in the log | Not blocking until observed failing |

The first remote pull request is the delivery smoke test. Until it runs, treat this adapter
as **unproven** and do not cite a green local run as CI evidence.

Answers the delivery axis only: where gate commands run, how evidence is retained, and how
artifacts are promoted. The commands themselves come from the stack adapter in
`adapters/stack/`. See [adapters/README.md](../README.md).

---

## 1. Why it fits

- Native to the repository, so the pipeline is versioned with the code and reviewed like it.
- Required status checks and merge queues give G4/G5 real blocking power.
- Environments with required reviewers give T3 a human gate without building one.
- OIDC removes long-lived cloud credentials from the delivery path.
- Evidence upload (test reports, SARIF, SBOM, provenance) maps directly to A5/A6.

It is a good default. It is not an obligation: the factory only requires the capabilities.

## 2. Workflow topology

| Lane | Trigger | Purpose | Maps to |
| --- | --- | --- | --- |
| Fast | `pull_request` | Fail cheap and early | G4a–G4f, G5a (fast tier) |
| Deep | `merge_group` or `push` to main, plus nightly `schedule` | Contract, migration, integration, journey, vulnerability | G5b–G5h |
| Release | tag or `workflow_dispatch` | Build once, promote, verify | G6a–G6e, G7* |
| Drift | weekly `schedule` | Dependency age, expiring waivers, adapter exceptions | Factory health checks |

Rules:

- One entry-point script per lane (`scripts/ci/fast`, `scripts/ci/deep`, `scripts/ci/release`).
  The workflow calls it; it does not reimplement it.
- `concurrency` cancels superseded PR runs. Never cancel a release run.
- `timeout-minutes` on every job. A hung job is a cost and a blocked gate.
- Do not rebuild per environment. Build once, promote the same digest, verify after each
  promotion.
- Do not use `paths-ignore` to skip required checks on code-adjacent changes. Use tier
  assignment and fast jobs instead; a skipped required check is an unenforced gate.

## 3. Port mapping

| Port | GitHub Actions mechanism | Evidence |
| --- | --- | --- |
| `build.clean` | Job on a pinned ephemeral runner, toolchain version from the repo | Build log in job summary |
| `format.check` | Step calling the stack adapter command | Pass/fail in job output |
| `lint.check` | Same | Report uploaded |
| `type.check` | Same | Report uploaded |
| `sast` | Code scanning upload (SARIF) | Code scanning results |
| `test.isolated` | Fast lane job, JUnit XML output | Test report artifact + summary |
| `test.boundary` | Deep lane job with service containers or ephemeral test env | Test report artifact |
| `test.contract` | Deep lane job, consumer and producer sides | Compatibility report artifact |
| `test.journey` | Deep or scheduled job against a deployed preview | Run recording + report |
| `secrets.scan` | Pre-commit equivalent plus a full-history CI job | Scan report artifact |
| `deps.inventory` | Lockfile/manifest diff captured per change | Manifest diff in summary |
| `deps.vuln` | Dependency review on PR, full scan on schedule | Review result + scan report |
| `artifact.immutable` | Package/container registry with digest; provenance attestation | Digest + attestation |
| `db.migrate` | Release job step | Migration log |
| `db.compat` | Deep/release job: migrate, run previous artifact, then new | Compatibility report |
| `config.validate` | Release job step before promotion | Validation report |
| `flag.control` | Flag provider, not Actions; Actions only references the flag key | Flag registry entry in A6 |
| `deploy.env` | Environment-scoped jobs and secrets | Deploy log per environment |
| `rollback` | `workflow_dispatch` job using the same promotion path | Rehearsal record |
| `observe.logs` | Not Actions; link only | Log query link in A7 |
| `observe.metrics` | Not Actions; link only | Dashboard link in A6/A7 |
| `observe.traces` | Not Actions; link only | Trace query link in A7 |
| `alert.route` | Not Actions; routing test recorded | Alert rule + test record |
| `perf.measure` | Scheduled or pre-release job on a stable environment | Benchmark artifact with target |
| `docs.link` | PR template requires A5 link; job checks the path exists | Link check in job summary |
| `vcs.diff` | Job comparing changed paths to the declared blast radius | Path report artifact |

## 4. Evidence retention

Actions artifacts are **working evidence**, not the record of truth. They expire.

| Evidence | Lives in | Retention |
| --- | --- | --- |
| Gate results per slice | A5 in the repository | Permanent |
| Raw reports (JUnit, SARIF, scans) | Actions artifacts | 30–90 days |
| Build provenance | Registry attestation | Life of artifact |
| Release identity and digest | A6 in the repository | Permanent |
| Waivers and expiry | A5 + drift job | Permanent, expires by date |

If a decision later depends on a raw report, copy it into the slice record. Never cite an
artifact URL as the only evidence for a permanent decision.

## 5. Security guardrails

These are not optional refinements; on this platform they are the difference between a gate
and a liability.

1. **Least privilege.** Top-level `permissions: contents: read`; grant `id-token`, `packages`,
   or `security-events` only to the job that needs them.
2. **Pin third-party actions to a full commit SHA**, not a tag or branch. Update them through
   a reviewed change, not automatically at runtime.
3. **Never use `pull_request_target` with untrusted code checked out.** Use `pull_request`
   for builds. Fork PRs do not receive secrets.
4. **No expression interpolation in `run:`.** Pass `github.event.*` and other untrusted values
   through `env:` and quote them. This is the classic script-injection path.
5. **OIDC over static cloud keys.** Short-lived credentials, scoped by environment.
6. **Environment protection for production**, with required reviewers at T3. Approval is a
   gate, so it is recorded in A6.
7. **`persist-credentials: false`** on checkout unless the job genuinely pushes.
8. **Production secrets only in the production environment**, never at repository scope.
9. **Never print secrets.** Masking is a backstop, not a control. Scan logs and artifacts
   before upload when they may contain user data.
10. **No self-hosted runners for untrusted code.** If self-hosting is required, isolate the
    runner and treat it as production infrastructure.
11. **Restrict who may dispatch a release**, and protect the release tags.
12. **Timeouts and concurrency limits** on every workflow. Runaway matrix jobs are both a
    cost incident and a denial of feedback.

## 6. Reproducibility

- Pin the runner image (`ubuntu-24.04`, not `-latest`).
- Pin every toolchain version in the repository, not in the workflow.
- Cache keys must include the lockfile hash. Do not cache build outputs across unrelated
  branches.
- Prefer building in the same artifact format that production runs. If the build happens in
  a container, the tested container is the promoted container.
- If a check depends on network access, record the dependency and make the failure message
  distinguish "check failed" from "network failed".

## 7. Known limitations and fallbacks

| Limitation | Fallback | Class |
| --- | --- | --- |
| Flake detection is not native | Repeat the fast tier on a schedule; report as advisory (G5h) | A |
| Contract and migration compatibility need real environments | Dedicated deep-lane jobs with previous-version artifacts | M |
| Environment approvals are binary, not tiered | Map T3 to required reviewers; T2 to automatic with post-approval | H |
| Workflow YAML is awkward to test | Keep it declarative; all logic in scripts with local equivalents | — |
| Artifact retention is finite | Copy decision-relevant evidence into A5/A6 | R |
| "Gate has failed at least once" is not tracked | Record the adapter smoke test explicitly | R |
| Runner images change over time | Pin image versions; re-run the smoke test when upgrading | M |

## 8. Smoke test record

Run once when the delivery adapter is introduced, and again after a major platform change.
Each gate must be observed **failing**, then passing.

| Gate | Deliberate violation | Observed failure | Restored | Date |
| --- | --- | --- | --- | --- |
| `build.clean` | Add an unresolvable dependency | | | |
| `format.check` | Commit badly formatted code | | | |
| `test.isolated` | Break an assertion | | | |
| `secrets.scan` | Commit a fake credential | | | |
| `deps.vuln` | Add a dependency with a known advisory | | | |
| `vcs.diff` | Touch a protected path without escalation | | | |
| `artifact.immutable` | Attempt to promote a rebuilt artifact | | | |
| `rollback` | Dispatch rollback to a non-production environment | | | |

## 9. Leaving the platform

Because the workflows only call repository scripts:

1. Write a new delivery adapter and map the same ports.
2. Keep the required-check names aligned with gate IDs so branch protection can be recreated.
3. Run the smoke test on the new platform before switching required checks.
4. Keep the old pipeline read-only for one release cycle, then delete it.

No station, obligation, or gate changes. If one does, the first adapter leaked logic it
should not have owned.
