import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyDeclaredTier,
  matchesGlob,
  maxTier,
  resolveTier,
  TierDowngradeError,
  tierRank,
} from "../dist/tiers.js";

const protections = [
  { pattern: "scripts/ci/**", escalateTo: "T2", owner: "owner" },
  { pattern: "factory.config.json", escalateTo: "T2", owner: "owner" },
  { pattern: "infra/secrets/**", escalateTo: "T3", owner: "owner" },
];

test("glob matches any depth under a directory", () => {
  assert.equal(matchesGlob("scripts/ci/fast.mjs", "scripts/ci/**"), true);
  assert.equal(matchesGlob("scripts/ci/lib/deep/file.mjs", "scripts/ci/**"), true);
  assert.equal(matchesGlob("scripts/other/file.mjs", "scripts/ci/**"), false);
});

test("glob matches markdown at any depth including the root", () => {
  assert.equal(matchesGlob("README.md", "**/*.md"), true);
  assert.equal(matchesGlob("docs/a/b.md", "**/*.md"), true);
  assert.equal(matchesGlob("docs/a/b.txt", "**/*.md"), false);
});

test("single star does not cross a path segment", () => {
  assert.equal(matchesGlob("src/a.ts", "src/*.ts"), true);
  assert.equal(matchesGlob("src/a/b.ts", "src/*.ts"), false);
});

test("question mark matches one character inside a segment", () => {
  assert.equal(matchesGlob("work/0001/a.md", "work/000?/a.md"), true);
  assert.equal(matchesGlob("work/00012/a.md", "work/000?/a.md"), false);
});

test("Windows separators are normalised", () => {
  assert.equal(matchesGlob("scripts\\ci\\fast.mjs", "scripts/ci/**"), true);
});

test("tier ranking is ordered and maxTier is monotonic", () => {
  assert.equal(tierRank("T2"), 2);
  assert.equal(maxTier("T1", "T3"), "T3");
  assert.equal(maxTier("T2", "T2"), "T2");
  assert.equal(maxTier("T3", "T1"), "T3");
});

test("a slice with no protected paths keeps its declared tier", () => {
  const resolution = resolveTier("T1", ["docs/readme.md"], protections);
  assert.equal(resolution.required, "T1");
  assert.deepEqual(resolution.escalations, []);
});

test("touching a protected path escalates to the declared protection tier", () => {
  const resolution = resolveTier("T1", ["scripts/ci/fast.mjs"], protections);
  assert.equal(resolution.required, "T2");
  assert.deepEqual(resolution.escalations, [
    { path: "scripts/ci/fast.mjs", pattern: "scripts/ci/**", escalateTo: "T2" },
  ]);
});

test("the highest escalation wins across several protected paths", () => {
  const resolution = resolveTier(
    "T1",
    ["scripts/ci/fast.mjs", "infra/secrets/prod.env"],
    protections,
  );
  assert.equal(resolution.required, "T3");
  assert.equal(resolution.escalations.length, 2);
});

test("declared tier equal to required is accepted", () => {
  assert.equal(applyDeclaredTier("T2", "T2", undefined), "T2");
});

test("declared tier above required is accepted", () => {
  assert.equal(applyDeclaredTier("T1", "T2", undefined), "T2");
});

test("a downgrade without a written reason is rejected", () => {
  assert.throws(() => applyDeclaredTier("T2", "T1", undefined), TierDowngradeError);
  assert.throws(() => applyDeclaredTier("T2", "T1", "   "), TierDowngradeError);
});

test("a downgrade with a written reason is recorded, not silently allowed", () => {
  assert.equal(applyDeclaredTier("T2", "T1", "tooling-only slice; no runtime surface"), "T1");
});
