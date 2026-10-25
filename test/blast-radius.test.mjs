import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSlicePlan } from "../scripts/ci/lib/blast-radius.mjs";

const PLAN = `# Slice plan (A4)

| Field | Value |
| --- | --- |
| Tier | T2 |
| Tier downgrade reason | n/a |

## Blast radius

| Surface | Touched | Notes |
| --- | --- | --- |
| Paths / modules | \`src/**\`, \`test/**\` | |
| Protected paths | yes | |

## Undo
`;

test("a slice plan exposes its tier, globs, and downgrade reason", () => {
  assert.deepEqual(parseSlicePlan(PLAN), {
    tier: "T2",
    downgradeReason: undefined,
    declaredGlobs: ["src/**", "test/**"],
  });
});

test("a written downgrade reason is preserved", () => {
  const plan = PLAN.replace("| Tier downgrade reason | n/a |", "| Tier downgrade reason | docs only |");
  assert.equal(parseSlicePlan(plan).downgradeReason, "docs only");
});

test("a plan without a tier is rejected", () => {
  assert.throws(() => parseSlicePlan("# no tier here"), /must declare a tier/);
});

test("a plan without backticked globs is rejected", () => {
  const plan = PLAN.replace("`src/**`, `test/**`", "src and tests");
  assert.throws(() => parseSlicePlan(plan), /backticked path glob/);
});
