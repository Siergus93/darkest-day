# ADR-0004 — SAST vehicle and history-scan implementation for slice 0003

| Field | Value |
| --- | --- |
| ID | ADR-0004 |
| Title | SAST vehicle and history-scan implementation for slice 0003 |
| Status | accepted |
| Date | 2026-10-26 |
| Owner | Siergus |
| Tier | T2 |
| Supersedes | Clauses 2 and 3 of ADR-0003 (SAST tool and history-scan tool; clauses 1, 4, 5 of ADR-0003 remain in force) |

## Context

Slice 0003's S4 step 1 probed the workspace before installing anything: there is **no
Python**, **no winget, no scoop, no choco**. Two ADR-0003 choices cannot be executed:

1. Semgrep is a Python-based tool; ADR-0001 already recorded "no Python" in its context.
   ADR-0003's Option 2 rejection noted nodejsscan's Python dependency while missing that
   its own choice has the same dependency.
2. gitleaks is a standalone binary with no package manager install path on this machine;
   wiring it means a binary-download mechanism with two platform variants and checksum
   management, exactly the mechanism ADR-0003's dependency-minimal driver weighed against.

## Decision drivers

- Same obligations, réalisable on the actual machine, not on a hypothetical one.
- npm + lockfile is already the pinned-distribution mechanism for dev tooling.
- The G4d gate's existing model is a **repository-owned ruleset** (see `factory.config.json`
  G4d note); the same rules re-applied over git history is a faithful extension, not a new
  detection engine to trust.
- Identical behavior on Windows (local) and `ubuntu-24.04` (CI).
- Vendor-supported security vulnerability classes for JavaScript (the factory stack).

## Options considered

### Option 1 — npm-only: `eslint-plugin-sdl` + in-house history scan

**Description:** `@microsoft/eslint-plugin-sdl` (Microsoft's Security Development Lifecycle
ruleset, npm-maintained) runs as the SAST check through a dedicated small ESLint engine
configuration; the history scan reuses `scripts/ci/secrets.mjs`'s repo-owned scanner over
`git log -p --all` output.

**Pros:** zero new runtime platforms; everything pinned by `package-lock.json`; one
mechanism (npm) for distribution; on Windows and Linux the invocation is the same
invocation; history rule continuity with the working-tree scan in one file, single
allow-list, no divergence between the two secret gates.

**Cons:** ESLint joins the dependency tree only as the SAST vehicle, which is a fourth
package install (Biome still owns format+lint); SDL rules cover the JS/Node classes the
factory gates need, but are not a general-purpose maximal rule pack; in-house history scan
is repo-owned logic — if the ruleset misses a class, both gates miss it (single point of
policy, no independent second engine).

**Cost to reverse:** low — swap the wrapper's invocation; ESLint remains optional.

### Option 2 — Install Python locally, keep Semgrep

**Description:** User installs Python; Semgrep is written into a pip environment; CI
installs pip/Semgrep too.

**Pros:** keep the more powerful generic rule engine; larger public rule catalog.

**Cons:** new permanent runtime dependency for a gate on a two-tier-1-slice repository;
two install paths (Windows/CI) to maintain; contradicts the recorded ADR-0001 minimalism;
slower; more failure modes. The dependency was underestimated in ADR-0003 and re-admitting
it after probe data is tier up the wedge.

**Cost to reverse:** n/a — will keep existing once installed on every dev machine.

## Decision

**Option 1.** SAST = `@microsoft/eslint-plugin-sdl` (via a dedicated ESLint config driven
by `scripts/ci/sast.mjs`), and the `G4d` history scan = the repository-owned ruleset from
`scripts/ci/secrets.mjs` applied over full git history (`git log -p --all`), in a new
`scripts/ci/secrets-history.mjs`. `G4e` audit-blocking, `G4b`'s Biome plan, the
observed-fail-then-pass retirement rule, and the wall-clock budget stay exactly as
ADR-0003 declared. The pre-existing-violation policy in the A2 edge cases stands.

## Consequences

**Positive:** all gates are npm-pinned; identical invocation locally and in CI; the
working-tree and history secret gates share one ruleset and one allow-list, so there's no
second policy file to keep in sync.

**Negative:** the history scan is a self-rolled engine and claims only the repo-owned
ruleset's coverage (already disclosed in the factory config); SDL rule coverage is
narrower than Semgrep's catalog; ESLint is in the tree serving only SAST.

**Neutral / follow-up work:** if a later product stack warrants a real independent second
opinion (Semgrep via its own machine), a separate decision record can supersede this one;
this slice does not pre-commits to that.

