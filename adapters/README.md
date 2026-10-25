# Adapters

Adapters are the only place the factory is allowed to know what tools you use. There are
**two independent axes**, and keeping them separate is what lets you change one without
rewriting the other.

| Axis | Directory | Answers |
| --- | --- | --- |
| Toolchain | `stack/` | Which commands produce gate evidence for this language, framework, or runtime |
| Delivery | `ci/` | Where those commands run, how evidence is kept, and how artifacts are promoted |

Examples of the separation:

- Moving from one CI platform to another changes `ci/`, not `stack/`.
- Moving from one language to another changes `stack/`, not `ci/`.
- A port that needs both — say `db.compat` — is satisfied by a stack mechanism (migration
  tooling) executed by a delivery mechanism (a job that runs the previous artifact against
  the new schema).

## The thin-pipeline rule

**Pipeline configuration may invoke gate commands, but must not contain gate logic.**

Gate logic lives in repository scripts or a task runner with a local equivalent. The CI
platform schedules it, stores its evidence, and enforces the verdict. Consequences:

- The same checks can be run before pushing, which is what keeps the fast lane fast.
- Evidence is reproducible outside CI, which is what makes it evidence.
- Replacing the CI platform is a new delivery adapter, not a factory change.

## Shared ports

Most ports belong clearly to one axis. These need a mechanism from each:

| Port | Toolchain provides | Delivery provides |
| --- | --- | --- |
| `build.clean` | Build command, pinned inputs | Clean ephemeral runner, cache policy |
| `secrets.scan` | Scanner and rules | History scan, fork/PR isolation, log hygiene |
| `db.compat` | Migration tooling, schema versioning | Previous-version environment, rollout-window job |
| `perf.measure` | Benchmark harness | Representative environment, stable load profile |
| `artifact.immutable` | Packaging identity | Registry, digest promotion, provenance |
| `deploy.env` | Runtime configuration contract | Environment, approvals, promotion path |
| `observe.*` | Instrumentation in the code | Backend, retention, query and dashboard access |
| `vcs.diff` | — | Change surface and protected-path comparison |

## Adding an adapter

1. Copy the relevant template.
2. Fill every row; do not leave a mechanism implicit.
3. Run the smoke test and observe each blocking gate fail, then pass.
4. Record the result in the adapter and in a decision record.

A binding is not complete until a gate has been seen to reject something. An adapter that
has only ever produced green builds has not been tested.
