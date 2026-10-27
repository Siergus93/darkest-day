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
// Coverage (amendment v2, after fresh-context verification): the exec family is
// banned UNCONDITIONALLY — argument classification cannot cover every shape
// (dynamic-import destructures, computed members, static concat escaped the
// narrower v1 rule; the slice's fresh-context verifier falsified v1 and the
// decision was simplified so none of those edges can reopen the ban).
// spawn/spawnSync with argument arrays is the sanctioned pattern.

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
    "aliased named import must not bypass (v1 bug shape)",
    'import { exec as e } from "node:child_process";\ne("node --version");',
    ["factory/literal-command-exec"],
  ],
  [
    "default-import member call",
    'import cp from "node:child_process";\ncp.exec("node --version");',
    ["factory/literal-command-exec"],
  ],
  [
    "namespace import member call",
    'import * as cp from "node:child_process";\ncp.exec("node --version");',
    ["factory/literal-command-exec"],
  ],
  [
    "require member call",
    'import { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\nrequire("node:child_process").exec("node --version");',
    ["factory/literal-command-exec"],
  ],
  [
    "require destructure (v1 gap shape closed by unconditional ban)",
    'import { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\nconst { exec } = require("node:child_process");\nexec("node --version");',
    ["factory/literal-command-exec"],
  ],
  [
    "top-level await import destructure (fresh-context falsifying shape v7)",
    'const { exec } = await import("node:child_process");\nexec("rm -rf /");',
    ["factory/literal-command-exec"],
  ],
  [
    "aliased top-level await import destructure",
    'const { exec: e } = await import("node:child_process");\ne("rm -rf /");',
    ["factory/literal-command-exec"],
  ],
  [
    'computed member access cp["exec"] bypass shape',
    'import cp from "node:child_process";\ncp["exec"]("rm -rf /");',
    ["factory/literal-command-exec"],
  ],
  [
    "family method (execFile) with non-static args (v7 shape family)",
    'import { execFile } from "node:child_process";\nconst f = process.argv[2];\nexecFile(f, ["--x"]);',
    ["factory/literal-command-exec"],
  ],
  [
    "static template interpolation is effectively literal",
    'import { exec } from "node:child_process";\nconst c = "node --version";\nexec(`ls ${c}`);',
    ["factory/literal-command-exec"],
  ],
  [
    "static string concatenation (documented v1 edge, closed by the ban)",
    'import { exec } from "node:child_process";\nexec("node --ver" + "sion");',
    ["factory/literal-command-exec"],
  ],
  [
    "dynamic template is covered (factory rule + second opinion)",
    'import { exec } from "node:child_process";\nconst cmd = process.argv[2];\nexec(`ls ${cmd}`);',
    ["factory/literal-command-exec", "security/detect-child-process"],
  ],
  [
    "a bare identifier not resolving to child_process stays clean",
    'const exec = () => {};\nexec("idle work");',
    [],
  ],
  [
    "spawn/spawnSync with argument array stays clean (sanctioned pattern)",
    'import { spawnSync } from "node:child_process";\nspawnSync("git", ["status"]);',
    [],
  ],
  [
    "spawn through a member alias stays clean",
    'import cp from "node:child_process";\ncp.spawn("git", ["status"]);',
    [],
  ],
  // FU-8 (slice 0009): the three static obfuscation shapes the resolver missed.
  [
    "constant-folded computed member key (FU-8 shape 1)",
    'import cp from "node:child_process";\ncp["ex" + "ec"]("rm -rf /");',
    ["factory/literal-command-exec"],
  ],
  [
    "template-literal module specifier, no interpolation (FU-8 shape 2)",
    'const { exec } = await import(`node:child_process`);\nexec("rm -rf /");',
    ["factory/literal-command-exec"],
  ],
  [
    "multi-hop require alias chain (FU-8 shape 3)",
    'import { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\nconst r = require;\nconst { exec } = r("node:child_process");\nexec("rm -rf /");',
    ["factory/literal-command-exec"],
  ],
  [
    "require of a template-literal specifier (FU-8 shape 2, require side)",
    'import { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\nconst { execSync } = require(`node:child_process`);\nexecSync("rm -rf /");',
    ["factory/literal-command-exec"],
  ],
  // Accepted edges and sanctioned patterns must stay clean (no false positives).
  [
    "runtime-computed member key stays clean (accepted edge, FU-8)",
    'import cp from "node:child_process";\nconst key = process.argv[2];\ncp[key]("ls");',
    [],
  ],
  [
    "spawn through a require alias chain stays clean (sanctioned)",
    'import { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\nconst r = require;\nconst { spawnSync } = r("node:child_process");\nspawnSync("git", ["status"]);',
    [],
  ],
];

test("the ADR-0004 coverage holds: every exec-family shape is rejected, sanctioned usage passes", async () => {
  for (const [name, source, expected] of cases) {
    const ruleIds = await lintFixture(source);
    assert.deepEqual(
      ruleIds,
      expected,
      `Fixture "${name}" linted to ${JSON.stringify(ruleIds)}, expected ${JSON.stringify(expected)}`,
    );
  }
});
