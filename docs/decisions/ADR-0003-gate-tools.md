# ADR-0003 — Gate tools for format, lint, SAST, audit enforcement, and secret history

| Field | Value |
| --- | --- |
| ID | ADR-0003 |
| Title | Gate tools for format, lint, SAST, audit enforcement, and secret history |
| Status | accepted |
| Supersedes note | 2026-10-26: clauses 2 and 3 superseded by [ADR-0004](ADR-0004-sast-and-history-implementation.md); clauses 1, 4, 5 remain in force |
| Date | 2026-10-26 |
| Owner | Siergus |
| Tier | T2 |
| Supersedes | — |

## Context

The fast lane reports `G4b PARTIAL` (format, lint, SAST are adapter exceptions), `G4e
PARTIAL` (audit advisory, never observed failing), and `G4d` covers the working tree only.
Every run produces a knowingly incomplete verdict, and the compensating control is "manual
review", which is unenforceable. Slice 0003 wires the missing checks. The decision binds
only the factory-tooling stack of this repository; a future product stack re-binds via its
own adapter (ADR-0001 scope rule).

## Decision drivers

- One human plus agents; every unenforced rule decays into a waiver.
- Windows (local) and `ubuntu-24.04` (CI) must behave identically.
- Minimal dependency surface: binaries over transitive npm trees where possible.
- Each check must be invocable in isolation and fail with a file/line message.
- The fast lane budget (10 min; currently ~15 s) must absorb ≤ 30 s added time.

## Options considered

### Option 1 — Biome + Semgrep + gitleaks (binaries)

**Description:** Biome covers format and lint with one binary and zero-config defaults;
Semgrep runs a small repo-committed rule pack; gitleaks scans full git history. All three
run as standalone executables, invoked by resolved path.

**Pros:** one tool for two obligations; no interpreter runtime (except Node, already
required); all three observed-current on Windows; allow-list configs are declarative and
reviewable in-repo.

**Cons:** Semgrep's rule language is its own to learn; gitleaks has historical
false-positive noise; binaries are downloads, so CI must install them deterministically
(pinned versions, checksum-verified or via a pinned package).

**Cost to reverse:** low — replace one script's invocation and config.

### Option 2 — ESLint (+ plugins) + nodejsscan + TruffleHog

**Description:** The conventional JS stack: ESLint with eslint-plugin-security,
nodejsscan for JS SAST, TruffleHog for history.

**Pros:** ESLint has the largest rule ecosystem; nodejsscan is JS-specific.

**Cons:** three config surfaces to learn and keep aligned; nodejsscan hard-requires Python
(not installed on this machine); TruffleHog additionally performs version/secret-verification
lookups that are over-provisioned for a history scan here. Three dependencies to pin instead
of one-plus-two-binaries.

**Cost to reverse:** low — same swap cost — but higher to run and maintain, with worse
Windows ergonomics here.

## Decision

1. **Biome** for format and lint (one binary, both obligations, shipped clean or the gate
   stays `PARTIAL` with a named pre-existing-violation list — never a rule that ships red).
2. **Semgrep** for SAST with a small repo-committed rule pack; the pack starts with the
   classes the injected-defect smoke tests exercise, not a maximal pack.
3. **gitleaks** for full-history secret scan. It is wired into the fast lane while the repo
   is small; if a timed run exceeds 60 s the scan moves to the deep lane (recorded as a
   config change, not a code change).
4. `npm audit` becomes blocking at exit-code level once the audit-failure fixture proves
   exit 1 on a high/critical advisory; moderates report but do not fail.
5. A tool's waiver in the register retires only after it has been **observed failing once
   and passing once**. Until both observations exist, the row stays declared, not waived.

## Consequences

**Positive:** every fast-lane row becomes reproducible evidence; manual-review waivers for
format/lint/SAST/audit/history retire; the summary stops reporting known incompleteness.

**Negative:** three new binaries and one npm dev-dependency set to pin and update; rule-pack
maintenance is a real (small) ongoing cost; the lane's first experience gets stricter —
a dirty local tree can fail for a format reason it could not before.

**Neutral / follow-up work:** pre-existing violations, if found, are fixed in this slice or
recorded as an explicit staying-`PARTIAL` row; deeper rule packs are follow-ups, not this
slice; the deep-lane wiring itself is untouched.

## Revisit trigger

Any of: a timed history scan exceeding 60 s twice in a row; a tool producing a
un-investigatable false-positive rate that is recorded twice in A5s; a Node/OS update
breaking a pinned binary on either platform; the first product stack choosing different
tools for the same obligations.

## Links

- Problem brief: [0002 A1](../../work/0003-fast-gate-debt/A1-problem-brief.md)
- Spec: [0003 A2](../../work/0003-fast-gate-debt/A2-spec.md)
- Related decisions: [ADR-0001](ADR-0001-tooling-stack.md) (tooling stack), [ADR-0002](ADR-0002-artifacts-and-manifest.md) (manifest)
- Evidence that informed this: slice 0002's A5 waiver table; observed gate rows since v0.2.0.
