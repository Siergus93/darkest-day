/**
 * Factory CLI — the factory's first product surface (slice 0006).
 *
 * Two commands:
 *   factory status              — dump of the manifest: version, active slice, gate catalog.
 *                                 Read-only; always exits 0.
 *   factory check [--base REF]  — change-set verdict with the same semantics as the
 *                                 lane's G4f row; exit 1 on a protected-path escalation
 *                                 (without a written downgrade reason) or an
 *                                 outside-radius path.
 *
 * Shared engines (verdict parity by construction — the CLI calls the SAME functions
 * the fast lane uses; no logic is re-declared here):
 *   loadConfig       — scripts/ci/lib/config.mjs      (used by scripts/ci/fast.mjs)
 *   normalizeBase,
 *   changeSetNote,
 *   gitChangedPaths,
 *   checkBlastRadius,
 *   formatBlastRadius
 *                    — scripts/ci/lib/blast-radius.mjs (used by scripts/ci/fast.mjs
 *                      and scripts/ci/blast-radius.mjs)
 *
 * Import mechanics: tsc does not rewrite relative import specifiers, so the
 * specifiers below are written relative to the COMPILED location (dist/cli.js).
 * TypeScript cannot resolve .mjs engines outside rootDir — each such import is
 * annotated `@ts-expect-error` and the symbols are re-wrapped in explicitly typed
 * local functions; nothing else about them is re-declared.
 *
 * Constraints honoured: stdlib only, no new dependency; no child_process use in
 * this file at all (git is invoked inside the shared engines, argument-array only).
 */

// @ts-expect-error — untyped .mjs engine outside rootDir, shared with the lane.
// tsc does not rewrite relative import specifiers, so the path is written from
// the COMPILED location (dist/cli.js): `../scripts` resolves to the repo root.
// A namespace import stays on one line — a wrapped multi-line import breaks the
// directive's TS7016 suppression, and Biome's import organizer re-merges
// separate single-line imports from the same module (slice-0006 probe).
import * as blastRadius from "../scripts/ci/lib/blast-radius.mjs";
// @ts-expect-error — untyped .mjs engine outside rootDir, shared with the lane
// (see the mechanics note on the import above).
import { loadConfig } from "../scripts/ci/lib/config.mjs";

interface FactoryConfig {
  factoryVersion: string;
  owner: string;
  activeSlice: string;
  gates: ReadonlyArray<{ id: string; tier: string; status: string }>;
}

interface BlastRadiusResult {
  slice: string;
  declaredTier: string;
  requiredTier: string;
  downgradeReason: string | undefined;
  escalations: ReadonlyArray<{ path: string; pattern: string; escalateTo: string }>;
  changedPaths: readonly string[];
  outsideRadius: readonly string[];
  problems: readonly string[];
}

/** Typed wrapper around the shared `loadConfig` engine. */
function loadFactoryConfig(root: string): FactoryConfig {
  return loadConfig(root) as FactoryConfig;
}

const USAGE = [
  "factory — the Darkest Day factory CLI",
  "",
  "Usage:",
  "  node dist/cli.js status                Print the factory version, active slice,",
  "                                         and the gate catalog. Always exits 0.",
  "  node dist/cli.js check [--base <ref>]  Print the change set and the blast-radius",
  "                                         verdict for the active slice. Exit 0 on",
  "                                         PASS, exit 1 with the problems listed.",
  "                                         Without --base only the working tree is",
  "                                         checked.",
  "  node dist/cli.js --help                This text.",
].join("\n");

function runStatus(): number {
  const config = loadFactoryConfig(process.cwd());
  console.log(`factory ${config.factoryVersion}`);
  console.log(`active slice: ${config.activeSlice}`);
  console.log("gates:");
  for (const gate of config.gates) {
    console.log(`${gate.id}\t${gate.tier}\t${gate.status}`);
  }
  return 0;
}

async function runCheck(baseRef: string | undefined): Promise<number> {
  // The CLI checks the repository it is run from (product semantics); the
  // shared engines default to the factory's own checkout otherwise.
  const root = process.cwd();
  const config = loadFactoryConfig(root);
  const usableBase = blastRadius.normalizeBase(baseRef);
  const changedPaths = blastRadius.gitChangedPaths(root, usableBase);

  if (changedPaths.length === 0) {
    console.error(
      "factory check: FAIL\n" + "No changed paths were found. An empty change set must not pass.",
    );
    return 1;
  }

  console.log("change set:");
  for (const change of changedPaths) {
    console.log(`  ${change}`);
  }

  let result: BlastRadiusResult;
  try {
    result = (await blastRadius.checkBlastRadius({
      root,
      slice: config.activeSlice,
      changedPaths,
    })) as BlastRadiusResult;
  } catch (error) {
    console.error(`factory check: FAIL\n${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  console.log(blastRadius.formatBlastRadius(result));

  const clean = result.problems.length === 0 && result.outsideRadius.length === 0;
  if (clean) {
    const note = blastRadius.changeSetNote({ baseRef: usableBase });
    console.log(`factory check: PASS, ${result.requiredTier}${note ?? ""}`);
    return 0;
  }

  console.log("factory check: FAIL");
  for (const problem of result.problems) {
    console.log(`  tier: ${problem}`);
  }
  for (const change of result.outsideRadius) {
    console.log(`  outside declared radius: ${change}`);
  }
  return 1;
}

function failUsage(badArgument: string): number {
  console.error(`factory: unknown or malformed argument "${badArgument}"\n\n${USAGE}`);
  return 1;
}

async function main(argv: readonly string[]): Promise<number> {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return 0;
  }

  const [command, ...rest] = argv;
  switch (command) {
    case "status":
      if (rest.length > 0) {
        return failUsage(rest[0] ?? "");
      }
      return runStatus();
    case "check": {
      let base: string | undefined;
      for (let index = 0; index < rest.length; index += 1) {
        const argument = rest[index];
        if (argument === "--base") {
          const value = rest[index + 1];
          if (value === undefined || value.startsWith("-")) {
            return failUsage("--base (missing or malformed value)");
          }
          base = value;
          index += 1;
        } else {
          return failUsage(argument ?? "");
        }
      }
      return runCheck(base);
    }
    default:
      return failUsage(command ?? "");
  }
}

main(process.argv.slice(2)).then((code) => process.exit(code));
