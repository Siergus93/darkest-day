# Spec (A2)

> Station S1 · Gate G1 (design sections: G2) · Every acceptance criterion must be
> **observable** and mapped to a **verification method**.

| Field | Value |
| --- | --- |
| ID / title | |
| Problem brief | |
| Tier | |
| Version | |
| Owner | |

## Scope

<!-- What this spec covers, in two or three sentences. -->

## Behaviors and acceptance criteria

| AC | Behavior | Acceptance criterion (observable) | Verification method | Status |
| --- | --- | --- | --- | --- |
| AC-1 | | | | |
| AC-2 | | | | |

Guidance: an acceptance criterion names an input, the observable result, and the condition
that would make it false. "Works correctly" is not a criterion.

## Non-functional requirements

| Attribute | Target | Measured how | Applies to |
| --- | --- | --- | --- |
| Latency | | | |
| Throughput | | | |
| Availability | | | |
| Recovery | | | |
| Data durability | | | |

Write "not required, because …" rather than leaving a row blank.

## Authorization

| Actor | Operation | Data scope | Allowed | Denied behavior |
| --- | --- | --- | --- | --- |
| | | | | |

## Data lifecycle

| Data | Created by | Retained | Deleted by | Exported by | Sensitive? |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Failure modes

| Dependency or condition | Mode | Expected behavior | User-visible result |
| --- | --- | --- | --- |
| | Slow / absent / malformed / partial | | |

## Edge cases

- 

## Out of scope

- 

## Assumptions and open questions

| # | Assumption or question | Owner | Blocking? | Resolution |
| --- | --- | --- | --- | --- |
| 1 | | | | |

## Design constraints and boundaries (T2+)

| Component | Owns | May depend on | Must not depend on | Owner |
| --- | --- | --- | --- | --- |
| | | | | |

- **Contracts and compatibility rule:**
- **Transaction boundaries / consistency:**
- **Trust boundaries and threats specific to this change:**
- **Deployment and observability shape:**
- **Migration approach (expand / migrate / contract):**
- **Decisions recorded (A3 links):**

## Definition of Done

- [ ] Every AC has a reproduced result in A5.
- [ ] Failure paths and authorization are exercised.
- [ ] No secret, no unjustified dependency, no unrelated change.
- [ ] Undo procedure is defined in A4.
- [ ] Decisions recorded; docs consistent with behavior.
- [ ] Stack delta from the adapter satisfied (link):

## Gate G1 checklist

- [ ] Every AC is observable and has a verification method.
- [ ] Every NFR is numeric or explicitly waived with a reason.
- [ ] Authorization matrix is complete for all actors and operations.
- [ ] Data lifecycle covers deletion and retention.
- [ ] Blocking questions: **zero**.
- [ ] Out of scope is non-empty.
