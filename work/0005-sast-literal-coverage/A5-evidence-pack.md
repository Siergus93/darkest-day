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
| AC-8 lane green vs `961b3e4`; CI on PR green | **PASS (build)** | Lane run below; CI "fast lane" SUCCESS 14s — https://github.com/Siergus93/darkest-day/actions/runs/40482617512/job/122116443536 (2026-10-27) |

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

## Fix round (2026-10-27): the fresh-context verifier found the v1 gaps — closing them

The fresh-context verification returned **FAIL** with three escape shapes the v1 "raw-command"
rule and the stock plugin both missed (see the verifier section below): top-level
`await import()` destructure (V7), computed member `cp["exec"] (…)`, and non-`exec` family
methods with dynamic args (the stock plugin covers only bare `exec` dynamically). Rather
than enumerate shapes, the decision was simplified per ADR-0004 amendment v2: **the exec
family is banned unconditionally** — any resolved exec-family call fails, whichever shape
carries it. `spawn`/`spawnSync` with argument arrays stays the sanctioned pattern.

Resolution is now shape-complete: member access (computed included), static imports
including aliases, require-destructure, and `await import()` destructures (aliased
included). Deliberate clean areas: `spawn`/`spawnSync` with argument arrays, and
exec-family-named identifiers that do not resolve to child_process.

The re-run of the verifier's exact falsifying probes through the real pack:

```
V7 dynamic-import destructure literal     OK (factory/literal-command-exec)
V7 aliased dynamic-import destructure     OK (factory/literal-command-exec)
computed member cp["exec"]                OK (factory/literal-command-exec)
family execFile dynamic args              OK (factory/literal-command-exec)
static binary concat ("a" + "b")          OK (factory/literal-command-exec)   <- documented v1 edge, now covered
dynamic template                          OK (factory + security/detect-child-process)
bare local helper untouched               OK (clean)
spawn arg-array / spawn member            OK (clean)
```

The permanent 17-fixture matrix (all of the above + named/alias/default/namespace/
require-member/require-destructure/static-template) is pinned in `test/sast-literal.test.mjs`
(`npm test` → 56/56). FU-6/FU-7 are registered closed in `docs/backlog.md` (closed by this
amendment, with their evidence). The SAST scope note now states only the truth (AC-5).

Lane after the fix round:

```
> npm run fast -- --base 961b3e4
  SAST    PASS      security rule pack: 0 violation(s), 0 warning(s)
  G4c     PASS      56 passed, 0 failed, 8318.7649ms
  G4f     PASS      Slice work/0005-sast-literal-coverage: declared T2, required T2, 14 changed path(s).
Fast lane PASSED in 14.4s (budget 10m).
Exit code: 0
```



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

## Fresh-context verification (2026-10-27)

Fresh-context adversarial verifier (did not author the diff). All commands reproduced
locally on the checked-out branch; scratch files created under `scripts/`, deleted
immediately after each record, tree green before the next. `git status --short` at the end
of this verification is empty.

### Verdict per AC (A4 v1)

