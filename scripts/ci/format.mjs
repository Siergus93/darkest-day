#!/usr/bin/env node
// Format check, run in isolation: `node scripts/ci/format.mjs` (exit 1 on findings).
import { checkFormatting } from "./lib/format-lint.mjs";

const result = checkFormatting();
if (result.ok) {
  console.log("format.check: every file matches the Biome formatting rules.");
  process.exitCode = 0;
} else {
  console.error(`format.check FAILED: files do not match the Biome formatting rules.`);
  console.error(result.detail);
  console.error(
    "Run `npx biome check --write` at the repository root and review the diff before retrying;",
  );
  process.exitCode = 1;
}
