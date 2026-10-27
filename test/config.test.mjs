import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { loadConfig, repoRoot } from "../scripts/ci/lib/config.mjs";

test("the repository manifest is valid", () => {
  const config = loadConfig(repoRoot);
  assert.equal(config.schemaVersion, 1);
  assert.equal(config.owner.length > 0, true);
  assert.deepEqual(Object.keys(config.tiers), ["T0", "T1", "T2", "T3"]);
  assert.equal(config.protectedPaths.length > 0, true);
});

test("a manifest without an owner is rejected", () => {
  const root = mkdtempSync(path.join(tmpdir(), "factory-config-"));
  try {
    writeFileSync(
      path.join(root, "factory.config.json"),
      JSON.stringify({
        schemaVersion: 1,
        activeSlice: "work/0001",
        tiers: { T0: {}, T1: {}, T2: {}, T3: {} },
        protectedPaths: [{ pattern: "x", escalateTo: "T2", owner: "o" }],
        gates: [{ id: "G0", tier: "T1", status: "manual" }],
        lanes: { fast: {}, deep: {}, release: {} },
      }),
      "utf8",
    );

    assert.throws(() => loadConfig(root), /owner must name an accountable person/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
