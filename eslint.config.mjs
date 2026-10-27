// SAST rule pack for the factory's G4b SAST check.
// Scope: the factory's own JavaScript (src TS is logic-only; scripts are the
// runtime surface). Rule classes per ADR-0003/ADR-0004:
//   eslint-plugin-security for Node classes (child process, eval, regex),
//   @microsoft/eslint-plugin-sdl for the browser/JS classes it owns.
// The pack starts small and grows when a real defect class is named, not
// speculatively (see scripts/ci/lib/secrets.mjs for the same stance).

import sdl from "@microsoft/eslint-plugin-sdl";
import security from "eslint-plugin-security";

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
    },
    rules: {
      // No insecure-random here: the SDL rule crashes (engine-side) on any
      // dynamic require argument; recorded in ADR-0005 territory if it
      // returns. security rules carry the Node injection classes.
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
