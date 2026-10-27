import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { loadConfig, repoRoot } from "../scripts/ci/lib/config.mjs";
import { createTempDir, write } from "./helpers/git-repo.mjs";

/**
 * Wiring evidence for every gate declared `status: "wired"` in factory.config.json.
 *
 * Port names (`format.check`, `vcs.diff`, …) do not map to filenames mechanically, so this
 * table is the declared mapping: adding or retiring a wired gate is a data edit here, and
 * the set-equality test below fails until both sides agree.
 *
 * FU-4 (slice 0009): `wrapperLibs` pins the `scripts/ci/lib/*.mjs` modules each wrapper
 * actually executes — derived from the wrappers' import statements. A wired gate's
 * evidence used to have an unpinned middle link: a renamed lib crashed the lane
 * accidentally, and a *rewired* wrapper that stopped importing the lib was invisible.
 * Now the links are declared and machine-checked (wrapper source must contain each
 * declared specifier).
 */
const WIRED_GATE_EVIDENCE = {
  G4a: { wrappers: [], rows: ["G4a"], wrapperLibs: {} },
  G4b: {
    wrappers: ["scripts/ci/format.mjs", "scripts/ci/lint.mjs", "scripts/ci/sast.mjs"],
    rows: ["FORMAT", "LINT", "SAST", "G4b"],
    wrapperLibs: {
      "scripts/ci/format.mjs": ["lib/format-lint.mjs"],
      "scripts/ci/lint.mjs": ["lib/format-lint.mjs"],
      "scripts/ci/sast.mjs": ["lib/config.mjs", "lib/sast.mjs"],
    },
  },
  G4c: { wrappers: [], rows: ["G4c"], wrapperLibs: {} },
  G4d: {
    wrappers: ["scripts/ci/secrets.mjs", "scripts/ci/secrets-history.mjs"],
    rows: ["G4d", "HISTORY"],
    wrapperLibs: {
      "scripts/ci/secrets.mjs": ["lib/config.mjs", "lib/secrets.mjs"],
      "scripts/ci/secrets-history.mjs": ["lib/secrets-history.mjs"],
    },
  },
  G4e: { wrappers: [], rows: ["G4e"], wrapperLibs: {} },
  // Note (fresh-context N3, slice 0009): scripts/ci/links.mjs is NOT a G4e
  // wrapper — it implements the docs.link port, which belongs to G0 (manual).
  // G4e's audit logic (deps.inventory / deps.vuln) runs inline in fast.mjs via
  // runNpm, which is why it has no wrapper file of its own; its libs are pinned
  // through LANE_LIBS below.
  G4f: {
    wrappers: ["scripts/ci/blast-radius.mjs"],
    rows: ["G4f"],
    wrapperLibs: {
      "scripts/ci/blast-radius.mjs": ["lib/blast-radius.mjs", "lib/config.mjs"],
    },
  },
  /**
   * Release-lane evidence shape (slice 0007): a gate wired by a workflow is
   * pinned to the workflow file and to step names that must appear in it.
   * Such a gate has no fast-lane row, so the lane-row test skips it.
   * The G6a entry lands in the same commit that flips G6a to "wired" —
   * statuses follow observations (the 0005 lesson): the v0.4.0 run was
   * observed first (run 40574701583), then this row was added.
   */
  G6a: {
    wrappers: [],
    rows: [],
    wrapperLibs: {},
    workflows: [".github/workflows/release.yml"],
    steps: ["Pack", "Checksum", "Attach"],
  },
};

/**
 * The lane itself, pinned like a wrapper (FU-4): every lib module the fast lane
 * executes is declared here, so rewiring the lane's imports is a table edit that
 * the tests verify against the lane's source.
 */
