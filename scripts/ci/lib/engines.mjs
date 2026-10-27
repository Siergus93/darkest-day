import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { repoRoot } from "./config.mjs";

const require = createRequire(import.meta.url);

/**
 * Shared engine runner for the format/lint wrappers.
 *
 * Engines are resolved from the npm tree that ships this script, so the result
 * never depends on the caller's PATH. Engines run with argv arrays and shell
 * disabled; findings exit 1 and exit 0 only on green.
 *
 * Note: require/require.resolve calls here use literal specifiers on purpose —
 * the SDL security rule in eslint.config.mjs crashes the eslint process on a
 * dynamic require argument, which is reported as an engine-side bug rather
 * than worked around with a suppressed rule.
 */
export function resolveBiomeBin() {
  const packageJsonPath = require.resolve("@biomejs/biome/package.json");
  return path.join(path.dirname(packageJsonPath), "bin", "biome");
}

/** Run a Node-hosted engine binary, returning {status, output}. */
export function runEngine(args, root = repoRoot) {
  const enginePath = resolveBiomeBin();
  const result = spawnSync(process.execPath, [enginePath, ...args], {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  const status = result.status ?? 1;
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  return { status, output };
}

/** The pinned Biome version this tree runs, for evidence output. */
export function biomeVersion() {
  return require("@biomejs/biome/package.json").version;
}

/**
 * Keep a tool failure actionable: the first lines the engine prints, never a
 * bare status code, and a note when output was truncated.
 */
export function trimEngineOutput(output, lines = 20) {
  const text = output.trim();
  if (text === "") {
    return "";
  }
  const selected = text.split(/\r?\n/).slice(0, lines).join("\n");
  return selected === text
    ? selected
    : `${selected}\n… (${text.split(/\r?\n/).length} lines total)`;
}