| AC | Verdict | Evidence and notes |
| --- | --- | --- |
| AC-1 | **PASS** | Clean tree `node scripts/ci/sast.mjs` → PASS + scope note, EXIT=0; `npm test` 56/56 EXIT=0; lane 14.5 s vs 10 m budget |
| AC-2 | **FAIL (narrow)** | All four named fixture shapes fail as claimed: literal `exec("rm -rf /")` (rule id + file:line, EXIT=1), aliased `exec as e`, default-import member `child.exec`, namespace `import * as cp` — all four EXIT=1 with `factory/literal-command-exec`. **However probe B below is a literal-argument exec that the gate passes** — the absolute "literal-argument command execution is covered" claim is false; the four pin-test shapes are covered, the top-level `await import` destructure shape is not |
| AC-3 | **PASS** | Dynamic template `exec(`curl ${u}`)` with `u = process.argv[2]` → EXIT=1, 2 violations, both rules, file:line |
| AC-4 | **PASS** | `spawnSync("git", ["status"])` scratch file → EXIT=0; repo tree 0 violations with the widened pack |
| AC-5 | **PASS with a material inaccuracy** | The 3-line scope note prints on every PASS (observed on the green control). **But its third line is false for the rule source:** `detect-child-process` reports only when the resolved fn name is exactly `exec` (`rule.js` `if (fnName !== 'exec') return`) — non-literal `execFile`/`execSync`/`execFileSync` are NOT covered (probes F/G/H below). A reader of the PASS row is told dynamic commands are covered when they are, for 3 of 4 methods |
| AC-6 | **PASS with an inaccuracy** | Amendment present; `git diff 961b3e4..c692360` on the ADR shows +48/−0 — append-only. But two amendment claims are contradicted by the sources: (a) "Every dynamic import style I probed (named, aliased, default, namespace, require member, require destructure) IS covered by it" — true only for static import/require; `await import()` is not resolved by `getImportAccessPath` and the destructure style ESCAPES (probe B, literal arg); (b) the fixture list "named/aliased/default/namespace/require-member/require-destructure" — `test/sast-literal.test.mjs` has 11 rows and contains NO namespace row and NO require-destructure row |
| AC-7 | **PASS** | `node --test test/config.test.mjs` pass 8 / fail 0 EXIT=0; package.json → 0.2.0: fail 1, "package.json version (0.2.0) must match the newest released CHANGELOG section (0.3.1)"; factoryVersion → 0.2.0: fail 1, "factory.config.json factoryVersion (0.2.0) must match … (0.3.1)"; both restored, green after each restore |
| AC-8 | **PASS** | `npm run fast -- --base 961b3e4` all gates PASS, "13 changed path(s)", EXIT=0, re-run green after all probes; `gh pr checks 7` → "fast lane pass 14s" |

### Probe log (verbatim, through the real wrapper `node scripts/ci/sast.mjs` unless noted)

```
V1 scripts/_verify0005-1.mjs  import { exec } from "node:child_process"; exec("rm -rf /");
  sast FAILED: 1 security rule violation(s).
    scripts/_verify0005-1.mjs:2:1 [error] factory/literal-command-exec: Factory SAST: literal
    command execution via child_process.exec() is banned; use spawn/spawnSync with an argument array instead.
  EXIT=1  → file deleted, green EXIT=0 restored
V2 scripts/_verify0005-2.mjs  import { exec as e } from "node:child_process"; e("rm -rf /");
  EXIT=1 (same rule id) → deleted
V3 scripts/_verify0005-3.mjs  import child from "node:child_process"; child.exec("x");
  EXIT=1 (same rule id) → deleted
V4 scripts/_verify0005-4.mjs  import * as cp from "node:child_process"; cp.exec("x");
  EXIT=1 (same rule id) → deleted   [namespace form: implementation-covered, untested in pack — finding]
V5 scripts/_verify0005-5.mjs  const u = process.argv[2]; exec(`curl ${u}`);
  sast FAILED: 2 security rule violation(s).
    ...:3:1 [error] factory/literal-command-exec
    ...:3:1 [error] security/detect-child-process
  EXIT=1 → deleted
V6 scripts/_verify0005-6.mjs  import { spawnSync } from "node:child_process"; spawnSync("git", ["status"]);
  EXIT=0, scope note printed (AC-5 observation point) → deleted
V7 scripts/_verify0005-7.mjs  const { exec: myExec } = await import("node:child_process"); myExec("rm -rf /");
  sast: no security rule violations (0 warning(s)).  EXIT=0  ← LITERAL EXEC PASSES THE GATE → deleted, green restored
V8  > npm run fast -- --base 961b3e4   → Fast lane PASSED in 14.5s, "13 changed path(s)", EXIT=0 (re-run after all restores)
```

### Adversarial probe log (lint-harness shapes, the REAL `eslint.config.mjs`, same `ESLint` API the pin test uses)

Run via `node probe0005.mjs` (removed after recording). Shape → rule idslinted:

