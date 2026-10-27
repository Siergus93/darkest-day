# Slice plan (A4)

> Station S3 · Gate G3 · A slice is the smallest change that produces **observable**
> behavior. The tier declared here governs the whole change.

| Field | Value |
| --- | --- |
| ID / title | 0006 — First product: the factory CLI (`factory status` / `factory check`) |
| Spec | [A2](A2-spec.md) v1 · Roadmap: [docs/backlog.md](../../docs/backlog.md) |
| Tier | T2 |
| Tier downgrade reason | n/a |
| Version | 1 |
| Owner | Siergus |
| Target release | Factory v0.3.2 (unreleased) |

## Observable outcome

`node dist/cli.js status` prints the gate catalog; `node dist/cli.js check --base <ref>`
prints the change-set verdict with the same semantics as the lane's G4f row, failing
exit-1 on a protected-path escalation or an outside-radius path. The v0.3.2 release cut
rides with the pointer move.

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | `src/**` (new cli.ts entry + ambient declarations for the shared engines), `test/**` (new cli test), `tsconfig.json` (only if the entry compilation requires it — expected not), `factory.config.json` (release cut: `factoryVersion` 0.3.2, `activeSlice` → this slice), `package.json` + `package-lock.json` (version field only, no new dependency), `CHANGELOG.md` (release cut), `AGENTS.md` (active-slice line), `work/README.md` (0005/0006 rows), `docs/backlog.md` (row update), `work/0006-factory-cli/**` | `factory.config.json` is protected → T2. No `scripts/ci/**` logic moves; a thin ambient `.d.ts` bridge may be needed inside `src/**` only. No `.github/**` or `adapters/**`. |
| Public contracts | none yet | The CLI has no published contract while undeployed; its manifest/output shape is fixed by A2 ACs 1–6 as de facto stability promise, not yet contract gate (G5b stays n/a). |
| Data / schema | none | — |
| Configuration / secrets | `factory.config.json` values (`factoryVersion`, `activeSlice`) | Declared; no secrets. |
| Infrastructure | none — CLI compiles through the existing build; no workflow change (0007 owns the release lane) | — |
| Protected paths | yes | `factory.config.json` (release cut only, deliberate and declared). |

## Undo

| Method | Steps | Time to undo | Data loss risk |
| --- | --- | --- | --- |
| Revert commit | `git revert <commit>` | < 2 min | none |
| Manual revert | Remove `src/cli.ts` + its test + bridge declarations; restore config/version fields; restore CHANGELOG/AGENTS/work README rows | < 10 min | none |

## Steps

Ordered by risk: the import bridge to the shared engines is the assumption most likely
to need rework (A1 assumption 1), so the probe is first.

1. Probe the bridge: minimal `src/cli.ts` importing `loadConfig` + change-set/check
   functions from `scripts/ci/lib/*.mjs` with ambient declarations; run `npm run build`
   + one hand-run of `status` before writing more.
2. Implement `factory status` (AC-1) and `factory check` (AC-2/3/4), reusing shared
   engines; `usage()`/arg parsing by hand (AC-6). Keep `spawn`/`spawnSync` arg-array
   only (SAST rule).
3. Add unit tests against the built dist (the `src/tiers` pattern) incl. the
   change-set parity check against `scripts/ci/blast-radius.mjs` (AC-5).
4. Release cut: CHANGELOG v0.3.2, `factoryVersion`, `package.json`+lockfile version,
   `activeSlice` → this slice, AGENTS.md line, work README rows, backlog row.
   (Break: none — AC-8 asserted by the existing config test extended for package.json a slice ago.)
5. Break-and-restore smokes (protected-path change → exit 1; outside-radius staged file
   → exit 1; restore → green); record verbatim in A5.
6. Full lane run vs the 0005 merge commit; PR; fresh-context verification.

## Verification plan

| AC | Check | Tier of test | Where it runs | Evidence location |
| --- | --- | --- | --- | --- |
| AC-1 | status output + exit 0 | isolated | Local + CI | A5 smoke |
| AC-2 | check PASS + tier line on clean tree | isolated | Local + CI | A5 smoke |
| AC-3 | protected-path change → exit 1 naming escalation; restore | isolated | Local | A5 smoke 1 |
| AC-4 | outside-radius change → exit 1 naming path; restore | isolated | Local | A5 smoke 2 |
| AC-5 | change-set parity with blast-radius.mjs on the same base | isolated | Local + CI | the unit test itself + A5 row |
| AC-6 | --help texts + unknown-arg exit 1 | isolated | Local + CI | A5 smoke 3 |
| AC-7 | lane green, lockfile version-only diff | command | Local + CI | A5 lane run + `git diff --stat package-lock.json` |
| AC-8 | three-way version agreement + pointer | isolated | Local | existing config test (extended) |
| AC-9 | CI on PR exits 0 | manual → observed | GitHub Actions | Run URL in A5 |

## Risks and ordering rationale

| Risk | Why this order | Early signal |
| --- | --- | --- |
| Bridge to shared engines fails (compile/runtime path) | Step 1 is exactly this probe | Build failure / runtime ESM error |
| Verdict drift between CLI and lane | AC-5 parity test guards permanently; the shared-engine design minimizes drift by construction | Failing parity test |
| Scope creep into "real product surface" | Non-goals + review budget name the split line | Any new command design |

## Review budget

| Field | Estimate |
| --- | --- |
| Files changed | 8–10 |
| Logical lines changed | ~250–400 (CLI ~150, tests ~120, release cut ~80, bridge ~30) |
| If over budget, split by | Drop `factory status` into a follow-up (they share the bridge, so at most one command slips out); the release cut is never split |

## Gate G3 checklist

> Self-review done 2026-10-27 by the drafting agent; human G3 review pending.

- [x] The slice is vertical and observable on its own.
- [x] Tier is declared; protected paths checked; escalation applied if needed.
- [x] Blast radius is complete.
- [x] Undo is executable by one person and has a time estimate.
- [x] Verification covers every AC, including the expensive ones.
- [x] The diff fits the review budget.
- [x] No blocking dependency on a later slice.
