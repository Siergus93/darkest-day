// SAST rule pack for the factory's G4b SAST check.
// Scope: the factory's own JavaScript (src TS is logic-only; scripts are the
// runtime surface). Rule classes per ADR-0003/ADR-0004 (+ its 2026-10-27
// amendment):
//   eslint-plugin-security for Node classes (child process, eval, regex),
//   @microsoft/eslint-plugin-sdl for the browser/JS classes it owns,
//   the local `factory/literal-command-exec` rule for literal command
//   execution (security/detect-child-process covers non-literal args only;
//   DECIDED COVERAGE: the exec family — exec, execFile, execSync,
//   execFileSync — is banned on both shapes; spawn/spawnSync with argument
//   arrays is the sanctioned pattern).
// The pack starts small and grows when a real defect class is named, not
// speculatively (see scripts/ci/lib/secrets.mjs for the same stance).

import sdl from "@microsoft/eslint-plugin-sdl";
import security from "eslint-plugin-security";
import factory from "./scripts/ci/eslint-rules/index.mjs";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      ".git/**",
    ],
  },
  {
    files: ["scripts/**/*.mjs", "test/**/*.mjs"],
    plugins: {
      "@microsoft/sdl": sdl,
      security,
      factory,
    },
    rules: {
      // No insecure-random here: the SDL rule crashes (engine-side) on any
      // dynamic require argument; recorded in ADR-0005 territory if it
      // returns. security rules carry the Node injection classes; the local
      // factory rule carries literal command execution (ADR-0004 amendment).
      "factory/literal-command-exec": "error",
      "@microsoft/sdl/no-insecure-url": "error",
      "security/detect-child-process": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-non-literal-regexp": "error",
      // detect-object-injection is off at factory scope: every hit was on
      // trusted in-repo lookups (argv/index, local config maps), which is the
      // rule's known noisy FP class. Revisit at the first product slice with
      // untrusted input reaching a sensitive sink (recorded in ADR-0004).
    },
  },
];