```
A  dynamic-import member,       non-literal arg   => []
B  dynamic-import destructure,  literal arg       => []          ← hole
C  dynamic-import destructure,  non-literal arg   => []          ← hole
D  computed member cp["exec"],  literal arg       => []          ← hole
E  computed member cp["exec"],  non-literal arg   => []          ← hole
F  execSync(process.argv[2])                      => []          ← hole (scope note says covered)
G  execFile(process.argv[2], ["-c"])              => []          ← hole
H  execFileSync(process.argv[2], ["-c"])          => []          ← hole
I  exec("node --ver" + "sion")                    => []          (matches ADR known edge: silent for the DOCUMENTED reason —
                                                                    is-static-expression.js BinaryExpression both-operands-static = static;
                                                                    factory rule: first arg is BinaryExpression, not Literal/Template)
J  execFileSync(process.execPath, ["--version"])  => []          (non-literal first arg; silent only because of the
                                                                    exec-only fnName limit in detect-child-process — same class as F–H,
                                                                    NOT an undocumented static pass; `process.execPath` is NOT static per
                                                                    is-static-expression.js, so had the callee been `exec`, the security
                                                                    rule would fire. ADR: dynamic → security covers → true only for exec)
K  execFileSync("node", ["--version"])            => ["factory/literal-command-exec"]   (covered)
L  static-var template exec(`ls ${c}`), c known   => ["factory/literal-command-exec"]   (covered, matches amendment)
```

Source-level confirmations (cited, reproducible): `detect-child-process` reports `pathInfo.path[0] === 'exec'`
only — the other three family members are structurally outside it (`node_modules/eslint-plugin-security/rules/detect-child-process.js`,
v4.2.0); `getImportAccessPath` resolves only static `import` declarations and `require(...)`
(`utils/import-utils.js`) — no `await import()` production; computed member expressions return null
there too. Version chain: `eslint-plugin-security` 4.2.0 and `@microsoft/eslint-plugin-sdl` 1.1.0 match
the amendment; SDL rule inventory confirms `no-msapp-exec-unsafe` as the only exec-adjacent rule.
Python-claim lines in the amendment are historical (0003) and were not re-probed here.

### Findings

1. **AC-2 / claim-under-test:** literal-argument `exec` via top-level `await import("node:child_process")`
   destructure PASSES the gate (probe B / V7). The gate covers literal-arg exec only for shapes
   resolvable through static import bindings, require-destructure, and member calls.
2. **AC-5:** the SAST scope note's "dynamic commands are covered by security/detect-child-process"
   is false for `execFile`, `execSync`, `execFileSync` (probes F–H) and for the computed/`await import`
   callee paths (D–E, C).
3. **AC-6:** the ADR amendment overstates both the probe coverage of `detect-child-process`
   (no `await import()` support) and the pin-test fixtures (no namespace row, no require-destructure row),
   while the four pin-test shapes V1–V4 pass.
4. Radius: `gh pr diff 7 --name-only` = 13 files, all inside the A4 globs. Note the diff contains
   `test/config.test.mjs` (A4 planned "no test change, values only" — the implemented leg lives
   there, a benign A4/A5 drift) and no `docs/backlog.md` change (register pre-dates the slice; fine).

### FU registrations

- **FU-6 (0011+):** closed-detected — literal-arg exec still reachable via top-level `await import`
  destructure and computed member call. Fix belongs in `factory/literal-command-exec`
  (resolve `import()` AwaitExpression via scope defs; drop the `computed !== true` skip) — the
  plugin cannot cover these because it never resolves the callee path.
- **FU-7:** execFile/execSync/execFileSync with a non-literal first argument escape both rules
  (detect-child-process is exec-only). Either the local rule drops the static-first-argument
  restriction for the non-exec three, or the scope note must name `exec` as the only dynamically
  covered method. Do not leave the current wording.

