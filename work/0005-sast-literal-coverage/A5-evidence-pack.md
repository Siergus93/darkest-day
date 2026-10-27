# A5 — Evidence pack for slice 0005 (SAST literal coverage)

> Built 2026-10-27 by the implementing agent. **Fresh-context verification pending** (T2:
> the builder is not the sole verifier). PR: see the `0005` branch.

## AC result table

| AC | Result | Evidence |
| --- | --- | --- |
| AC-1 clean tree: SAST 0 violations, budget respected | **PASS (build)** | Clean-tree `node scripts/ci/sast.mjs` → PASS + scope note, `EXIT=0`; lane (below) 0 violations, SAST within the 14.4 s full-lane run |
| AC-2 literal-arg exec fails SAST with rule id + file:line; restore passes | **PASS (build)** | Smoke 1 |
| AC-3 non-literal fixture still fails (no regression) | **PASS (build)** | Smoke 2 (both rules fire) + the 11-fixture coverage matrix pinned in `test/sast-literal.test.mjs` |
| AC-4 repo spawn usage stays clean, no allowlist | **PASS (build)** | Clean tree 0 violations with the widened pack; the repo's `spawnSync` usages (`lib/engines.mjs`, `lib/run.mjs`, `lib/secrets-history.mjs`) pass unmodified |
| AC-5 PASS row states the decided coverage | **PASS (build)** | Scope note printed on every SAST PASS (3 lines, below); G4b factory note reworded; the note lives in `scripts/ci/sast.mjs` and `factory.config.json` |
| AC-6 decision in ADR-0004 amendment; original untouched | **PASS (build)** | `docs/decisions/ADR-0004-sast-and-history-implementation.md` gained "## Amendment 2026-10-27 (slice 0005)" with the probe log; the pre-amendment body is byte-untouched (git diff shows append-only) |
| AC-7 version chain: package.json == factoryVersion == newest CHANGELOG | **PASS (build)** | Smoke 3 (drift flips the assertion, names both values); `npm test` 56/56 incl. extended `factoryVersion matches the newest released CHANGELOG section and package.json` |
| AC-8 lane green vs `961b3e4`; CI on PR green | **PASS (build)** | Lane run below; CI run URL to be added after push |

## What landed

- `scripts/ci/eslint-rules/index.mjs` — the local rule `factory/literal-command-exec`:
  member-property exec-family resolution (any object), bare-identifier resolution through
  scope analysis including **import aliases** (`import { exec as e }` cannot bypass —
  discovered broken in the first implementation, see Limbo note), member calls via
  `createRequire`-bound `require`; first argument considered raw when it is a string
  literal **or a template literal** — templates count as raw commands because a template
  with statically-known interpolation would otherwise escape BOTH rules
  (security/detect-child-process treats statically-known content as static and stays
  silent; templates with dynamic interpolation are already flagged by it).
- `eslint.config.mjs` — the rule joins the pack at `error`, plugined locally (no new
  dependency); the DECIDED COVERAGE is written into the config's own header comment.
- `scripts/ci/sast.mjs` — PASS output now prints three scope lines naming the decided
  coverage (AC-5), so a green row is self-describing.
- `factory.config.json` — G4b note states the coverage (protected path, the note field
  only) and carries the v0.3.1 release cut; `package.json`/lockfile join the version
  chain (FU-5 closes here).
- `test/sast-literal.test.mjs` — the 11-fixture coverage matrix pinned as tests.
- ADR-0004 amendment: probe log (SDL inventory, the 4.2.0 rule source, an empirical
  core-rules probe), decision, known edges (binary-concat statically-known escaping both
  rules — pre-existing edge, unchanged; bare unlinked identifiers clean-by-design).

## Deviation from the probe plan, honestly recorded

The first rule implementation flagged member-style exec but NOT bare-identifier exec: the
resolver compared the local binding name against the exec family, so aliased imports
(`import { exec as e }`) bypassed it. Found during S2 probing against the aliased fixture,
fixed by resolving the *imported* name; the aliased fixture is now a permanent test row.
The static-template escape (found mid-verify: `exec(`ls ${c}`)` with statically-known `c`
passed BOTH rules) decided the template rule: templates are raw commands, not optionally
static expressions.

## Smokes 1–2 (AC-2 / AC-3), verbatim

```
SMOKE 1 — scripts/_smoke0005.mjs: import { exec } from "node:child_process"; exec("node --version");
> node scripts/ci/sast.mjs
  sast FAILED: 1 security rule violation(s).
    scripts/_smoke0005.mjs:2:1 [error] factory/literal-command-exec: Factory SAST: literal
    command execution via child_process.exec() is banned; use spawn/spawnSync with an
    argument array instead.
SMOKE1_RED=1
> after restore (file removed)
  sast: no security rule violations (0 warning(s)).
    scope: ADR-0004 - child_process exec family (exec, execFile, execSync,
    execFileSync) banned on raw commands (literal or template); dynamic commands
    are covered by security/detect-child-process.
SMOKE1_GREEN=0

SMOKE 2 — same file with `const cmd = process.argv[2]; exec(`ls ${cmd}`);`
  sast FAILED: 2 security rule violation(s).
    scripts/_smoke0005.mjs:3:1 [error] factory/literal-command-exec: Factory SAST: literal command execution via
    scripts/_smoke0005.mjs:3:1 [error] security/detect-child-process: Found child_process.exec() with non Literal first
SMOKE2_RED=1
```

## Smoke 3 (AC-7), verbatim

```
package.json version 0.3.1 -> 0.2.0
✖ factoryVersion matches the newest released CHANGELOG section and package.json
  AssertionError [ERR_ASSERTION]: package.json version (0.2.0) must match the newest
  released CHANGELOG section (0.3.1)
SMOKE3_RED=1
> after restore:  ℹ pass 8  ℹ fail 0   SMOKE3_GREEN=0
```

## Full lane (AC-8), verbatim

```
> npm run fast -- --base 961b3e4
Gate summary
  CONFIG  PASS      factory.config.json is valid
  G4a     PASS      clean build (tsc emit)
  FORMAT  PASS      every file matches the Biome formatting rules
  LINT    PASS      no lint rule violations
  SAST    PASS      security rule pack: 0 violation(s), 0 warning(s)
  G4b     PASS      type.check passed; format, lint, and SAST clean
  G4c     PASS      56 passed, 0 failed, 8202.1277ms
  LINKS   PASS      all inline and reference Markdown links resolve
  G4d     PASS      no credential patterns found in the working tree
  HISTORY PASS      no credential patterns in any recorded commit
  G4e     PASS      inventory readable; npm audit reported no high or critical advisories
  G4f     PASS      Slice work/0005-sast-literal-coverage: declared T2, required T2, 11 changed path(s).

Fast lane PASSED in 14.4s (budget 10m).
Exit code: 0
```

## Residual risk / follow-ups

- Binary string concatenation with a statically-known right-hand operand escapes both
  rules (pre-existing edge, now documented in the ADR amendment); candidate backlog row.
- Two rules can fire on the same node (dynamic template → factory + security); harmless
  duplication, kept because the messages say different things about the same call.
- `docs/waivers.md`: no new waivers; none requested.
- CI run URL pending; fresh-context verifier should countersign AC-1..AC-8.
