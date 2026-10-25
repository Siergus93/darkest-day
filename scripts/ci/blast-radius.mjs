#!/usr/bin/env node
import { checkBlastRadius, formatBlastRadius, gitChangedPaths } from "./lib/blast-radius.mjs";
import { loadConfig, repoRoot } from "./lib/config.mjs";

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
    } else if (argument === "--help" || argument === "-h") {
      console.log(
        "Usage: node scripts/ci/blast-radius.mjs [--slice work/NNNN-slug] " +
          "[--base <git-ref>] [--changed <path,path>]",
      );
      process.exitCode = 0;
      return undefined;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (options.changed !== undefined && options.changed.length === 0) {
    throw new Error("--changed must list at least one path; an empty change set must not pass.");
  }
  return options;
}

try {
  const options = parseArguments(process.argv.slice(2));
  if (options !== undefined) {
    const config = loadConfig(repoRoot);
    const slice = options.slice ?? config.activeSlice;
    const changed = options.changed ?? gitChangedPaths(repoRoot, options.base);
    const result = await checkBlastRadius({ root: repoRoot, slice, changedPaths: changed });
    console.log(formatBlastRadius(result));
    process.exitCode = result.problems.length > 0 || result.outsideRadius.length > 0 ? 1 : 0;
  }
} catch (error) {
  console.error(`vcs.diff: ${error.message}`);
  process.exitCode = 1;
}