## Revisit trigger

Any of: an escaped secret or a SAST-visible defect in production (this mismatch is the
record's own falsifier); a Node.js/ESLint upgrade breaking the SDL plugin; the repo
gaining a non-JS surface where SDL rules don't apply; a second permanent maintainer
disagreeing with the self-rolled history scan.

> Amendment 2026-10-27 (rider, from A5 verification of slice 0003; the body above is
> unchanged): `security/detect-child-process` fires only on **non-literal** first
> arguments — `exec("…" with a literal string)` produces no finding (verified in
> [0003 A5 smoke 3](../../work/0003-fast-gate-debt/A5-evidence-pack.md)). Reading
> "SAST wired" as literal-argument coverage is wrong; literal-command execution is part
> of slice 0004's FU-2 coverage decision in the slice plan.

## Amendment 2026-10-27 (slice 0005): literal-argument coverage decided — widen

**Context.** The rider above remained only a note; the gate row still claimed unqualified
coverage while an injected `child_process.exec("node --version")` sailed through as PASS.
Slice 0005 probed the stock options first, per its A2 preference order:

- Probe 1: no rule in `@microsoft/eslint-plugin-sdl` 1.1.0 covers command execution
  (`no-msapp-exec-unsafe` is the only exec-adjacent rule, and it is browser-only).
- Probe 2: `eslint-plugin-security` 4.2.0's own `detect-child-process` source shows the
  non-literal requirement is structural (`isStaticExpression` early-returns); no
  configuration flag exists. Every dynamic import style I probed (named, aliased, default,
  namespace, require member, require destructure) IS covered by it; every literal shape is
  silent — the exact hazard the rider named, in both ESM and CJS shapes.
- Probe 3 (why not the core rules, verified empirically): `no-restricted-imports` with
  `importNames` catches the named-import forms including aliases — but not the
  default-import member form (`import proc from "node:child_process"; proc.exec("…")`:
  there is no stable binding name to restrict). `no-restricted-properties` was probed on
  that shape and returned zero findings: it binds to the object identifier's name, so any
  alias-bound import bypasses it (verified in the slice's probe harness). A combination of
  both still leaves the member shape silently uncovered.

**Decision (continues Option 1).** Widen by adding a repository-owned local rule,
`factory/literal-command-exec` (in `scripts/ci/eslint-rules/index.mjs`, wired into
`eslint.config.mjs`, level `error`): a `child_process` exec-family call
(`exec`, `execFile`, `execSync`, `execFileSync`) whose first argument is a **raw command
string** — a string literal or a template literal — fails the gate, resolving aliasing via
scope analysis so `import { exec as e }` cannot bypass. Templates count as raw commands
even with statically-known interpolation: a template with statically-known parts is
effectively a literal and would otherwise escape both rules (the non-literal rule treats
statically-known content as static and stays silent).

**Known edges, accepted and recorded:**
- Binary string concatenation (`exec("a" + b)` where `b` is statically known) is treated as
  dynamic by both rules and escapes exactly as it did before this amendment. Practically
  unreachable in this repo today (zero `exec`-family usage pre-slice). Registration as
  backlog row possible at the next verification.
- Bare identifiers that do not resolve to a child_process import are not flagged (a
  repository-local `exec`-named helper may exist with its own semantics); tightening that
  is a different decision.
- `spawn`/`spawnSync` with argument arrays remain sanctioned and uncovered (the repo's only
  `child_process` usage).

**Consequence:** the G4b SAST row's "clean" now means both shapes of command execution;
the gate notices it by the ADR's definition — `test/sast-literal.test.mjs` pins the whole
coverage matrix (fixtures: named/aliased/default/namespace/require-member/require-destructure,
literal + template + dynamic + spawn-clean), and the SAST wrapper prints the decided
coverage on every PASS so a reader of the row needs no ADR.

## Links

- Problem brief: [0003 A1](../../work/0003-fast-gate-debt/A1-problem-brief.md)
- Spec: [0003 A2](../../work/0003-fast-gate-debt/A2-spec.md)
- Related decisions: [ADR-0001](ADR-0001-tooling-stack.md) (tooling stack), [ADR-0002](ADR-0002-artifacts-and-manifest.md) (manifest), [ADR-0003](ADR-0003-gate-tools.md) (superseded in part)
- Evidence that informed this: environment probe 2026-10-26 (no Python, no `winget`/`scoop`/`choco`); `factory.config.json` G4d note (repository-owned ruleset).