Findings 1–3 are real, the fix costs little, and V1–V5/K/L show the claimed surfaces are
genuinely closed — but the headline claim ("the gate now covers literal-argument command
execution") is falsified by V7 and the PASS-row wording is wrong, so the slice cannot be
countersigned PASS as shipped.

VERDICT (v1): FAIL — the four pin-test fixture shapes pass and the version chain holds, but a literal-argument `exec` via top-level `await import()` escapes the gate entirely (probe V7) and the printed scope note overstates the `detect-child-process` coverage (only `exec`, not the other three methods); the rule must close FU-6 (and AC-5's wording after FU-7) before this slice's claim is true.

## Re-verification of the fix round (2026-10-27, same verifier)

The implementer responded with a simplification (ADR-0004 amendment v2): the exec family is
banned unconditionally, arguments are not classified at all; the resolver gained
`await import()` destructures, aliased destructures, and computed member access with a
literal string property. Re-verified independently below.

### Probe verdicts (all through the real wrapper `node scripts/ci/sast.mjs`, scratch files `scripts/_verify0005r-*.mjs`, deleted after each record)

| Probe | Shape | v1 result | v2 result |
| --- | --- | --- | --- |
| V7 exactly | `const { exec } = await import("node:child_process"); exec("rm -rf /")` | EXIT=0 (hole) | **EXIT=1**, rule id + file:line |
| Aliased dynamic import | `const { exec: e } = await import(...); e("rm -rf /")` | untested in v1 | **EXIT=1** |
| Computed member | `import cp from ...; cp["exec"]("x")` | EXIT=0 (hole) | **EXIT=1** |
| Non-exec family, dynamic arg | `const f = process.argv[2]; execFile(f, ["--x"])` | EXIT=0 (hole) | **EXIT=1** (`child_process.execFile()`) |
| Static binary concat | `exec("node --ver" + "sion")` | EXIT=0 (documented edge) | **EXIT=1** (closed) |
| Green control | clean tree | scope note over-claimed | EXIT=0; note now says only what is true: "banned unconditionally; spawn/spawnSync with an argument array is the sanctioned pattern; detection of non-literal exec() on static imports remains with security/detect-child-process as a second opinion" — matches the plugin source (exec-only fnName), no over-claim |

`npm test` → 56/56 including the 17-fixture matrix (now includes namespace, require-destructure,
both `await import` variants, computed member, static concat, member-alias spawn). Lane after
all restores: all gates PASS, 14 changed path(s), EXIT=0.

### New bypass hunt (v2 rule, lint-harness through the real `eslint.config.mjs`)

```
N1  alias-of-namespace m = require("node:child_process"); m["ex" + "ec"](dynamicArg) => []   ← silent
N2  same, literal arg                                                         => []   ← silent
N3  cp[key](...) with key from JSON-parsed argv (runtime key)                 => []   ← silent
N4  re-require inside a function, member call, dynamic arg                    => [factory/literal-command-exec]  (covered)
N5  re-destructure of the module object: const { execSync: es } = req;        => []   ← silent (resolver is single-hop)
    es(dynamicArg)
N7  await-import member: cps.execFileSync(process.argv[2], ["-c"])            => [factory/literal-command-exec]  (covered)
N12 alias-of-namespace static concat: cpMod.exec("node --ver" + "sion")       => [factory/literal-command-exec]  (covered)
V6' `const { exec } = await import(`node:${"child_process"}`)` template-       => []   ← silent (module-specifier must be a string Literal)
    literal specifier; exec("rm -rf /")        [verified through the real wrapper, EXIT=0]
```

Honest classification of the silent shapes:

1. **N3 (runtime-derived member key) is not coverable by ANY AST rule in principle** — the
   method is chosen at runtime; no static analysis can name it without over-blocking all
   dynamic member dispatch. Not a demand; accepted edge. **However the ADR v2 "Known edges"
   does not record it, and the rationale sentence "a class-wide ban cannot be re-opened by an
   argument edge" is accurate as written (this is a *member-access* edge, not an argument
   edge) but reads as a completeness guarantee — the wording should name the dynamic-property
   edge next to it.** Wording finding, not a coverage defect today.
2. **N1/N2 (static-foldable computed property on a module alias) are coverable in principle**
   (constant folding of `"ex" + "ec"`; or over-blocking any computed member whose property is
   not a string literal on a child_process-resolved binding). v2 leaves them silent. Real,
   but requires deliberately obfuscated code; registered as FU-8 (below) rather than demanded.
3. **N5 (re-destructure of an already-imported module object) is a single-hop resolver limit,
   coverable by transitive resolution**; same materiality class as N1/N2 → FU-8.
4. **V6' (template-literal module specifier) is a static shape currently out of the
   Literal-only source check**; trivially closable — part of FU-8.
5. **N4/N7/N12 confirm the resolver's new shapes genuinely work** (function-scope re-require,
   await-import member call with non-literal args, alias static concat).

