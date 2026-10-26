#!/usr/bin/env node
// SAST check, run in isolation: `node scripts/ci/sast.mjs` (exit 1 on findings).
import { repoRoot } from "./lib/config.mjs";
import { scanSast } from "./lib/sast.mjs";

const result = await scanSast(repoRoot);

if (result.errors.length === 0) {
  console.log(`sast: no security rule violations (${result.warnings.length} warning(s)).`);
  for (const row of result.warnings) {
    console.log(`  ${row}`);
  }
  process.exitCode = 0;
} else {
  console.error(`sast FAILED: ${result.errors.length} security rule violation(s).`);
  for (const row of result.errors) {
    console.error(`  ${row}`);
  }
  console.error("The rule pack is eslint.config.mjs; narrow it only with a recorded reason.");
  process.exitCode = 1;
}
