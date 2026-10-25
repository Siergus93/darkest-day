# 05 — Agents

Agents are **station workers**, not process owners. They execute work with high throughput
inside boundaries the factory defines. The human owns the boundaries, the irreversible
decisions, and the acceptance of risk.

This model is deliberately vendor-neutral: it describes what an agent must be given, what it
may do, and what it must produce. It does not assume a particular assistant, editor, or
orchestration tool.

---

## 1. Autonomy levels

| Level | Agent may | Human must | Default for |
| --- | --- | --- | --- |
| L0 Propose | Draft artifacts, analyse, suggest. No writes. | Everything | Ambiguous problems, unfamiliar code, T3 discovery |
| L1 Assisted | Write on a throwaway branch. | Review every diff before merge | T3, first slice in a new area |
| L2 Supervised | Implement an approved slice plan within declared bounds; gates must pass | Review the merged diff and A5 | T1–T2 |
| L3 Delegated | Own the slice through non-production release and runbook | Approve production rollout and any gate waiver | Mature T1, repetitive T2 |
| L4 Autonomous | Operate within budget and SLO; human notified after the fact | Nothing in the loop | T0 only, or a proven narrow class of work |

**Tier ceiling:** T0 → L4, T1 → L3, T2 → L2, T3 → L1. A tier may not be lowered to unlock a
higher autonomy level.

**Separation rule:** the agent that built a change must not be the only approver of its own
verification. At T2+, run the verifier in a fresh context, and preferably with a different
model or a strongly adversarial instruction. Self-review is a spell-check, not a review.

## 2. Roles

Roles are responsibility bundles, not personalities. One agent may hold several roles across
a slice, but not simultaneously at the same gate.

| Role | Station | Responsibility | Must produce |
| --- | --- | --- | --- |
| Planner | S0–S3 | Frame, specify, design options, slice | A1, A2, A3 candidates, A4 |
| Builder | S4 | Implement inside bounds, with tests | Change set, test additions |
| Verifier | S5 | Try to falsify the spec; run gates independently | A5, failures and gaps |
| Releaser | S6–S7 | Package, migrate, flag, observe, document recovery | A6, A7 |
| Reviewer | any | Attack the diff: scope, contracts, security, tests | Review record in A5 |
| Operator | S7–S8 | Triage signals, analyse rework, propose factory change | A8, gate proposals |

The **Verifier** is the most valuable role to separate. Builders optimise for completion;
verifiers must be rewarded for finding a real defect, including "the spec is untestable".

## 3. The context pack

An agent is only as good as its inputs. Every task starts with a **context pack** — a small,
explicit, versioned set of references. If something is missing, the agent asks; it does not
invent.

Required contents:

1. **Problem and outcome** — A1, including the success metric and non-goals.
2. **Spec** — A2, with acceptance criteria numbered and verification methods.
3. **Decisions** — only the A3 records that constrain this slice, plus the reason they exist.
4. **Boundaries** — components owned, contracts exposed, protected paths, and what must not
   change.
5. **Blast radius** — the declared paths, data, and environments in A4.
6. **Conventions** — the stack adapter and repository conventions, with commands.
7. **Environment** — how to build, run, and test locally; known broken states.
8. **Definition of Done** — universal layer plus stack delta.
9. **Autonomy and tier** — what the agent may decide alone, and what requires a stop.
10. **Output contract** — exactly which artifacts to produce, in which format.

Context is not a chat log. If it matters, it lives in the repository and is linked from the
task.

## 4. Output contract

Every agent handoff ends with a structured record. Prose summaries are not a handoff.

```text
Slice:            <id and title>
Tier:             <tier, and whether it changed>
Artifacts:        <links to A2/A4/A5 updates>
Commands run:     <command → exit code → summary>   (verbatim, not remembered)
Criteria:         <AC id → result → evidence location>
Assumptions:      <what was assumed, and why>
Deviations:       <anything outside the approved plan, with justification>
Residual risk:    <known gaps, unrun checks, waivers requested>
Questions:        <blocking questions, or "none">
Next action:      <the single next gate or decision>
```

