# 02 — Stations

A station is a place where a specific class of question must be answered before the work
advances. Stations are not calendar phases and not job titles. A single person or agent may
work several stations, but **must not be the sole approver of a gate at T2 or above**.

| Station | The question | Produces | Exit gate |
| --- | --- | --- | --- |
| S0 Frame | Should this exist at all? | A1 Problem brief | G0 |
| S1 Specify | What must be true, and what is excluded? | A2 Spec | G1 |
| S2 Design | How is it structured, and what does it cost to change? | A3 Decisions | G2 |
| S3 Slice | What is the smallest shippable piece, and how do we undo it? | A4 Slice plan | G3 |
| S4 Build | Does the implementation match the spec, within bounds? | Change set + tests | G4 |
| S5 Verify | What proof do we have that it behaves correctly under stress? | A5 Evidence pack | G5 |
| S6 Release | Can this be shipped and reversed safely? | A6 Release record | G6 |
| S7 Operate | Will we know it is healthy, and can we recover? | A7 Runbook | G7 |
| S8 Learn | Did the outcome happen, and what should change? | A8 Learning review | G8 |

Human decision rights are listed per station. Everything else is delegated within the
autonomy level in [05-agents](05-agents.md).

---

## S0 — Frame

**Purpose:** prevent building the wrong thing correctly. This is the cheapest place to stop.

**Obligations**

- The affected user and the problem are named, in the user's terms.
- The current workaround and its specific cost are described.
- The outcome is measurable: a metric, a baseline, a target, and a horizon.
- Non-goals are explicit. Constraints (time, money, regulation, legacy, skills) are listed.
- The risk tier is declared and the owner is named.

**Exit G0:** an outcome that could fail. If nothing could prove the bet wrong, the brief is
not finished.

**Human decides:** whether to spend on this problem at all; the success metric.

**Common failure:** a feature list with no problem statement, or a metric that only measures
activity ("ship the dashboard") rather than outcome ("reduce reconciliation time by 40%").

---

## S1 — Specify

**Purpose:** turn intent into falsifiable statements, including the ones that are easy to
forget: authorization, data lifecycle, failure, and exclusion.

**Obligations**

- Each functional behavior has at least one acceptance criterion that is **observable** and
  can be shown false by a specific check.
- Non-functional requirements are numeric (latency, throughput, availability, recovery) or
  explicitly declared not required, with a reason.
- Authorization is a matrix of actor × operation × data scope, not a sentence.
- Data lifecycle is described: creation, retention, deletion, export, and who may do each.
- Failure modes and degraded behavior are listed for every external dependency.
- Edge cases, assumptions, and open questions are recorded; **blocking questions must be
  zero** to pass.
- Out of scope is written down. An empty "out of scope" is almost always a missing decision.

**Exit G1:** every acceptance criterion has a planned verification method.

**Human decides:** scope trade-offs and any requirement that forces a T3 decision.

