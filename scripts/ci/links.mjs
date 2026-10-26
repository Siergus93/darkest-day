#!/usr/bin/env node
import { repoRoot } from "./lib/config.mjs";
import { checkLinks } from "./lib/links.mjs";

const findings = checkLinks(repoRoot);

if (findings.length === 0) {
  console.log("docs.link: all relative Markdown links resolve.");
} else {
  console.error(`docs.link: ${findings.length} broken link(s).`);
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line} -> ${finding.target}`);
  }
}

process.exitCode = findings.length === 0 ? 0 : 1;
