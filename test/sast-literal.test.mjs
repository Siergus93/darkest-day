import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { ESLint } from "eslint";
import { repoRoot } from "../scripts/ci/lib/config.mjs";

// Fixtures for the SAST literal-command-exec coverage decision (slice 0005,
// ADR-0004 amendment). Each entry is a synthetic source string linted through
// the REAL rule pack (eslint.config.mjs) with a virtual file path, so the
// tests fail if the pack drifts from the coverage table below.
//
//   factory/literal-command-exec : raw commands (literal or template)
//   security/detect-child-process : dynamic commands (non-literal first arg)

const ESLint_CONFIG = path.join(repoRoot, "eslint.config.mjs");

async function lintFixture(source) {
  const eslint = new ESLint({ cwd: repoRoot, overrideConfigFile: ESLint_CONFIG });
  const results = await eslint.lintText(source, {
    filePath: "scripts/_virtual-sast-fixture.mjs",
  });
  return results.flatMap((result) => result.messages.map((m) => m.ruleId)).sort();
}

const cases = [
  // [name, source, expected rule ids (sorted)]
  [
    "named import exec with literal command",
    'import { exec } from "node:child_process";\nexec("node --version");',
    ["factory/literal-command-exec"],
  ],
  [
    "named import execSync with literal command",
    'import { execSync } from "node:child_process";\nexecSync("node --version");',
    ["factory/literal-command-exec"],
  ],
  [
    "aliased named import must not bypass",
    'import { exec as e } from "node:child_process";\ne("node --version");',
    ["factory/literal-command-exec"],
  ],
  [
    "default-import member call with literal command",
    'import cp from "node:child_process";\ncp.exec("node --version");',
    ["factory/literal-command-exec"],
  ],
  [
    "member execFile with literal executable",
    'import cp from "node:child_process";\ncp.execFile("node", ["--version"]);',
    ["factory/literal-command-exec"],
  ],
  [
    "createRequire member call with literal command",
    'import { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\nrequire("node:child_process").exec("node --version");',
    ["factory/literal-command-exec"],
  ],
  [
    "statically-known template interpolation is effectively literal",
    'import { exec } from "node:child_process";\nconst c = "node --version";\nexec(`ls ${c}`);',
    ["factory/literal-command-exec"],
  ],
  [
    "dynamic template is covered by the non-literal rule",
    'import { exec } from "node:child_process";\nconst cmd = process.argv[2];\nexec(`ls ${cmd}`);',
    ["factory/literal-command-exec", "security/detect-child-process"],
  ],
  [
    "bare identifier not resolving to child_process stays clean",
    'const helper = () => {};\nconst exec = helper;\nexec("idle work");',
    [],
  ],
  [
    "spawn/spawnSync with argument array stays clean (sanctioned pattern)",
    'import { spawnSync } from "node:child_process";\nspawnSync("git", ["status"]);',
    [],
  ],
  [
    "exec family with no arguments stays clean",
    'import { execSync } from "node:child_process";\nexecSync();',
    [],
  ],
];

test("the ADR-0004 coverage table holds: raw command execution fails, sanctioned usage passes", async () => {
  for (const [name, source, expected] of cases) {
    const ruleIds = await lintFixture(source);
    assert.deepEqual(
      ruleIds,
      expected,
      `Fixture "${name}" linted to ${JSON.stringify(ruleIds)}, expected ${JSON.stringify(expected)}`,
    );
  }
});
