import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));

const REQUIRED_TIERS = ["T0", "T1", "T2", "T3"];

/**
 * Load and validate the factory manifest.
 *
 * The manifest is the single machine-readable source for tiers, protected
 * paths, lanes, and gate status. Docs explain it; this file defines it.
 */
export function loadConfig(root = repoRoot) {
  const configPath = path.join(root, "factory.config.json");
  let config;
  try {
    config = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read ${path.relative(root, configPath)}: ${error.message}`);
  }

  const problems = [];

  if (config.schemaVersion !== 1) {
    problems.push(`schemaVersion must be 1, found ${String(config.schemaVersion)}`);
  }
  if (typeof config.owner !== "string" || config.owner.trim() === "") {
    problems.push("owner must name an accountable person");
  }
  if (typeof config.activeSlice !== "string" || config.activeSlice.trim() === "") {
    problems.push("activeSlice must point at the slice directory");
  }

  for (const tier of REQUIRED_TIERS) {
    if (config.tiers?.[tier] === undefined) {
      problems.push(`tiers.${tier} is missing`);
    }
  }

  if (!Array.isArray(config.protectedPaths) || config.protectedPaths.length === 0) {
    problems.push("protectedPaths must contain at least one entry");
  } else {
    for (const [index, entry] of config.protectedPaths.entries()) {
      if (typeof entry?.pattern !== "string" || entry.pattern.trim() === "") {
        problems.push(`protectedPaths[${index}].pattern is missing`);
      }
      if (!REQUIRED_TIERS.includes(entry?.escalateTo)) {
        problems.push(`protectedPaths[${index}].escalateTo must be T0-T3`);
      }
      if (typeof entry?.owner !== "string" || entry.owner.trim() === "") {
        problems.push(`protectedPaths[${index}].owner is missing`);
      }
    }
  }

  if (!Array.isArray(config.gates) || config.gates.length === 0) {
    problems.push("gates must contain the gate catalog");
  } else {
    const seen = new Set();
    for (const [index, gate] of config.gates.entries()) {
      if (typeof gate?.id !== "string" || gate.id.trim() === "") {
        problems.push(`gates[${index}].id is missing`);
      } else if (seen.has(gate.id)) {
        problems.push(`gates[${index}].id ${gate.id} is duplicated`);
      } else {
        seen.add(gate.id);
      }
      if (!REQUIRED_TIERS.includes(gate?.tier)) {
        problems.push(`gates[${index}].tier must be T0-T3`);
      }
      if (typeof gate?.status !== "string") {
        problems.push(`gates[${index}].status is missing`);
      }
    }
  }

  for (const lane of ["fast", "deep", "release"]) {
    if (config.lanes?.[lane] === undefined) {
      problems.push(`lanes.${lane} is missing`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Invalid factory.config.json:\n- ${problems.join("\n- ")}`);
  }

  return config;
}

export function loadSlicePlan(root, relativePath) {
  const planPath = path.resolve(root, relativePath, "A4-slice-plan.md");
  try {
    return { path: planPath, markdown: readFileSync(planPath, "utf8") };
  } catch (error) {
    throw new Error(`Cannot read slice plan ${planPath}: ${error.message}`);
  }
}
