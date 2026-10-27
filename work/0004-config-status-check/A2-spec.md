# Spec (A2)

> Station S1 · Gate G1 · Each acceptance criterion is observable and has a tier of test.
> Version 2 · Owner Siergus · 2026-10-27
>
> v2 adds AC-8 after the drafting agent's lane run hit the Windows CRLF checkout defect
> (fresh checkouts on `core.autocrlf=true` machines break the FORMAT gate). Decision by the
> owner, 2026-10-27: fix inside this slice — the drift class is what the slice is about.

## Problem being solved

Gate statuses in `factory.config.json` can drift from reality in both directions and nothing
fails. This slice makes drift a test failure and adds the v0.3.0 release cut that must ride
with the `activeSlice` pointer move.

## Design

The check lives in `test/config.test.mjs` as data plus assertions; no production code changes.

- An **expectations table** maps each `wired` gate id to machine-checkable evidence:
  - `wrappers`: script files under `scripts/ci/` that must exist on disk;
  - `rows`: lane-row labels that must appear in `scripts/ci/fast.mjs`.
  Port names (`format.check`, `vcs.diff`, …) do not map to filenames mechanically, so the
  table is the declared mapping — adding a gate is a one-line data edit.
- Assertions, in order:
  1. **Set equality** — gates with `status: "wired"` exactly equal the table's keys.
     Catches both a `wired` flip without wiring and wiring that lost its status.
  2. **Status enum** — every status is one of `manual`, `wired`, `partial`, `n/a`.
  3. **Wrappers exist** — each declared file exists.
  4. **Lane rows exist** — each declared label appears in `scripts/ci/fast.mjs`.
  5. **Version coherence** — `factoryVersion` equals the newest released `## [x.y.z]`
     section in `CHANGELOG.md`, and `activeSlice` names an existing directory that contains
     an `A4-slice-plan.md`.
- Failure messages name the gate and the missing thing (file path or row label).

The release cut (this slice's step 1) is what assertion 5 exists to guard.

## Acceptance criteria

| AC | Statement | Tier of test |
| --- | --- | --- |
| AC-1 | Gates declared `wired` in `factory.config.json` are exactly the expectations table's keys, both directions; mismatch fails naming the gate(s) | isolated |
| AC-2 | Flipping any gate to `wired` without wiring (e.g. `G6a`) fails `npm test` naming the gate; restore passes | isolated (break-and-restore) |
| AC-3 | Renaming a declared wrapper (e.g. `scripts/ci/sast.mjs`) fails `npm test` naming the gate and the missing path; restore passes | isolated (break-and-restore) |
| AC-4 | Removing a declared lane row label from `scripts/ci/fast.mjs` (temporarily) fails `npm test` naming the gate and label; restore passes | isolated (break-and-restore) |
| AC-5 | A `factoryVersion`/`CHANGELOG` mismatch and an `activeSlice` pointing at a directory without an A4 each fail `npm test` with a specific message; restore passes | isolated (break-and-restore on scratch copies or the working tree) |
| AC-6 | Clean tree: `npm test` green with the added check running under 1 s | isolated (timed) |
| AC-7 | `npm run fast -- --base <pre-slice sha>` green after the release cut and the check land | command |
| AC-8 | `.gitattributes` (`* text=auto eol=lf`) exists; `git add --renormalize .` is a no-op; a fresh checkout of a tracked text file is LF on disk on a `core.autocrlf=true` machine | isolated + command (break-and-restore checkout smoke) |

## Non-criteria

- Content quality of gate `notes` (human review, unchanged).
- Any change to lane behavior, wrapper behavior, or exit codes.
- The FU-2 SAST coverage decision.

## Open questions

None blocking. The expectations-table mapping is a design decision recorded above and in
A4; if a reviewer prefers the table in `factory.config.json` itself, that is an amendment,
not a blocker — the test is the enforcement point either way.
