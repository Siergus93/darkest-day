#!/usr/bin/env node
// Secret history scan, run in isolation: `node scripts/ci/secrets-history.mjs`.
import { formatHistoryFinding, scanHistory } from "./lib/secrets-history.mjs";

try {
  const findings = scanHistory();
  if (findings.length === 0) {
    console.log("secrets.history: no credential patterns in any recorded commit.");
    process.exitCode = 0;
  } else {
    console.error(`secrets.history FAILED: ${findings.length} credential pattern(s) in history.`);
    for (const finding of findings) {
      console.error(`  ${formatHistoryFinding(finding)}`);
    }
    console.error(
      "Rotate the credential even if it is no longer on HEAD; history rewrites are only " +
        "safe once rotation is done. Narrow the rule in scripts/ci/lib/secrets.mjs only on " +
        "a proven false positive; there is no line-level or commit-level suppression.",
    );
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`secrets.history FAILED: ${error.message}`);
  process.exitCode = 1;
}
