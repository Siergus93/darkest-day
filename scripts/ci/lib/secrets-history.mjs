import { spawnSync } from "node:child_process";
import { repoRoot } from "./config.mjs";
import { SECRET_RULES } from "./secrets.mjs";

/**
 * Secret history scan (G4d, history).
 *
 * The same repository-owned ruleset as the working-tree scan, re-applied over
 * `git log -p --all` output. This is faithful to how G4d already works (repo-
 * owned rules, no third-party engine added); it intentionally does not claim
 * coverage beyond the ruleset.
 *
 * Findings never include the secret value, only the file, the added-line
 * position inside the diff, the rule, and the commit that introduced it.
 */
export function scanHistory(root = repoRoot) {
  const result = spawnSync("git", ["log", "-p", "-U0", "--all", "--no-color", "--no-ext-diff"], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    maxBuffer: 256 * 1024 * 1024,
  });

  if (result.status !== 0 || result.error !== undefined) {
    const reason = [result.error?.message, result.stderr].filter(Boolean).join(" ").trim();
    throw new Error(
      `git log over full history failed (exit ${result.status ?? "?"}): ${reason || "no git output"}`,
    );
  }

  const findings = [];
  let currentFile = "unknown";
  let currentCommit = "unknown";
  let addedLines = 0;

  for (const line of result.stdout.split("\n")) {
    const commitMatch = line.match(/^commit ([0-9a-f]{40})$/);
    if (commitMatch !== null) {
      currentCommit = commitMatch[1];
      currentFile = "unknown";
      addedLines = 0;
      continue;
    }
    const fileMatch = line.match(/^diff --git a\/(.*) b\/(.*)$/);
    if (fileMatch !== null) {
      currentFile = fileMatch[2];
      addedLines = 0;
      continue;
    }
    // Findings are anchored to added lines only: the commit that introduced a
    // secret is what a reviewer needs.
    if (line.startsWith("+") && !line.startsWith("+++")) {
      addedLines += 1;
      for (const rule of SECRET_RULES) {
        const matches = line.match(rule.pattern);
        if (matches !== null) {
          findings.push({
            commit: currentCommit.slice(0, 12),
            file: currentFile,
            diffLine: addedLines,
            rule: rule.id,
            description: rule.description,
          });
          break;
        }
      }
    }
  }

  return dedupeFindings(findings);
}

/** Once per commit+file+rule; multiple occurrences in one commit collapse. */
export function dedupeFindings(findings) {
  const seen = new Set();
  const unique = [];
  for (const finding of findings) {
    const key = `${finding.commit}|${finding.file}|${finding.rule}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(finding);
  }
  return unique;
}

/** History paths are already repo-relative, so they print as-is. */
export function formatHistoryFinding(finding) {
  return (
    `${finding.rule} in ${finding.file} (commit ${finding.commit}, added-line ` +
    `${finding.diffLine}): ${finding.description}`
  );
}
