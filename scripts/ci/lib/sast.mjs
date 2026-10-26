import { ESLint } from "eslint";
import { repoRoot } from "./config.mjs";
import { relativePath } from "./files.mjs";

/**
 * SAST check (G4b).
 *
 * Runs the security rule pack in `eslint.config.mjs` over the factory's own
 * JavaScript through ESLint's programmatic API — the same engine, rules, and
 * ignore list in every invocation, local and CI.
 */
export async function scanSast(root = repoRoot) {
  const eslint = new ESLint({ cwd: root, cache: false });
  const results = await eslint.lintFiles(["scripts/**/*.mjs", "test/**/*.mjs"]);
  const errors = [];
  const warnings = [];
  const fatal = results.some((result) => result.messages.some((message) => message.fatal === true));
  for (const result of results) {
    for (const message of result.messages) {
      const row = formatMessage(root, result.filePath, message);
      (message.severity === 1 ? warnings : errors).push(row);
    }
  }
  return { errors, warnings, fatal };
}

function formatMessage(root, file, message) {
  const relative = relativePath(root, file);
  const severity = message.severity === 1 ? "warning" : "error";
  return (
    `${relative}:${message.line}:${message.column} [${severity}] ` +
    `${message.ruleId ?? "unknown"}: ${message.message}`
  );
}
