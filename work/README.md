# Work

One directory per slice, named `NNNN-slug`. A slice directory holds its A1, A2, A4, and A5,
plus A6–A8 when the slice reaches release, operation, or its outcome horizon. Decision
records live in [`../docs/decisions/`](../docs/decisions/) because they outlive a slice.

| Slice | Title | Tier | State | Evidence |
| --- | --- | --- | --- | --- |
| [0001](0001-enforce-phase-0/) | Enforce the Phase 0 gates | T2 | S6 — release | [A5](0001-enforce-phase-0/A5-evidence-pack.md) · [A6](0001-enforce-phase-0/A6-release-record.md) |
| [0002](0002-vcs-faithful-diff/) | Make the local change set VCS-faithful | T2 | S6 — release | [A5](0002-vcs-faithful-diff/A5-evidence-pack.md) (merged via PR #3) |
| [0003](0003-fast-gate-debt/) | Close the fast-gate debt: format, lint, SAST, audit, history | T2 | S5 — verified | [A5](0003-fast-gate-debt/A5-evidence-pack.md) (merged via PR #4) |
| [0004](0004-config-status-check/) | Automated config-status check | T2 | S6 — release | [A5](0004-config-status-check/A5-evidence-pack.md) (merged via PR #5, fresh-context verified) |
| [0005](0005-sast-literal-coverage/) | SAST coverage: literal-argument command execution | T2 | S4 — build | [A5](0005-sast-literal-coverage/A5-evidence-pack.md) |

Update the row when a gate passes, not when work starts. The convention is defined in
[`../docs/software-factory/08-artifacts.md`](../docs/software-factory/08-artifacts.md).
