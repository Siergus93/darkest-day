# 06 — Metrics

The factory is judged by the **lifetime cost of change** and the **outcomes it produces**, not
by output volume. A small scorecard reviewed regularly beats a dashboard nobody reads.

Rule: every metric has a definition, a data source, and a decision it informs. If a metric
does not change a decision, it is deleted.

---

## 1. The scorecard

Eight numbers, one page. Start with baselines; targets are earned, not decreed.

| # | Metric | Definition | Direction | Starting target (calibrate) |
| --- | --- | --- | --- | --- |
| 1 | Lead time | First commit of a slice → released to users | Lower | T1 ≤ 3 days |
| 2 | Cycle time by station | Time between entering and passing each gate | Lower | Identify the worst station, not a global number |
| 3 | Work in progress | Slices started but not released | Lower | 1–2 for a solo factory |
| 4 | Rework rate | Slices that re-enter an earlier station ÷ slices completed | Lower | < 25% |
| 5 | Change failure rate | Releases requiring rollback, hotfix, or patch within 7 days ÷ releases | Lower | < 15% |
| 6 | Escaped defects | Defects found after release that a gate should have caught | Lower | Trend to zero per gate |
| 7 | Time to restore | Detection → service restored | Lower | Define per capability's SLO |
| 8 | Gate coverage | Blocking gates actually wired and observed failing ÷ gates required for the tier | Higher | 100% before autonomy increases |

Optional, only when they answer a live question: deployment frequency, flaky-test rate, gate
runtime, dependency age, waiver count, escaped-risk count.

## 2. What each metric is for

- **Lead time** tells you whether the factory is fast enough to learn. If it is long, look at
  the worst station, not at the people.
- **Cycle time by station** localises the bottleneck. A slow S5 usually means untestable
  specs; a slow S2 usually means unresolved design ambiguity.
- **WIP** is the leading indicator of everything else. More parallel slices means more
  context switching, later integration, and worse reviews.
- **Rework rate** is the honest measure of spec and design quality. Rework at the same gate
  repeatedly is a factory defect.
- **Change failure rate** measures whether the verification and release gates are real.
- **Escaped defects** are the only legitimate input to adding a gate. Attribute each one to
  the gate that should have caught it.
- **Time to restore** measures operability, not heroism.
- **Gate coverage** is the precondition for delegating more autonomy to agents. Autonomy
  without gates is just optimism.

## 3. Cadence

| Cadence | Duration | Questions |
| --- | --- | --- |
| Per slice | During A8 | Did the outcome happen? Which station did rework come from? |
| Weekly | 10 minutes | What is the WIP? What is stuck, and at which gate? Which waiver expires? |
| Monthly | 30 minutes | Scorecard trend. Which gate never fires? Which gate keeps firing? Which adapter exception is oldest? |
| Per escaped defect | 15 minutes | Which gate should have caught it, and what changes? |

The monthly review produces **at most one** factory change. More than one change at a time and
you cannot tell which helped.

## 4. Anti-gaming

Metrics degrade the moment they become targets. These rules are part of the model:

- **Coverage is diagnostic, never a target.** High coverage with weak assertions is worse
  than moderate coverage with real ones.
- **Line count and test count are not measures of anything.** They are reported only when
  explaining a trend.
- **Speed is measured end to end.** Rewarding code volume or agent throughput produces
  unverified work, which moves cost downstream where it is harder to see.
- **Never rank agents or people on defect counts.** That produces hidden defects, not fewer.
- **A gate that is always green is suspected, not trusted.** The smoke test in
  [04-stack-binding](04-stack-binding.md) exists to prove gates can fail.
- **Waivers are counted.** A rising waiver count means the gate is mispriced or the schedule
  is fiction.
- **Measure outcomes against the baseline declared in A1.** A metric chosen after the result
  is known is a story, not a measurement.

## 5. Factory health checks

Run these in the monthly review. Each has a yes/no answer and a named owner.

- [ ] Every blocking gate for the current tier has been observed failing at least once.
- [ ] The fast lane finishes inside its budget.
- [ ] Every waiver has a future expiry and a compensating control.
- [ ] Every adapter exception is younger than its expiry.
- [ ] The last three slices have an A8, even if the answer was "no effect".
- [ ] No slice has been in progress longer than twice the lead-time target.
- [ ] Every protected path has an owner.
- [ ] The runbook for the most critical capability was read by someone who did not write it.

Three consecutive "no" answers on the same check is a factory incident: treat it like a
production failure and change the factory, not the reporting.
