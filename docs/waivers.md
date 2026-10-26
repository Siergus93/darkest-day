# Waiver register

A waiver is a recorded acceptance of risk, not a bypass. The authoritative detail lives in
the linked A5; this register exists so expiries are visible. Per
[08-artifacts §7](software-factory/08-artifacts.md): required fields are gate, slice/A5
link, reason, blast radius, compensating control, owner, and expiry; an expired waiver
fails the gate.

Rules:

- Never waive G4d (secrets) or G5c (authorization), and never waive a T3 step without human
  sign-off.
- If the same gate is waived repeatedly, the gate is wrong: change the gate, not the waiver.
- A row retires only when the gate has been observed failing once and passing once, and the
  enforcement joins the blocking lane; retirement is recorded here, never by editing a
  signed A5.

## Active

| Gate | Slice / A5 | Reason | Blast radius | Compensating control | Owner | Expires | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | No active waivers. | — | — | — | — | — |

## Retired — by slice 0003 (2026-10-26), enforcement replaced the waiver

These rows correspond to the "documented limitations with owners and expiries" recorded in
slice 0002; they were retired by wiring the gates, not by expiry.

| Gate | Limitation | Origin | Retirement evidence |
| --- | --- | --- | --- |
| G4b format/lint/SAST | Manual review in place of selected tools | [0002 A5](../work/0002-vcs-faithful-diff/A5-evidence-pack.md) | Wired as the `FORMAT`, `LINT`, `SAST` rows (biome 2.6.3; ESLint 9 + `@microsoft/eslint-plugin-sdl` 1.1.0 + `eslint-plugin-security`); observed failing on injected defects then green; [adapter record](../adapters/stack/node-typescript.md) smoke table |
| G4d history | History not covered by the working-tree scan | [0002 A5](../work/0002-vcs-faithful-diff/A5-evidence-pack.md) | `secrets.history` wired (same repo-owned ruleset over `git log -p --all`, per [ADR-0004](decisions/ADR-0004-sast-and-history-implementation.md)); fixture-repo red test plus real-repo green run |
| G4e advisory | `npm audit` advisory, never observed failing | [0002 A5](../work/0002-vcs-faithful-diff/A5-evidence-pack.md) | Observed failing (scratch `lodash@4.17.20` project, exit 1); `npm audit --audit-level=high` promoted to blocking with the advisory list named on failure |
