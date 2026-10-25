# 07 — Adoption

The factory is adopted incrementally. A full model applied on day one becomes ceremony; no
model becomes folklore. Each phase has a concrete deliverable and an exit criterion.

Scope assumption: one human plus AI agents, one product, no existing codebase.

---

## Phase 0 — Skeleton (half a day)

**Goal:** make the model usable and make the first three gates real.

Deliverables

- This documentation set and the templates in `templates/`.
- A declared tier scheme and a list of **protected paths** for the repository.
- Three machine gates wired: clean build, fast tests, secret scan. Add dependency
  vulnerability scanning if a package manager exists.
- A decision record confirming the stack choice and the initial protected paths.

Exit criteria

- A deliberately broken change fails each wired gate with a useful message.
- A correct change passes the fast lane in under the budget.
- The repository has an owner and a stated first bet.

Do **not** wire all gates now. Wire the ones that catch the failures you can already name.

---

## Phase 1 — One real slice (week 1–2)

**Goal:** prove the artifact chain on actual work, and calibrate the templates.

Deliverables

- One T1 slice completed through S0–S8 with every artifact filled.
- A baseline for the scorecard in [06-metrics](06-metrics.md): even "unknown" is a baseline.
- A list of template sections that produced no decisions. Delete them or make them sharper.
- The first A8, written after the outcome horizon — not at merge time.

Exit criteria

- A second person could follow A1 → A2 → A4 → A5 and understand what happened.
- Every acceptance criterion has a reproduced result.
- At least one template section was removed because it was ceremony.

Expect this phase to feel slow. That is the cost of discovering which parts you actually
need.

---

## Phase 2 — Automation and release safety (week 3–6)

**Goal:** move from documented discipline to enforced discipline where it is cheap.

Deliverables

- Contract verification for the change's interfaces.
- Migration compatibility check run against the previous artifact.
- Release record generated from the pipeline, not written by hand.
- A staging environment with the same artifact promotion path as production.
- Structured logs, core metrics, and one actionable alert for the first real capability.
- Rollback rehearsed once, even if the result is "rollback takes 20 minutes and needs a
  manual step".

Exit criteria

- Deployment is repeatable and produces an immutable, traceable artifact.
- Rollback has been performed, not just described.
- The deep lane runs without blocking the fast lane.

---

## Phase 3 — Delegation (week 6–10)

**Goal:** let agents carry more work without lowering the evidence bar.

Deliverables

- A context pack template filled per slice, versioned in the repository.
- The Verifier role separated: verification runs in a fresh context with an adversarial brief.
- Autonomy raised to L2 for T1–T2 slices, with the tier ceiling enforced.
- The output contract used for every handoff; no handoff accepted as prose only.
- A weekly WIP review that actually cancels or splits stuck work.

Exit criteria

- Three consecutive T1 slices pass G4–G6 without human intervention before review.
- The reviewer finds no more than one scope violation across those slices.
- No gate was waived to make this happen.

If the last criterion fails, autonomy goes back down. The point of delegation is throughput
at constant quality, not throughput at any cost.

---

## Phase 4 — Calibration (ongoing)

**Goal:** make the factory cheaper and sharper using its own data.

Deliverables

- One factory change per month, justified by a scorecard signal or an escaped defect.
- Retired gates and adapter exceptions that produced no signal.
- Protected paths reviewed for drift.
- The adoption phase re-run for any new stack or new product surface.

Exit criteria

- Waiver count is stable or falling.
- Gate runtime is stable or falling.
- Escaped defects are attributed, not just counted.

---

## Adding a new stack

1. Write the adapter from `adapters/stack/_template.md` (see
   [04-stack-binding](04-stack-binding.md)).
2. Run the smoke test: every blocking gate must be observed failing, then passing.
3. Record the binding in an ADR.
4. Start at Phase 1 for the first slice in that stack. Do not import autonomy assumptions
   from a mature stack.

## Changing the factory

The factory changes the same way good software does:

1. **Evidence** — an escaped defect, a gate that never fires, a station with no decisions, a
   waiver that keeps renewing.
2. **Proposal** — a decision record: the problem, two options, the expected effect on the
   scorecard, and the cost.
3. **Trial** — run the change on one slice, in advisory mode if it is a gate.
4. **Decision** — adopt, adjust, or revert. Record it.
5. **Retirement** — remove the thing it replaced. Two mechanisms for one obligation is how
   process debt accumulates.

## Signs the factory has become theater

- Documents are filled after the change, to satisfy a checklist.
- Every gate is green, and defects still escape.
- Templates grow but decisions do not.
- Reviews approve prose, not evidence.
- Autonomy increases while gate coverage decreases.
- Waivers are permanent.
- The scorecard is reported but never changes a decision.

Any one of these is a signal to shrink the factory, not expand it. The model earns its cost
by catching real failures — nothing else justifies a step.
