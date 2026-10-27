# Evidence pack (A5)

> Station S4 · Gate G5a · Every AC maps to reproducible evidence. An agent summary
> is not evidence; a gate passes only on output a reviewer can reproduce.

| Field | Value |
| --- | --- |
| Slice | [0009 — Close the verifier-flagged gate debt: FU-4 + FU-8](A4-slice-plan.md) |
| Spec | [A2](A2-spec.md) v1 |
| Verified by | drafting agent (self-verification) + independent fresh-context verifier (round 1: **FAIL** → fixed; round 2: **PASS**) |
| Date | 2026-10-27 |

## Fresh-context round 1 — FAIL, and what it changed

The independent verifier reproduced everything and found three blocking problems,
all fixed in this revision:

| Finding | Severity | Fix |
| --- | --- | --- |
| B1: the lib check was a substring *mention* check — a rewired wrapper whose stale comment still named the old specifier false-passed (`node --test test/config.test.mjs` → 16/16 green in the verifier's shadow tree) | blocking | `wrapperImportsLib` now strips `//` comments (URL-safe) and requires the lib specifier inside a real `from "…"` / `import("…")` clause; the synthetic fixture gained the exact false-pass shape (rewired wrapper + stale comment) and must be named |
| B2: the A5's lane/smoke transcripts said 70/70 while the committed tree runs 72 — the transcripts described the pre-change tree and were not reproducible | blocking | all transcripts below were re-run against this exact tree after the fixes (see the verbatim blocks) |
| B3: the A2 promised an alias chase "bounded at 5 hops"; no hop bound existed (6/200/2000-hop chains all resolved) | blocking | `MAX_ALIAS_HOPS = 5` implemented in `chainReachesRequire`; deeper chains degrade to the accepted-edge class (unresolvable → clean) |
| N1/N2: accepted-edge note too narrow; pre-existing static escapes (`const K = "exec"; cp[K]`, empty interpolation, `const {exec} = cp`, createRequire bound to a non-`require` name) were undocumented | non-blocking | the rule header now records every accepted edge explicitly; the const-bound-key and empty-interpolation edges are pinned as clean fixtures |
| N3: wired G4e appeared to have an unpinned wrapper (`scripts/ci/links.mjs`) | non-blocking | resolved as a verifier misreading, now documented in the table: links.mjs implements the `docs.link` port of G0 (manual); G4e's audit logic runs inline in fast.mjs via `runNpm`, so it has no wrapper file — its libs are pinned via `LANE_LIBS` |
| N5: folding widens the over-approximation (folded exec key on a non-child_process object is flagged) | non-blocking | recorded in the rule header as by-design (ADR-0004's unconditional ban); pinned by the fixture that lints a folded exec key on a plain object and expects the factory rule to fire |
| N4: the A5 claimed "all 6 pre-existing sanctioned fixtures" — only 3 pre-existing fixtures are clean | non-blocking | wording corrected in this revision |

## AC-to-evidence map

| AC | Result | Evidence |
| --- | --- | --- |
| AC-1 declared links exist + imported; synthetic negative | PASS | `test/config.test.mjs`: "every lib module a wired gate declares exists and is imported by its wrapper" ✔ (real tree: all gates + the 9-module lane pin) and "the lib-link check fails when a wrapper stops importing a declared lib" ✔ — including the B1 false-pass shape |
| AC-2 rename smoke | PASS | re-run verbatim below against this tree (72 tests) |
| AC-3 three FU-8 shapes rejected by the real pack | PASS | fixture matrix (17 → 26): constant-folded computed key, template-literal specifier (require + await import), multi-hop require alias chain — all lint to `factory/literal-command-exec` through the REAL `eslint.config.mjs`. Independently confirmed by the round-1 verifier (main's rule: all four new shapes `[]`; 0009's rule: all caught) |
| AC-4 sanctioned patterns stay clean | PASS | negatives: `cp[key]` runtime (accepted edge), const-bound key (accepted edge, N1), empty interpolation (accepted edge, N1), spawn through member alias, spawn through require alias chain — all `[]` |
| AC-5 lane green; release files untouched | PASS | lane run below; `.github/workflows/release.yml`, `src/**`, `docs/decisions/**`, `package.json`, lockfile untouched (confirmed by the verifier's `git diff main...HEAD` check); no new dependency |

## Rename smoke (AC-2, verbatim, run against this tree)

```
$ Rename-Item scripts/ci/lib/sast.mjs sast.mjs.bak
$ npm test
  AssertionError [ERR_ASSERTION]: Wired gates with drifted wrapper/lib links:
  G4b: scripts/ci/sast.mjs declares missing lib "lib/sast.mjs",
  lane: scripts/ci/fast.mjs declares missing lib "lib/sast.mjs"
$ Rename-Item scripts/ci/lib/sast.mjs.bak sast.mjs    (restore)
$ npm test → ℹ tests 72 · ℹ pass 72 · ℹ fail 0
```

The failure NAMES the gate and module — the config test, not an accidental lane crash.

## Fast lane (verbatim, run against this tree)

```
$ npm run fast -- --base e4b1998
  CONFIG PASS · G4a PASS · FORMAT PASS · LINT PASS · SAST PASS · G4b PASS
  G4c    PASS  72 passed, 0 failed, 16218.4574ms
  LINKS  PASS · G4d PASS · HISTORY PASS · G4e PASS · G4f PASS
Fast lane PASSED in 25.8s (budget 10m).
```

## Probe record

One resolver defect found and fixed during implementation (probe-first): the alias
chase pre-seeded the seen-set with the callee's own name, blocking the first hop of
every chain. The fixture caught it before any commit.

## Fresh-context verification: verified — PASS, round 2 (independent session, 2026-10-27)

Round 1 verdict was **FAIL** (B1/B2/B3 above); all findings are addressed in this
revision. Round 2 verdict: **PASS** — the independent verifier confirmed all five
points from the checklist:

1. B1 fix confirmed: `wrapperImportsLib` strips comments and requires the specifier
   inside a real import clause; the rewired-wrapper scenario is named.
2. B3 fix confirmed: `MAX_ALIAS_HOPS = 5` — a 3-hop chain is caught, a 200-hop chain
   degrades clean without hanging.
3. B2 fix confirmed: `npm test` → 72/72; the rename smoke reproduced (failure names
   `G4b` + lane + `lib/sast.mjs`), restore green.
4. N1/N2/N5 confirmed: header's accepted edges and over-approximation match the code.
5. Untouched confirmed: `git diff main...HEAD` over release/product/ADR paths is empty.
