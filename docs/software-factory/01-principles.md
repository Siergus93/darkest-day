# 01 — Principles

These are invariants. Stations, gates, and adapters may change; these change only through a
decision record that explains what failed.

---

## P1. Optimize for lifetime cost of change

The product will be changed far more often than it is written. Prefer the design that makes
the next change cheap and the risky change visible over the one that ships fastest today.

**Forbids:** "we'll clean it up later" without a recorded owner and trigger; abstractions
added for a single speculative use.

## P2. Specify obligations, not methodologies

The factory says *what must be true*, never *how you must think*. TDD, BDD, DDD, formal
methods, pair review, or a careful manual pass are all valid if the evidence exists.

**Forbids:** gates that require a particular ceremony ("must have a user story", "must be
test-first") rather than an observable result.

## P3. Evidence over claims

A gate passes on an artifact a third party can re-check: a command with its output, a report,
a recording, a signed observation. Prose that says "tested" is not evidence.

**Forbids:** "all tests pass" without the command and exit status; agent summaries as proof.

## P4. Gates are behavior-based, never tool-based

A gate describes a risk and the evidence that retires it. Which tool produces the evidence
is an adapter concern. This is what makes the factory portable across stacks.

**Forbids:** gate definitions containing product names, file extensions, or language idioms.

## P5. Small, reversible, observable increments

One slice produces one observable behavior, crosses every layer needed to observe it, and
can be undone without touching unrelated work. Work in progress is capped; unfinished
slices are a cost, not an asset.

**Forbids:** horizontal phases ("all the database, then all the API"); branches older than
the review budget; changes whose only demonstration is a slide.

## P6. Context is a versioned artifact

An agent — or a new human — can only be as correct as the context they are given. Problem,
spec, decisions, conventions, commands, and boundaries are inputs with versions, not
tribal knowledge.

**Forbids:** relying on chat history as the source of truth; undocumented commands that
"everyone knows".

## P7. One owner per piece of state and per decision

Every entity, every invariant, and every irreversible choice has exactly one accountable
owner. Shared ownership of state is how consistency bugs are born.

**Forbids:** two modules writing the same data; "the team owns it" with no named person.

## P8. Security, reliability, and performance are design inputs

They are constraints on the design, not a phase after it. Retrofitting them costs an order
of magnitude more and usually fails.

**Forbids:** threat models written after release; timeouts and retries added during an
incident; performance work without a measured target.

## P9. Automate the check, keep judgment human

Machines are good at repeating a check and bad at deciding what matters. Automate everything
deterministic; reserve human attention for trade-offs, irreversible choices, and ambiguity.

**Forbids:** human review used to catch formatting; automated gates used to approve a data
migration.

## P10. Ceremony is proportional to blast radius

The process must cost less than the risk it removes. A typo fix and an authentication change
must not take the same path. Tiers exist to make this explicit rather than cultural.

**Forbids:** a single heavyweight process for all changes; skipping gates without recording
the acceptance of risk.

## P11. The factory is a product

It has users (you), a version, a changelog, and failure modes. It is changed by evidence —
an escaped defect, a gate that never fires, a station that produces no decisions — not by
enthusiasm for a new framework.

**Forbids:** adding tools or steps because they are fashionable; permanent exceptions.

---

## The independence test

Apply this to every sentence in the factory docs:

1. Would it still be true if the implementation language changed? If no → adapter.
2. Would it still be true if the architecture style changed? If no → design guidance, not
   a factory obligation.
3. Would it still be true if the team size doubled? If no → it is a local convention, label
   it as such.
4. Can the obligation be demonstrated by evidence someone else can re-check? If no → it is
   advice, move it out of the gate catalog.

## Definition of Done, in two layers

There is no single DoD, because stacks differ. There is a universal layer and a stack delta.

**Universal DoD — every T1+ slice:**

- The observable behavior in A2 is demonstrated by evidence in A5.
- The declared acceptance criteria each map to a verification result.
- Failure paths and authorization are exercised, not assumed.
- No new secret, no unexplained dependency, no unrelated change in the diff.
- The change can be undone using the procedure in A4.
- The relevant decisions are recorded in A3 and the docs are consistent with the code.

**Stack delta — maintained in the adapter:**

- The concrete commands that produce the evidence above for this stack.
- The conventions the stack imposes (formatting, typing, migration tooling, packaging).
- The known traps of this stack that the gates must look for.

An adapter may add checks. It may never remove a universal obligation. If it cannot satisfy
one, it must declare a manual fallback with an owner and an expiry date.
