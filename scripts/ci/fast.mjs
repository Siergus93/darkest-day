#!/usr/bin/env node
import { loadConfig, repoRoot } from "./lib/config.mjs";
import { runNpm } from "./lib/run.mjs";
import { formatFinding, scanSecrets } from "./lib/secrets.mjs";
import { checkLinks } from "./lib/links.mjs";
import { checkBlastRadius, formatBlastRadius, gitChangedPaths } from "./lib/blast-radius.mjs";

const results = [];
const startedAt = performance.now();

function record(gate, status, detail) {
  results.push({ gate, status, detail });
}

function printBlock(title, output) {
  if (output === undefined || output.trim() === "") {
    return;
  }
  console.log(`\n--- ${title} ---`);
  console.log(output.trim());
}

function elapsedSeconds() {
  return (performance.now() - startedAt) / 1000;
}

function parseArguments(argv) {
  const options = { slice: undefined, base: undefined, changed: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--slice") {
      options.slice = argv[index + 1];
      index += 1;
    } else if (argument === "--base") {
      options.base = argv[index + 1];
      index += 1;
    } else if (argument === "--changed") {
      options.changed = (argv[index + 1] ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (options.changed !== undefined && options.changed.length === 0) {
    throw new Error("--changed must list at least one path; an empty change set must not pass.");
  }
  return options;
}

const options = (() => {
  try {
    return parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(`fast lane: ${error.message}`);
    console.error(
      "Usage: node scripts/ci/fast.mjs [--slice work/NNNN-slug] [--base <git-ref>] [--changed <path,path>]",
    );
    process.exit(1);
  }
})();
let config;
try {
  config = loadConfig(repoRoot);
  record("CONFIG", "PASS", "factory.config.json is valid");
} catch (error) {
  record("CONFIG", "FAIL", "factory.config.json is invalid");
  console.error(error.message);
}

const slice = options.slice ?? config?.activeSlice;
const budgetMinutes = config?.lanes?.fast?.budgetMinutes ?? 10;

if (config !== undefined) {
  console.log(`Darkest Day fast lane — ${slice ?? "no active slice"} (lane budget ${budgetMinutes}m)`);

  const build = runNpm(["run", "build"]);
  if (build.status === 0) {
    record("G4a", "PASS", "clean build (tsc emit)");
    record("G4b", "PARTIAL", "type.check passed; format, lint, and SAST are adapter exceptions");
  } else {
    record("G4a", "FAIL", "build failed; see G4a output");
    record("G4b", "FAIL", "type.check failed through the build");
  }
  printBlock("G4a build.clean", build.output);

  if (build.status === 0) {
    const tests = runNpm(["test"]);
    const passed = tests.stdout.match(/^ℹ pass (\d+)/m)?.[1];
    const failedCount = tests.stdout.match(/^ℹ fail (\d+)/m)?.[1];
    const duration = tests.stdout.match(/^ℹ duration_ms ([\d.]+)/m)?.[1];
    const testSummary = `${passed ?? "?"} passed, ${failedCount ?? "?"} failed, ${duration ?? "?"}ms`;
    record("G4c", tests.status === 0 ? "PASS" : "FAIL", testSummary);
    printBlock("G4c test.isolated", tests.output);
  } else {
    record("G4c", "FAIL", "not run: build failed, so the test result would describe stale output");
  }

  try {
    const linkFindings = checkLinks(repoRoot);
    if (linkFindings.length === 0) {
      record("LINKS", "PASS", "all inline and reference Markdown links resolve");
    } else {
      record("LINKS", "FAIL", `${linkFindings.length} broken link(s)`);
      for (const finding of linkFindings) {
        console.log(`  ${finding.file}:${finding.line} -> ${finding.target}`);
      }
    }
  } catch (error) {
    record("LINKS", "FAIL", `link check crashed: ${error.message}`);
    console.error(error.message);
  }

  try {
    const secretFindings = scanSecrets(repoRoot);
    if (secretFindings.length === 0) {
      record("G4d", "PASS", "no credential patterns found in the working tree");
    } else {
      record("G4d", "FAIL", `${secretFindings.length} credential pattern(s) found`);
      for (const finding of secretFindings) {
        console.log(`  ${formatFinding(finding)}`);
      }
    }
  } catch (error) {
    record("G4d", "FAIL", `secret scan crashed: ${error.message}`);
    console.error(error.message);
  }

  const inventory = runNpm(["ls", "--all", "--json"]);
  const audit = runNpm(["audit", "--audit-level=high", "--json"]);
  if (inventory.status !== 0) {
    record("G4e", "FAIL", "dependency inventory could not be read from the lockfile");
  } else {
    const auditDetail =
      audit.status === 0
        ? "npm audit reported no high or critical advisories"
        : "npm audit reported findings or could not run; advisory until observed failing";
    record("G4e", "PARTIAL", `inventory readable; ${auditDetail}`);
  }

  if (build.status !== 0) {
    record("G4f", "FAIL", "not run: build failed, so dist/ cannot be trusted");
  } else if (slice === undefined) {
    record("G4f", "FAIL", "no slice plan selected; pass --slice or set activeSlice");
  } else {
    try {
      const changed = options.changed ?? gitChangedPaths(repoRoot, options.base);
      if (options.changed !== undefined) {
        console.log(
          "\nNote: G4f is using an explicit --changed list, not a VCS diff. " +
            "CI uses a git base, so a local pass is not proof that the list was complete.",
        );
      }
      const radius = await checkBlastRadius({ root: repoRoot, slice, changedPaths: changed });
      const failed = radius.problems.length > 0 || radius.outsideRadius.length > 0;
      record("G4f", failed ? "FAIL" : "PASS", formatBlastRadius(radius));
      if (failed) {
        console.log(`\n${formatBlastRadius(radius)}`);
      }
    } catch (error) {
      record("G4f", "FAIL", error.message);
      console.error(error.message);
    }
  }
}

const elapsed = elapsedSeconds();
if (elapsed > budgetMinutes * 60) {
  record(
    "BUDGET",
    "FAIL",
    `fast lane took ${elapsed.toFixed(1)}s, over the ${budgetMinutes}m budget in factory.config.json`,
  );
}

const blockingFailures = results.filter(
  (result) => result.status === "FAIL" && result.gate !== "CONFIG",
);
const configFailure = results.some((result) => result.gate === "CONFIG" && result.status === "FAIL");

console.log("\nGate summary");
for (const result of results) {
  console.log(`  ${result.gate.padEnd(7)} ${result.status.padEnd(9)} ${result.detail.split("\n")[0]}`);
}

const failed = blockingFailures.length > 0 || configFailure;
console.log(
  `\nFast lane ${failed ? "FAILED" : "PASSED"} in ${elapsed.toFixed(1)}s ` +
    `(budget ${budgetMinutes}m).`,
);
if (failed) {
  console.log("Fix the failing gate; do not lower it. Waivers require an owner, a control, and an expiry.");
}

process.exitCode = failed ? 1 : 0;