**Common failure:** criteria that restate the feature ("the form works") instead of describing
observable behavior ("submitting an invalid email shows a field-level message and creates no
record").

---

## S2 — Design

**Purpose:** make the structure and the cost of future change explicit before code hardens
around an accident.

**Obligations**

- **Boundaries:** which component owns which capability, and what each may depend on.
- **Data:** core entities, invariants, ownership, transaction boundaries, and which
  operations must be atomic versus eventually consistent.
- **Contracts:** interfaces exposed to other components, users, or third parties, plus the
  compatibility rule (additive only? versioned? deprecation window?).
- **Failure:** what happens when each dependency is slow, wrong, or absent. Timeout, retry,
  idempotency, and degradation decisions.
- **Security:** trust boundaries, assets, actors, and the threats that matter for this
  change. Not a generic checklist — the specific ways this design can be abused.
- **Operations:** how it runs, scales, upgrades, and is observed.
- **Migration:** how existing data and clients move from the old behavior to the new one.
- **Decisions:** a decision record for every choice that is expensive to reverse, listing at
  least two real options and a revisit trigger.

**Exit G2:** a competent outsider can locate where a change belongs and predict what it
affects.

**Human decides:** contract changes, authn/authz model, data model at T2+, and every T3 item.

**Common failure:** diagrams with boxes but no ownership, or "we'll decide when we get there"
applied to a decision that is already being encoded in the schema.

**Do not over-design.** The smallest structure that protects the important boundaries wins.
Microservices, event sourcing, caches, and queues are answers to stated requirements, never
defaults. If you cannot name the requirement, you do not have the justification.

---

## S3 — Slice

**Purpose:** convert design into something that can ship, be observed, and be reverted
without a coordinated rescue.

**Obligations**

- The slice is **vertical**: it crosses every layer needed for the behavior to be observable
  by its intended consumer.
- The slice is **ordered by risk**: the assumption most likely to be wrong is tested first.
- **Blast radius** is declared: paths, components, data, contracts, and environments touched.
- A tier is assigned. Protected paths are checked; touching one escalates the tier.
- **Undo** is defined: revert, flag off, forward fix, or restore. "We'll figure it out" is
  not an undo.
- The change fits the review budget. If it does not, split it — by observable behavior, not
  by layer.
- Verification for each acceptance criterion is planned, including the expensive ones that
  are tempting to defer.

**Exit G3:** the plan can be executed and reversed by one person without hidden knowledge.

**Human decides:** sequencing when it changes what users see; any tier downgrade.

**Common failure:** "slices" that are horizontal (all migrations, then all endpoints), or
slices that cannot be demonstrated until a later slice lands.

---

## S4 — Build

**Purpose:** produce the smallest correct, readable change that satisfies the spec.

**Obligations**

- Stay inside the declared blast radius. New scope returns to S1/S3; it is not absorbed.
- Follow the conventions in the stack adapter. Conventions are not design; a well-formatted
  module can still be wrong.
- Tests are written with the behavior they protect, at the cheapest tier that can catch the
  failure.
- New dependencies require justification: what it replaces, its maintenance and security
  posture, and why the platform cannot do it.
- The system stays runnable at every commit. Partial work is hidden behind a flag or not
  merged.
- Commits are small and explain **why**, not what the diff already shows.

**Exit G4:** clean checkout builds; fast checks pass; the diff is limited to the declared
radius.

**Autonomy:** L2 is the default for T1–T2 (see [05-agents](05-agents.md)).

**Common failure:** scope absorption, speculative abstraction, and tests written to match the
implementation instead of the requirement.

---

## S5 — Verify

**Purpose:** replace belief with evidence, including the evidence that the evidence can fail.

**Obligations**

- Every acceptance criterion maps to a result in A5.
- Test tiers are chosen by **risk**, not by count:
  - isolated logic and edge cases;
  - boundary integration with realistic dependencies;
  - contract compatibility across interfaces;
  - a small number of critical user journeys.
- The dangerous cases are exercised: invalid and missing input, authorization failure and
  cross-tenant access, duplicate and concurrent requests, transaction rollback, dependency
  timeout, partial failure, migration compatibility.
- New or changed external boundaries are tested against slow, failing, and malformed
  responses.
- Changed hot paths have performance evidence against a stated target, or an explicit
  declaration that no target applies.
- The test suite is shown to be capable of failing: temporarily break the behavior, or use a
  mutation-style check, and confirm a test catches it.
- Flaky tests are defects. They are fixed, quarantined with an owner, or deleted — never
  ignored.

**Exit G5:** a reviewer can re-run the listed commands and reproduce the results.

**Human decides:** accepting a known residual risk or a waiver, with an expiry.

**Common failure:** coverage as a target, happy-path-only tests, and assertions that cannot
distinguish correct from incorrect behavior.

---

## S6 — Release

**Purpose:** move a verified artifact into an environment without losing the ability to
recover.

**Obligations**

- The shipped artifact is immutable and traceable to a commit and a build.
- Configuration is validated per environment; secrets come from a managed store and never
  from the repository or the artifact.
- Data migrations are ordered safely (expand → migrate → contract) and compatible with the
  previous application version during the rollout window.
- Rollback is defined, and rehearsed when the change is T3. If rollback is impossible, the
  forward-fix path and its time budget are written down instead.
- Risky behavior is behind a flag that is **off by default**, and the flag has an owner and
  a removal date.
- New failure modes have dashboards and alerts before traffic arrives, not after.
- A6 records what shipped, where, when, by which gate evidence, and how to reverse it.

**Exit G6:** deployment and release are separable; a rollback decision can be made in minutes.

**Human decides:** production rollout at T3; any irreversible step.

**Common failure:** treating "deployed" as "released", and discovering during an incident that
the migration cannot be reversed.

---

## S7 — Operate

**Purpose:** make health visible and recovery routine.

**Obligations**

- Logs are structured, correlated, and free of secrets and personal data.
- Metrics cover latency, errors, saturation, and the business outcome the slice was meant to
  move.
- Alerts are actionable: each has an owner, a threshold tied to user impact, and a first
  action. Alerts nobody acts on are noise and get deleted.
- A user-facing capability has a service-level objective and an error budget.
- The runbook covers the new failure modes: symptom → diagnosis → action → escalation.
- Backup and restore are tested at the cadence the data's value requires.

**Exit G7:** someone woken at night can diagnose the new failure modes without the author.

**Common failure:** dashboards without decision thresholds, and runbooks that describe the
architecture instead of the procedure.

---

## S8 — Learn

**Purpose:** close the loop on the bet, and improve the factory itself.

**Obligations**

- The success metric is compared with its baseline at the declared horizon — including when
  the answer is "no effect".
- Rework is analysed: which station did the work return to, and why. Repeated rework at the
  same gate is a factory defect, not an individual one.
- Escaped defects are traced to the gate that should have caught them.
- Decisions that turned out wrong are superseded by a new record, not silently edited.
- Debt created by the slice is recorded with an owner and a trigger.
- If a gate failed to catch something it should have, a gate change is proposed.

**Exit G8:** the next A1 is better informed than the last one, and the factory has at most one
concrete improvement queued.

**Human decides:** whether to continue, pivot, or stop the bet.

**Common failure:** shipping and never measuring; treating a postmortem as a blame document;
accumulating "process improvements" that are never trialled.