Rules for the record:

- **No evidence, no completion.** "Should work" is a failed handoff.
- **Commands are reported verbatim** with exit codes. If a command was not run, say so.
- **Deviations are declared before they happen**, not reconstructed afterwards.
- **Uncertainty is stated once, clearly.** Hedging across a whole report hides the one thing
  a reviewer needed to see.

## 5. Stop conditions

The agent must stop and ask a human when any of the following becomes true:

- An acceptance criterion is ambiguous, contradictory, or untestable.
- The change needs a new dependency, a new service, or a new external integration.
- A protected path must change, or the blast radius must grow.
- The solution requires an authn/authz, data retention, money-movement, or PII decision.
- A blocking gate fails twice for the same reason.
- The only way to pass a gate is to weaken the gate, skip a test, or widen a waiver.
- The spec and the existing behavior disagree, and the spec is not clearly authoritative.
- The work would take materially longer than the slice budget, for a reason not in A4.

Stopping is a success signal. An agent that proceeds through ambiguity produces confident,
expensive rework.

## 6. Review protocol

The reviewer — human or separate agent — checks, in this order:

1. **Scope:** does the diff match A4? Anything unrelated or unrequested?
2. **Behavior:** does each acceptance criterion have evidence, and would a wrong
   implementation fail that evidence?
3. **Contracts:** any interface, schema, event, or error-shape change? Is it compatible and
   recorded?
4. **Data:** migration order, reversibility, transaction boundaries, concurrent updates,
   duplicate requests, retention.
5. **Security:** authorization on the server, input validation, output encoding, secrets,
   tenancy, logging of sensitive fields.
6. **Failure:** timeouts, retries, idempotency, partial failure, dependency absence.
7. **Dependencies:** new packages justified, maintained, and scanned.
8. **Design:** does the change respect boundaries, or quietly couple two owners? Any
   abstraction that exists only for this one change?
9. **Tests:** would the suite fail if the behavior broke? Are edge cases real edge cases?
10. **Operability:** can this be diagnosed and reversed at 3 a.m.?

The reviewer records **findings**, not approval prose. A finding is: location, risk, and the
condition under which it matters.

## 7. Failure modes and counters

| Failure mode | Symptom | Counter |
| --- | --- | --- |
| Phantom verification | "Tests pass" with no command output | Output contract requires verbatim commands and exit codes; verifier re-runs |
| Scope creep | Diff touches files outside A4 | G4f blocks; deviations must be declared first |
| Spec drift | Code satisfies an imagined requirement | AC IDs appear in test names and in A5 |
| Test gaming | Assertions tautological; tests delete behavior checks | G5g break test; reviewer checks assertion quality |
| Over-abstraction | Indirection for one call site | Review question: what second use case justifies this? |
| Dependency bloat | A package for a ten-line function | G4e justification + maintenance/security check |
| Sycophancy | Agent agrees the plan is excellent, then implements it literally | Force options and counter-arguments at S2/L0 |
| Premature completion | Stops at compileable, not verified | Definition of Done is part of the context pack |
| Context rot | Agent reasons from a stale spec | Spec version is cited in the handoff; stale context is a blocker |
| Blast radius creep | "While I was there" changes | Protected paths + declared radius, checked mechanically |

## 8. Prompt contract (generic)

Use this shape for any station, with any assistant:

```text
Role:        <station role and autonomy level>
Goal:        <one sentence: the observable outcome of this task>
Inputs:      <links to context pack items, with versions>
Constraints: <blast radius, protected paths, non-goals, tier>
Method:      <any required artifact format; do not prescribe how to think>
Done when:   <the gate criteria for this station, verbatim>
Stop when:   <the stop conditions above, plus task-specific ones>
Output:      <the output contract, plus artifact links>
```

Keep the method section minimal. Prescribing a method is fine when it is a team convention;
requiring one in the factory is not.
