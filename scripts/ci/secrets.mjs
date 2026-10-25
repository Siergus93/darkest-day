#!/usr/bin/env node
import { formatFinding, scanSecrets } from "./lib/secrets.mjs";
import { repoRoot } from "./lib/config.mjs";

const findings = scanSecrets(repoRoot);

if (findings.length === 0) {
  console.log("secrets.scan: no credential patterns found in the working tree.");
} else {
  console.error(`secrets.scan: ${findings.length} credential pattern(s) found.`);
  for (const finding of findings) {
    console.error(`  ${formatFinding(finding)}`);
  }
  console.error(
    "Remove the value and rotate the credential. If this is a proven false positive, " +
      "narrow the rule in scripts/ci/lib/secrets.mjs; there is no line-level suppression.",
  );
}

process.exitCode = findings.length === 0 ? 0 : 1;
