import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadConfig, repoRoot } from "./config.mjs";
import { run } from "./run.mjs";

const IGNORED_CHANGE_PREFIXES = ["dist/", "node_modules/", "coverage/"];

function splitLines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Read changed paths from git. Throws when the workspace is not a repository. */
export function gitChangedPaths(root = repoRoot, baseRef) {
  const trimmedBase = baseRef?.trim();
  const usableBase =
    trimmedBase === undefined || trimmedBase === "" || /^0+$/.test(trimmedBase)
      ? undefined
      : trimmedBase;
  const diffArgs = usableBase
    ? ["diff", "--name-only", "--no-renames", "--diff-filter=ACMRD", `${usableBase}...HEAD`]
    : ["diff", "--name-only", "--no-renames", "--diff-filter=ACMRD", "HEAD"];

  const diff = run("git", diffArgs, { cwd: root });
  if (diff.status !== 0) {
    throw new Error(
      `git ${diffArgs.join(" ")} failed:\n${diff.output || diff.error || "unknown error"}\n` +
        "Run inside a git repository, or pass --changed <comma-separated paths>.",
    );
  }

  const untracked = run("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root });
  const paths = [...splitLines(diff.stdout)];
  if (untracked.status === 0) {
    paths.push(...splitLines(untracked.stdout));
  }
  return [...new Set(paths)].sort();
}

/** Extract the tier, downgrade reason, and declared globs from an A4 slice plan. */
export function parseSlicePlan(markdown) {
  const tierMatch = markdown.match(/^\|\s*Tier\s*\|\s*(T[0-3])\b/m);
  if (tierMatch?.[1] === undefined) {
    throw new Error("A4 must declare a tier as `| Tier | T0-T3 |`.");
  }

  const downgradeMatch = markdown.match(/^\|\s*Tier downgrade reason\s*\|\s*([^|]*)\|/m);
  const rawReason = (downgradeMatch?.[1] ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  const downgradeReason = rawReason === "" || rawReason.toLowerCase() === "n/a" ? undefined : rawReason;

  const blastSection = markdown.split(/^##\s+Blast radius\s*$/m)[1]?.split(/^##\s+/m)[0] ?? "";
  const pathsRow = blastSection.match(/^\|\s*Paths\s*\/\s*modules\s*\|\s*([^|]*)\|/m);
  if (pathsRow?.[1] === undefined) {
    throw new Error("A4 must contain a `| Paths / modules | ... |` row in `## Blast radius`.");
  }

  const declaredGlobs = [...pathsRow[1].matchAll(/`([^`]+)`/g)]
    .map((match) => match[1])
    .filter((glob) => glob !== undefined && glob !== "");

  if (declaredGlobs.length === 0) {
    throw new Error("A4 blast radius must list at least one backticked path glob.");
  }

  return { tier: tierMatch[1], downgradeReason, declaredGlobs };
}

function isIgnoredChange(change) {
  return IGNORED_CHANGE_PREFIXES.some((prefix) => change.startsWith(prefix));
}

/**
 * Compare changed paths to the declared radius and resolve the required tier.
 *
 * The tier module is built TypeScript (`dist/tiers.js`) so the factory and the
 * gate script cannot drift apart.
 */
export async function checkBlastRadius({ root = repoRoot, slice, changedPaths }) {
  const config = loadConfig(root);
  const slicePath = path.resolve(root, slice);
  const planFile = path.join(slicePath, "A4-slice-plan.md");

  if (!existsSync(planFile)) {
    throw new Error(`Slice plan not found: ${path.relative(root, planFile)}`);
  }

  const plan = parseSlicePlan(readFileSync(planFile, "utf8"));

  let tiers;
  try {
    tiers = await import("../../../dist/tiers.js");
  } catch {
    throw new Error("dist/tiers.js is missing. Run `npm run build` before the blast-radius gate.");
  }

  if (changedPaths.length === 0) {
    throw new Error(
      "No changed paths were supplied. Pass --changed <paths> or --base <git-ref>; " +
        "an empty change set must not pass the blast-radius gate.",
    );
  }

  const relevantChanges = changedPaths.filter((change) => !isIgnoredChange(change));
  if (relevantChanges.length === 0) {
    throw new Error("All supplied paths are ignored build output; pass source paths instead.");
  }
  const resolution = tiers.resolveTier(plan.tier, relevantChanges, config.protectedPaths);

  const problems = [];
  try {
    tiers.applyDeclaredTier(resolution.required, plan.tier, plan.downgradeReason);
  } catch (error) {
    problems.push(error.message);
  }

  const outsideRadius = relevantChanges.filter(
    (change) => !plan.declaredGlobs.some((glob) => tiers.matchesGlob(change, glob)),
  );

  return {
    slice,
    declaredTier: plan.tier,
    requiredTier: resolution.required,
    downgradeReason: plan.downgradeReason,
    declaredGlobs: plan.declaredGlobs,
    escalations: resolution.escalations,
    changedPaths: relevantChanges,
    outsideRadius,
    problems,
  };
}

export function formatBlastRadius(result) {
  const lines = [];
  lines.push(
    `Slice ${result.slice}: declared ${result.declaredTier}, required ${result.requiredTier}, ` +
      `${result.changedPaths.length} changed path(s).`,
  );

  for (const escalation of result.escalations) {
    lines.push(
      `  escalated by ${escalation.path} (matches ${escalation.pattern} -> ${escalation.escalateTo})`,
    );
  }
  if (result.downgradeReason !== undefined) {
    lines.push(`  downgrade reason: ${result.downgradeReason}`);
  }
  for (const problem of result.problems) {
    lines.push(`  tier: ${problem}`);
  }
  for (const change of result.outsideRadius) {
    lines.push(`  outside declared radius: ${change}`);
  }

  return lines.join("\n");
}
