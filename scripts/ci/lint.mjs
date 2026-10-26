#!/usr/bin/env node
// Lint check, run in isolation: `node scripts/ci/lint.mjs` (exit 1 on findings).
import { checkLint } from "./lib/format-lint.mjs";

const result = checkLint();
if (result.ok) {
  console.log("lint.check: no lint rule violations.");
  process.exitCode = 0;
} else {
  console.error("lint.check FAILED: lint rule violations found.");
  console.error(result.detail);
  process.exitCode = 1;
}
