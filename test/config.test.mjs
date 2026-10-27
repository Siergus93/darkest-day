import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { loadConfig, repoRoot } from "../scripts/ci/lib/config.mjs";

/**
 * Wiring evidence for every gate declared `status: "wired"` in factory.config.json.
 *
 * Port names (`format.check`, `vcs.diff`, …) do not map to filenames mechanically, so this
 * table is the declared mapping: adding or retiring a wired gate is a data edit here, and
 * the set-equality test below fails until both sides agree.
 */
const WIRED_GATE_EVIDENCE = {
  G4a: { wrappers: [], rows: ["G4a"] },
  G4b: {
    wrappers: ["scripts/ci/format.mjs", "scripts/ci/lint.mjs", "scripts/ci/sast.mjs"],
    rows: ["FORMAT", "LINT", "SAST", "G4b"],
  },
  G4c: { wrappers: [], rows: ["G4c"] },
  G4d: {
    wrappers: ["scripts/ci/secrets.mjs", "scripts/ci/secrets-history.mjs"],
    rows: ["G4d", "HISTORY"],
  },
  G4e: { wrappers: [], rows: ["G4e"] },
  G4f: { wrappers: ["scripts/ci/blast-radius.mjs"], rows: ["G4f"] },
};

const KNOWN_STATUSES = new Set(["manual", "wired", "partial", "n/a"]);

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

test("gate statuses are drawn from the known vocabulary", () => {
  const config = loadConfig(repoRoot);
  const offenders = config.gates
    .filter((gate) => !KNOWN_STATUSES.has(gate.status))
    .map((gate) => `${gate.id}: "${gate.status}"`);
  assert.deepEqual(
    offenders,
    [],
    `Unknown gate status values (known: ${[...KNOWN_STATUSES].join(", ")}): ${offenders.join(", ")}`,
  );
});

test("gates declared wired are exactly the gates with declared wiring evidence", () => {
  const config = loadConfig(repoRoot);
  const wiredIds = config.gates.filter((gate) => gate.status === "wired").map((gate) => gate.id);
  const declaredIds = Object.keys(WIRED_GATE_EVIDENCE);

  const withoutEvidence = wiredIds.filter((id) => !declaredIds.includes(id));
  const staleEvidence = declaredIds.filter((id) => !wiredIds.includes(id));

  assert.deepEqual(
    withoutEvidence,
    [],
    `Gates declared "wired" without wiring evidence in this table: ${withoutEvidence.join(", ")}`,
  );
  assert.deepEqual(
    staleEvidence,
    [],
    `Wiring evidence for gates that are not declared "wired" (stale table entries): ${staleEvidence.join(", ")}`,
  );
});

test("every wrapper a wired gate declares exists on disk", () => {
  const missing = [];
  for (const [gateId, evidence] of Object.entries(WIRED_GATE_EVIDENCE)) {
    for (const wrapper of evidence.wrappers) {
      if (!existsSync(path.join(repoRoot, wrapper))) {
        missing.push(`${gateId}: ${wrapper}`);
      }
    }
  }
  assert.deepEqual(missing, [], `Wired gates with missing wrappers: ${missing.join(", ")}`);
});

test("every lane row a wired gate declares appears in the fast lane", () => {
  const fastLaneSource = readFileSync(path.join(repoRoot, "scripts/ci/fast.mjs"), "utf8");
  const missing = [];
  for (const [gateId, evidence] of Object.entries(WIRED_GATE_EVIDENCE)) {
    for (const row of evidence.rows) {
      if (!fastLaneSource.includes(`record("${row}"`)) {
        missing.push(`${gateId}: lane row "${row}"`);
      }
    }
  }
  assert.deepEqual(missing, [], `Wired gates with missing lane rows: ${missing.join(", ")}`);
});

test("factoryVersion matches the newest released CHANGELOG section and package.json", () => {
  const config = loadConfig(repoRoot);
  const changelog = readFileSync(path.join(repoRoot, "CHANGELOG.md"), "utf8");
  const newestReleased = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1];
  assert.ok(newestReleased, "CHANGELOG.md has no released version section (## [x.y.z])");
  const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  assert.equal(
    packageJson.version,
    newestReleased,
    `package.json version (${packageJson.version}) must match the newest released CHANGELOG section (${newestReleased})`,
  );
  assert.equal(
    config.factoryVersion,
    newestReleased,
    `factory.config.json factoryVersion (${config.factoryVersion}) must match the newest released CHANGELOG section (${newestReleased})`,
  );
});

test("activeSlice names an existing slice directory with an A4 plan", () => {
  const config = loadConfig(repoRoot);
  const planPath = path.join(repoRoot, config.activeSlice, "A4-slice-plan.md");
  assert.equal(
    existsSync(planPath),
    true,
    `activeSlice (${config.activeSlice}) must point at a slice directory containing A4-slice-plan.md`,
  );
});
