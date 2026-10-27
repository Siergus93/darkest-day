# Spec (A2)

> Station S1 · Gate G1 · Each acceptance criterion is observable and has a tier of test.
> Version 1 · Owner Siergus · 2026-10-27

## Problem being solved

Fresh-context verification — the only step that has caught a shipped-but-wrong claim —
is a convention with no machine check, and the A8 learning cadence has never run. This
slice files the factory's first A8 and turns the convention into a checkable artifact
requirement, trialed for three slices.

## Design

Three changes, none to the release lane or product code:

1. **A8 filed** — the first learning review lives at
   `work/0001-enforce-phase-0/A8-learning-review.md` (drafted on this branch, commit
   `378fe29`), reviewing the slice-0001 bet against seven slices of evidence. It
   proposes exactly one factory change: this slice. Linked from `work/README.md`.
2. **PR template** — the Evidence section gains a mandatory field:

   ```
   - Fresh-context verification: <verifier context/model> · <A5 section link> — or "pending: verifier runs before merge"
   ```

   "pending" is honest while the PR is open; the human reviewer must see a verdict,
   not a pending marker, before merging.
3. **Config test** (data-checked, fail-closed): a new test in `test/config.test.mjs`
   asserts that the **active slice's** A5 contains a `Fresh-context verification:`
   record. Presence-only: the machine checks existence, the reviewer checks content.
   The test runs on every lane invocation, so a slice whose A5 lacks the field cannot
   go green. Enforcement is forward-looking by construction — it always checks the
   active slice, so every future slice inherits it at zero ceremony.

Per the A8's template rule, the field's content quality is re-reviewed at slice 0010's
A8 (the three-slice trial); this slice records the trial's start, not its verdict.

## Acceptance criteria

| AC | Statement | Tier of test |
| --- | --- | --- |
| AC-1 | The PR template contains the mandatory fresh-context field with the pending-allowed wording | isolated (string test) |
| AC-2 | The active slice's A5 passes the config test when the field is present ("pending" or a verdict) and fails when absent | isolated (real tree + synthetic fixture) |
| AC-3 | The first A8 exists at `work/0001-enforce-phase-0/A8-learning-review.md`, follows the template, is linked from `work/README.md`, and all its links resolve | isolated (LINKS gate) |
| AC-4 | `activeSlice` points at this slice with a complete A4; the version chain is untouched (no release cut rides — 0.4.0 is current) | isolated |
| AC-5 | The fast lane stays green and the release lane is untouched | command |

## Non-criteria

- Enforcing the field's content quality by machine (a verdict's honesty is not
  machine-checkable; anti-gaming stays human).
- Retroactive A5 fields for slices 0001–0007.
- Per-slice A8 automation beyond the existing template.

## Open questions

None blocking.
