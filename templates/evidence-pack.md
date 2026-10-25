# Evidence pack (A5)

> Station S5 · Gate G5 · Proof, not summary. Every result must be reproducible by a
> reviewer from the commands recorded here.

| Field | Value |
| --- | --- |
| Slice | |
| Spec / slice plan | |
| Tier | |
| Artifact versions verified | <!-- A2 vN, A4 vN; a link without a version is not evidence --> |
| Commit / artifact | |
| Date | |
| Author | |
| Verifier | <!-- must not be the author at T2+ --> |

## Gate results

| Gate | Status | Evidence | Command / location |
| --- | --- | --- | --- |
| G4a clean build | passed / failed / manual / waived | | |
| G4b format + lint + static | | | |
| G4c fast tests | | | |
| G4d secret scan | | | |
| G4e dependency policy | | | |
| G4f blast radius | | | |
| G5a AC verification | | | |
| G5b contracts | | | |
| G5c authorization | | | |
| G5d migration compatibility | | | |
| G5e boundary failure | | | |
| G5f performance | | | |
| G5g tests can fail | | | |
| G5h flaky budget | | | |

## Acceptance criteria evidence

| AC | Criterion (verbatim) | Result | Evidence | Would a wrong implementation fail this? |
| --- | --- | --- | --- | --- |
| AC-1 | | | | yes / no / unclear |

## Commands run

<!-- Verbatim, with exit codes. "Not run" is a valid entry; silence is not. -->

| Command | Exit code | Summary |
| --- | --- | --- |
| | | |

## Test tiers

| Tier | Count | Failed | Skipped | Duration | Notes |
| --- | --- | --- | --- | --- | --- |
| Isolated | | | | | |
| Boundary | | | | | |
| Contract | | | | | |
| Journey | | | | | |

## Security

| Check | Result | Notes |
| --- | --- | --- |
| Authorization / cross-scope access | | |
| Input validation and output encoding | | |
| Secrets and sensitive logging | | |
| Dependency vulnerabilities | | |
| Threat-model items from A2 | | |

## Data and migrations

| Check | Result | Notes |
| --- | --- | --- |
| Forward migration | | |
| Previous version with new schema | | |
| Rollback or forward fix | | |
| Concurrency / duplicate request | | |

## Performance

| Path | Target | Measured | Environment | Verdict |
| --- | --- | --- | --- | --- |
| | | | | |

## Resilience

| Boundary | Failure injected | Observed behavior | Meets A2 |
| --- | --- | --- | --- |
| | timeout / error / malformed / partial | | |

## Known gaps and waivers

| Gate | Reason | Compensating control | Owner | Expires |
| --- | --- | --- | --- | --- |

## Agent declaration (if an agent produced the change)

- Assumptions:
- Deviations from A4:
- Residual risk:
- Commands not run and why:
- Open questions:

## Review findings

| # | Location | Risk | Condition under which it matters | Resolution |
| --- | --- | --- | --- | --- |
| 1 | | | | |

## Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Verifier | | | |
| Reviewer | | | |
| Human (T2+) | | | |
