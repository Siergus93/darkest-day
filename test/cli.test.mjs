import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gitChangedPaths } from "../scripts/ci/lib/blast-radius.mjs";
import { commitAll, createGitRepo, write } from "./helpers/git-repo.mjs";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(repoRoot, "dist", "cli.js");

/** Run the compiled CLI in `cwd`; returns the spawn result. */
function runCli(cwd, args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    // Isolated git config like the fixture helper uses, so the engines' git
    // calls inside the CLI process see the same sanitized environment.
    env: { ...process.env, GIT_CONFIG_GLOBAL: "", GIT_CONFIG_NOSYSTEM: "1" },
  });
}

/** A minimal-but-valid factory checkout: config, one gate, one slice plan. */
function writeFactoryCheckout(root) {
  write(
    root,
    "factory.config.json",
    JSON.stringify({
      schemaVersion: 1,
      factoryVersion: "0.3.2-test",
      owner: "test",
      activeSlice: "work/0006-test",
      tiers: {
        T0: { name: "docs", ceremony: "fast" },
        T1: { name: "local", ceremony: "standard" },
        T2: { name: "shared", ceremony: "all" },
        T3: { name: "critical", ceremony: "all" },
      },
      protectedPaths: [{ pattern: "protected/**", escalateTo: "T2", owner: "test" }],
      gates: [
        { id: "G1", tier: "T1", status: "wired" },
        { id: "G4f", tier: "T0", status: "wired" },
      ],
      lanes: { fast: {}, deep: {}, release: {} },
    }),
  );
  write(
    root,
    "work/0006-test/A4-slice-plan.md",
    [
      "# Slice plan (A4)",
      "| Field | Value |",
      "| --- | --- |",
      "| Tier | T1 |",
      "| Tier downgrade reason | n/a |",
      "",
      "## Blast radius",
      "",
      "| Surface | Touched | Notes |",
      "| --- | --- | --- |",
      "| Paths / modules | `src/**` `docs/**` | test fixture |",
    ].join("\n"),
  );
}

test("status prints version, active slice, and the gate catalog", (t) => {
  const root = createGitRepo(t);
  writeFactoryCheckout(root);
  commitAll(root, "fixture");

  const result = runCli(root, ["status"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /factory 0\.3\.2-test/);
  assert.match(result.stdout, /active slice: work\/0006-test/);
  assert.match(result.stdout, /^G1\tT1\twired$/m);
  assert.match(result.stdout, /^G4f\tT0\twired$/m);
});

test("check on a clean in-radius change set passes with the declared tier", (t) => {
  const root = createGitRepo(t);
  writeFactoryCheckout(root);
  const base = commitAll(root, "base");

  write(root, "src/feature.ts", "export const feature = 1;\n");
  commitAll(root, "in-radius change");

  const result = runCli(root, ["check", "--base", base]);

  assert.equal(result.status, 0, `stdout: ${result.stdout} stderr: ${result.stderr}`);
  assert.match(result.stdout, /factory check: PASS, T1/);
  assert.match(result.stdout, /src\/feature\.ts/);
});

test("check fails naming the escalation when a protected path changes", (t) => {
  const root = createGitRepo(t);
  writeFactoryCheckout(root);
  const base = commitAll(root, "base");

  write(root, "protected/secret.txt", "changed\n");

  const result = runCli(root, ["check", "--base", base]);

  assert.equal(result.status, 1);
  assert.match(result.stdout + result.stderr, /escalated by protected\/secret\.txt/);
  assert.match(result.stdout + result.stderr, /-> T2/);
  assert.match(result.stdout, /factory check: FAIL/);
});

test("check fails naming the path when a change is outside the declared radius", (t) => {
  const root = createGitRepo(t);
  writeFactoryCheckout(root);
  const base = commitAll(root, "base");

  write(root, "elsewhere/stray.md", "stray\n");

  const result = runCli(root, ["check", "--base", base]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /outside declared radius: elsewhere\/stray\.md/);
});

test("check change set matches the lane engine for the same base", (t) => {
  const root = createGitRepo(t);
  writeFactoryCheckout(root);
  const base = commitAll(root, "base");

  write(root, "src/a.ts", "a\n");
  write(root, "docs/b.md", "b\n");
  write(root, "protected/c.txt", "c\n");

  const result = runCli(root, ["check", "--base", base]);
  assert.equal(result.status, 1); // protected/c.txt escalates; parity is about paths, not verdict

  const expected = gitChangedPaths(root, base);
  const printed = new Set(
    result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
  for (const change of expected) {
    assert.ok(printed.has(change), `change set output must contain ${change}`);
  }
  assert.ok(
    result.stdout.includes(`${expected.length} changed path(s)`),
    `change count must appear in output:\n${result.stdout}`,
  );
});

test("check without --base prints the working-tree note", (t) => {
  const root = createGitRepo(t);
  writeFactoryCheckout(root);
  commitAll(root, "base");

  write(root, "src/uncommitted.ts", "new\n");

  const result = runCli(root, ["check"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /working tree only/);
  assert.match(result.stdout, /Pass --base <git-ref>/);
});

test("--help exits 0 for the top level and both commands", () => {
  for (const args of [[], ["--help"], ["status", "--help"], ["check", "--help"]]) {
    const result = runCli(".", args);
    assert.equal(result.status, 0, `args: ${args.join(" ")}`);
    assert.match(result.stdout, /Usage:/);
  }
});

test("an unknown argument exits 1 naming the argument", () => {
  const result = runCli(".", ["check", "--bogus"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--bogus/);

  const unknownCommand = runCli(".", ["deploy"]);
  assert.equal(unknownCommand.status, 1);
  assert.match(unknownCommand.stderr, /deploy/);
});