const LANE_LIBS = {
  "scripts/ci/fast.mjs": [
    "lib/blast-radius.mjs",
    "lib/config.mjs",
    "lib/engines.mjs",
    "lib/format-lint.mjs",
    "lib/links.mjs",
    "lib/run.mjs",
    "lib/sast.mjs",
    "lib/secrets.mjs",
    "lib/secrets-history.mjs",
  ],
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

test("a wired gate cannot carry an empty evidence shape", () => {
  const empty = Object.entries(WIRED_GATE_EVIDENCE)
    .filter(
      ([, evidence]) =>
        [...(evidence.wrappers ?? []), ...(evidence.rows ?? []), ...(evidence.workflows ?? [])]
          .length === 0,
    )
    .map(([gateId]) => gateId);
  assert.deepEqual(
    empty,
    [],
    `Wired gates with no declared evidence of any shape: ${empty.join(", ")}`,
  );
});

/**
 * Check workflow evidence against a root directory: every declared workflow
 * exists and contains every declared step as a `name: <step>` line. Used by
 * the real-tree test above and verified against a synthetic fixture below,
 * so the mechanism is proven before the G6a row lands.
 */
function missingWorkflowEvidence(root, entries) {
  const missing = [];
  for (const [gateId, evidence] of Object.entries(entries)) {
    for (const workflow of evidence.workflows ?? []) {
      const workflowPath = path.join(root, workflow);
      if (!existsSync(workflowPath)) {
        missing.push(`${gateId}: ${workflow}`);
        continue;
      }
      const source = readFileSync(workflowPath, "utf8");
      for (const step of evidence.steps ?? []) {
        if (!source.includes(`name: ${step}`)) {
          missing.push(`${gateId}: ${workflow} step "${step}"`);
        }
      }
    }
  }
  return missing;
}

test("the workflow evidence shape passes on a matching fixture and fails on drift", (t) => {
  const root = createTempDir(t);
  write(root, "wf/good.yml", "steps:\n  - name: Pack\n  - name: Checksum\n  - name: Attach\n");
  assert.deepEqual(
    missingWorkflowEvidence(root, {
      G6a: { workflows: ["wf/good.yml"], steps: ["Pack", "Checksum", "Attach"] },
    }),
    [],
    "a matching workflow must produce no findings",
  );

  write(root, "wf/bad.yml", "steps:\n  - name: Upload\n");
  assert.deepEqual(
    missingWorkflowEvidence(root, {
      G6a: { workflows: ["wf/good.yml", "wf/bad.yml"], steps: ["Pack", "Checksum", "Attach"] },
      G7a: { workflows: ["wf/missing.yml"], steps: ["X"] },
    }),
    [
      'G6a: wf/bad.yml step "Pack"',
      'G6a: wf/bad.yml step "Checksum"',
      'G6a: wf/bad.yml step "Attach"',
      "G7a: wf/missing.yml",
    ],
    "drifted or missing workflow evidence must be named",
  );
});

test("every wrapper a wired gate declares exists on disk", () => {
  const missing = [];
  for (const [gateId, evidence] of Object.entries(WIRED_GATE_EVIDENCE)) {
    for (const wrapper of evidence.wrappers ?? []) {
      if (!existsSync(path.join(repoRoot, wrapper))) {
        missing.push(`${gateId}: ${wrapper}`);
      }
    }
  }
  assert.deepEqual(missing, [], `Wired gates with missing wrappers: ${missing.join(", ")}`);
});

test("every workflow a wired gate declares exists and contains the declared steps", () => {
  const missing = missingWorkflowEvidence(repoRoot, WIRED_GATE_EVIDENCE);
  assert.deepEqual(
    missing,
    [],
    `Wired gates with missing workflow evidence: ${missing.join(", ")}`,
  );
});

test("every lane row a wired gate declares appears in the fast lane", () => {
  const fastLaneSource = readFileSync(path.join(repoRoot, "scripts/ci/fast.mjs"), "utf8");
  const missing = [];
  for (const [gateId, evidence] of Object.entries(WIRED_GATE_EVIDENCE)) {
    for (const row of evidence.rows ?? []) {
      if (!fastLaneSource.includes(`record("${row}"`)) {
        missing.push(`${gateId}: lane row "${row}"`);
      }
    }
  }
  assert.deepEqual(missing, [], `Wired gates with missing lane rows: ${missing.join(", ")}`);
});

/**
 * Whether the wrapper source IMPORTS the lib — not merely mentions it.
 * (Fresh-context finding B1, slice 0009: a substring check false-passed a
 * rewired wrapper whose stale comment still named the old specifier.)
 * Conservative comment stripping: drop `//` line comments that are not part
 * of a URL (`://`); the wrappers' specifiers then must appear inside a
 * `from "…"` / `import("…")` clause.
 */
function wrapperImportsLib(source, lib) {
  const withoutComments = source
    .split(/\r?\n/)
    .map((line) => {
      const marker = line.indexOf("//");
      if (marker === -1 || line.slice(0, marker).includes("://")) {
        return line;
      }
      return line.slice(0, marker);
    })
    .join("\n");
  // Check both static `from "<...lib/x.mjs>"` and dynamic `import("<...lib/x.mjs>")`.
  for (const clause of ['from "', 'import("', "import ('"]) {
    let index = withoutComments.indexOf(clause);
    while (index !== -1) {
      const start = index + clause.length;
      const end = withoutComments.indexOf(quoteChar(clause), start);
      if (end !== -1) {
        const specifier = withoutComments.slice(start, end);
        if (specifier === `./${lib}` || specifier.endsWith(`/${lib}`) || specifier === lib) {
          return true;
        }
      }
      index = withoutComments.indexOf(clause, index + 1);
    }
  }
  return false;
}

function quoteChar(clause) {
  return clause.endsWith('"') ? '"' : "'";
}

/**
 * FU-4 (slice 0009): the declared wrapper→lib links, checked against the
 * wrapper sources. Returns findings naming the gate, wrapper, and module.
 */
function missingLibEvidence(root, entries, laneLibs = {}) {
  const declared = Object.entries(entries).flatMap(([gateId, evidence]) =>
    Object.entries(evidence.wrapperLibs ?? {}).map(([wrapper, libs]) => ({
      gateId,
      wrapper,
      libs,
    })),
  );
  declared.push(
    ...Object.entries(laneLibs).map(([wrapper, libs]) => ({ gateId: "lane", wrapper, libs })),
  );

  const findings = [];
  for (const { gateId, wrapper, libs } of declared) {
    const wrapperPath = path.join(root, wrapper);
    if (!existsSync(wrapperPath)) {
      findings.push(`${gateId}: wrapper missing: ${wrapper}`);
      continue;
    }
    const source = readFileSync(wrapperPath, "utf8");
    for (const lib of libs) {
      if (!existsSync(path.join(root, "scripts/ci", lib))) {
        findings.push(`${gateId}: ${wrapper} declares missing lib "${lib}"`);
      } else if (!wrapperImportsLib(source, lib)) {
        findings.push(
          `${gateId}: ${wrapper} no longer imports its declared lib "${lib}" — ` +
            "rewire the evidence table or restore the import",
        );
      }
    }
  }
  return findings;
}

test("every lib module a wired gate declares exists and is imported by its wrapper", () => {
  const findings = missingLibEvidence(repoRoot, WIRED_GATE_EVIDENCE, LANE_LIBS);
  assert.deepEqual(
    findings,
    [],
    `Wired gates with drifted wrapper/lib links: ${findings.join(", ")}`,
  );
});

test("the lib-link check fails when a wrapper stops importing a declared lib (synthetic fixture)", (t) => {
  const root = createTempDir(t);
  write(root, "scripts/ci/lib/engine.mjs", "export const ok = 1;\n");
  write(root, "scripts/ci/wrapped.mjs", 'import { ok } from "./lib/engine.mjs";\nok;\n');
  assert.deepEqual(
    missingLibEvidence(root, {
      G4x: {
        wrappers: ["scripts/ci/wrapped.mjs"],
        rows: [],
        wrapperLibs: { "scripts/ci/wrapped.mjs": ["lib/engine.mjs"] },
      },
    }),
    [],
    "a faithful wrapper/lib pair produces no findings",
  );

  // The FU-4 gap: the wrapper is REWIRED away from the declared lib (which still
  // exists), so existence checks alone cannot catch it — the import check must.
  write(root, "scripts/ci/wrapped.mjs", "export const rewired = true;\n");
  // Fresh-context finding B1 (slice 0009): a stale COMMENT mentioning the old
  // specifier must not false-pass the check — comments are stripped.
  write(
    root,
    "scripts/ci/wrapped.mjs",
    'import { ok2 } from "./lib/other.mjs";\n// migrated away from ./lib/engine.mjs\nok2;\n',
  );
  write(root, "scripts/ci/lib/other.mjs", "export const ok2 = 2;\n");
  assert.deepEqual(
    missingLibEvidence(root, {
      G4x: {
        wrappers: ["scripts/ci/wrapped.mjs"],
        rows: [],
        wrapperLibs: { "scripts/ci/wrapped.mjs": ["lib/engine.mjs"] },
      },
    }),
    [
      'G4x: scripts/ci/wrapped.mjs no longer imports its declared lib "lib/engine.mjs" — rewire the evidence table or restore the import',
    ],
    "a rewired wrapper must be named, even when a comment still mentions the old specifier",
  );
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

/**
 * Fresh-context verification, made checkable (slice 0008, from the first A8's
 * proposed change): the active slice's A5 must carry a `Fresh-context
 * verification:` record. The machine checks existence; the human reviewer
 * checks content ("pending: verifier runs before merge" is honest while the
 * PR is open, not after it merges). Enforcement is forward-looking by
 * construction — only the active slice is checked, so historical slices are
 * never re-run.
 */
const FRESH_CONTEXT_MARKER = "Fresh-context verification:";

function freshContextVerdict(root, sliceDir) {
  const a5Path = path.join(root, sliceDir, "A5-evidence-pack.md");
  if (!existsSync(a5Path)) {
    return { verdict: undefined, a5Path };
  }
  const source = readFileSync(a5Path, "utf8");
  const line = source.split(/\r?\n/).find((candidate) => candidate.includes(FRESH_CONTEXT_MARKER));
  return { verdict: line, a5Path };
}

test("the active slice's A5 records a fresh-context verification field", () => {
  const config = loadConfig(repoRoot);
  const { verdict, a5Path } = freshContextVerdict(repoRoot, config.activeSlice);
  assert.ok(
    verdict !== undefined,
    `${path.relative(repoRoot, a5Path)} must contain a "${FRESH_CONTEXT_MARKER}" record — ` +
      '"pending: verifier runs before merge" is allowed while the PR is open',
  );
  assert.match(
    verdict,
    /pending|verdict|PASS|FAIL|verified by/i,
    `the fresh-context record must state a status, not be empty after the marker:\n  ${verdict}`,
  );
});

test("the pull request template demands a fresh-context verification record", () => {
  const template = readFileSync(path.join(repoRoot, ".github/pull_request_template.md"), "utf8");
  assert.ok(
    template.includes(FRESH_CONTEXT_MARKER),
    "the PR template's Evidence section must contain a mandatory fresh-context field",
  );
  assert.match(
    template,
    /pending/i,
    "the field must allow an honest pending state while the PR is open",
  );
});

test("the fresh-context check fails closed on a missing field (synthetic fixture)", (t) => {
  const root = createTempDir(t);
  write(root, "work/000x-synthetic/A5-evidence-pack.md", "# Evidence pack (A5)\n\nno field here\n");
  const missing = freshContextVerdict(root, "work/000x-synthetic");
  assert.equal(missing.verdict, undefined, "a missing field must be detected");
});
