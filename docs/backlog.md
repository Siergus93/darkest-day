# Backlog — nice-to-have follow-ups

> Registered by slice verifiers, parked by the owner. These are hardening candidates, not
> defects: nothing here is currently failing a gate or weakening verification (each row
> states the mitigation that makes it safe to park). When picked up, an item moves into a
> full slice (A1 → A5). Active work lives in [`../work/`](../work/) per `activeSlice`.

| ID | Origin | Item | Why it matters | Why it is parked | Trivial? |
| --- | --- | --- | --- | --- | --- |
| FU-3 | [0004 A5](../work/0004-config-status-check/A5-evidence-pack.md) probe P6 | `activeSlice` pointing at a wrong-but-existing slice passes the A4-existence assertion | The machine cannot know which slice is "current" without another source of truth | The G4f lane summary names the active slice on every run, so a stale pointer is visible within minutes of any lane invocation | No — hardening means inventing a second source of truth to check against itself |
| FU-4 | [0004 A5](../work/0004-config-status-check/A5-evidence-pack.md) probe C1 | The wiring-evidence table pins wrapper files and lane rows, but the lane imports `scripts/ci/lib/*` — pin the lib modules too (and/where the wrapper's `package.json` target) | A future wired gate could pass the table while nothing in the lane executes it | Today the lane fails closed regardless (renaming a lib crashes the import, and `test/gates.test.mjs` imports the libs behaviorally) | Medium — data-only edit if the table gains a `laneImports` column |
| FU-6 | [0005 A5](../work/0005-sast-literal-coverage/A5-evidence-pack.md) V7 probes | Local exec rule must cover `await import()` destructures and computed members | Argument-classification escape shapes | **Closed by ADR-0004 amendment v2** (slice 0005): the exec family is banned unconditionally — shape classification removed | Yes — implementation simplification, already verified |
| FU-7 | [0005 A5](../work/0005-sast-literal-coverage/A5-evidence-pack.md) probes F/G/H | Non-`exec` family methods had no dynamic coverage and the scope note over-claimed it | Verification gap | **Closed by ADR-0004 amendment v2** (slice 0005): unconditional ban covers all family methods; scope note reworded | Yes — already verified |
| FU-8 | [0005 A5](../work/0005-sast-literal-coverage/A5-evidence-pack.md) re-verification (N1/N2/V6') | Rule resolver completeness: constant-folded computed member keys (`cp["ex" + "ec"]`), multi-hop module rebinding, template-literal module specifiers | Obfuscation-class escapes for an already-unconditional ban | Runtime-derived keys (`cp[key]`, `key` from input) are not coverable by ANY AST rule — accepted edge, ADR wording note pending; the banned class is close to admission-resistant already | Low |
| FU-9 | [0005 A5](../work/0005-sast-literal-coverage/A5-evidence-pack.md) re-verification (N4) | `spawn(single shell string, { shell: true })` is exec-equivalent and uncovered | A future real hole if/when spawn-with-shell is adopted | Repo has zero spawn usage today (both `spawn*` calls are arg-array, verified); nothing exposed | Medium — needs a decision only when spawn is adopted |
| FU-5 | [0004 A5](../work/0004-config-status-check/A5-evidence-pack.md) | ~~package.json version drifts from the v0.3.0 release cut~~ | Two version authorities | **Closed in slice [0005](../work/0005-sast-literal-coverage/)**: release cut v0.3.1 makes `package.json` the third leg of the version-coherence assertion | Yes — one line riding any release cut |

## Real follow-up, not nice-to-have

| ID | Origin | Item | When |
| --- | --- | --- | --- |
| FU-2 | [0003 A4 v4](../work/0003-fast-gate-debt/A4-slice-plan.md) | SAST coverage: literal-argument command execution | Slice [0005](../work/0005-sast-literal-coverage/) — done, PR #7 merged |

## Roadmap (owner decisions 2026-10-27)

| Slice | Item | Tier | State |
| --- | --- | --- | --- |
| [0006](../work/0006-factory-cli/) | First product: the factory CLI (`factory status` / `factory check`) — the loop already exists for specs/implementation/review/testing; this proves it on product code | T2 (release cut rides) | Active |
| [0007](../work/0007-release-lane/) | Deployment lane: G6a `artifact.immutable` skeleton — tag → checksummed artifact → GitHub Release; the first droppable product artifact | T2 | Done — released as [factory-cli-v0.4.0](https://github.com/Siergus93/darkest-day/releases/tag/v0.4.0) |
| [0008](../work/0008-learning-review/) | File the first A8 (seven-slice learning review); fresh-context verification becomes a recorded, checkable step — the A8's one proposed factory change, trialed for three slices | T2 | Done — merged via PR #11, fresh-context verified |
| [0009](../work/0009-gate-debt/) | Close the verifier-flagged gate debt: pin the lane's lib modules (FU-4), harden the SAST resolver (FU-8) | T2 | Active |

