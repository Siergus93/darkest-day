import { repoRoot } from "./config.mjs";
import { runEngine, trimEngineOutput } from "./engines.mjs";

/**
 * Interpret an engine result. Biome exits 1 with "No files were processed"
 * when nothing in scope matched; that is a zero finding result, not a failure,
 * but it is reported so a too-narrow file scope cannot hide violations.
 */
function interpret(result, gateName) {
  const output = trimEngineOutput(result.output);
  if (result.status === 0) {
    return { ok: true, detail: output };
  }
  if (result.status === null) {
    return {
      ok: false,
      detail: `${gateName} could not be started; the check must not pass without running.`,
    };
  }
  if (/no files were processed/i.test(result.output)) {
    return { ok: true, detail: `${gateName} checked 0 files (empty scope).` };
  }
  return { ok: false, detail: output || `${gateName} failed with exit code ${result.status}.` };
}

/**
 * Format check (G4b, format). Biome decides; this wrapper maps its verdict to
 * exit codes and keeps the failure actionable.
 */
export function checkFormatting(root = repoRoot) {
  const result = runEngine(["format"], root);
  return interpret(result, "biome format");
}

/**
 * Lint check (G4b, lint). Same engine, isolated invocation, so a lint failure
 * does not drag format evidence with it.
 */
export function checkLint(root = repoRoot) {
  const result = runEngine(["lint"], root);
  return interpret(result, "biome lint");
}