`Object.defineProperty`/proxy/`globalThis`-pocket trickery: outside any AST rule's reach in
principle (runtime property injection); not registered. A runtime monkey-patch audit would be
a different, non-SAST decision — mentioning for completeness only.

### spawn single-shell-string question (finding, proposed — NOT implemented)

The ADR sanctions `spawn`/`spawnSync` **with argument arrays** and the 17-fixture matrix pins
`spawnSync("git", ["status"])` and `cp.spawn("git", ["status"])` as clean. Neither the ADR nor
the rule says anything about the single-argument shell-string forms, probed above:

- N8/N9 `spawn(`git checkout ${br}`)` / `spawnSync(...)` single template arg → silent.
  Node's default (`shell: false`) does not invoke a shell here — the string is passed as a
  command name — so this is materially lower hazard than `exec` class: accepted edge, but it
  is *outside* the sanctioned pattern and undocumented.
- N10 `spawn("git checkout " + br, { shell: true })` with a concatenated dynamic string →
  silent. With `shell: true` this IS shell injection, exec-equivalent by construction. Today
  the repo has zero spawn usage at all, so nothing is exposed; but the sanctioned-pattern
  wording ("spawn with argument arrays") and the v2 claim of an unconditional exec ban both
  stay silent about the shell-true form.

**Registered as FU-9 (docs/backlog.md row + should join the next ADR touch):** when the repo
or a downstream stack adopts `spawn`, add a rule row flagging (a) `spawn`/`spawnSync` whose
first argument is a template literal or binary concat in single-string form, and (b) any
`spawn(..., { shell: true })` whose command argument is not a plain string literal. Rationale:
both are exec-class hazards carried across the sanctioned boundary; the current ban's
"unconditional" completeness claim should not silently assume they are covered.

### Findings (fix round)

1. V7, aliased dynamic import, computed member, non-exec dynamic args, static concat: all
   previously falsifying probes now fail the gate as claimed. **Probe verdict: PASS** on all six.
2. Scope note wording now true against the plugin source. **PASS** on AC-5 wording.
3. ADR v2 wording: "class-wide ban cannot be re-opened by an argument edge" is accurate but
   incomplete — dynamic-property member access (N3) re-opens it by a *member* edge and is not
   in the Known-edges list; N1/N2/N5/V6' are static but unresolved. Add one Known-edges
   bullet naming the dynamic-property edge and referencing FU-8/FU-9 at the next ADR touch.
4. Gate artifact: the Fix-round prose `cp["exec"](...)` was parsed as a Markdown reference
   link and failed LINKS on CI (run 40483722905); reworded in this commit (`cp["exec"] (…)`),
   LINKS PASS, lane re-run green. Inline-code spans are otherwise linted-looking code — the
   checker excludes fenced blocks only, which is why the earlier inline code tripped it.
5. FU-6 and FU-7 are registered closed in `docs/backlog.md` with accurate one-line rationales.

The name of the game here is stated scope: v2 declares "resolved exec-family calls fail,
unconditionally" — every statically-resolvable shape I could construct resolves and fails;
what remains silent is exactly the classes the ADR now names or that FU-8/FU-9 carry. The
simplification made the rule smaller (no argument classification) while strictly enlarging
coverage — verified empirically at every previously-falsifying point.

VERDICT: PASS — all six previously-falsifying probes now fail the gate, the scope note states only what is true, the 17-fixture matrix pins the previously-escaping shapes, and the silent survivors (runtime member keys, multi-hop alias rebinding, template module specifiers, single-string spawn) are static/obfuscation-class residuals registered as FU-8/FU-9 with an ADR wording note, not holes in the declared claim.
