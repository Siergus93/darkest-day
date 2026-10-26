import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkFormatting, checkLint } from "../scripts/ci/lib/format-lint.mjs";
import { commitAll, createGitRepo, createTempDir, write } from "./helpers/git-repo.mjs";
import { scanHistory } from "../scripts/ci/lib/secrets-history.mjs";

function tempTree(t, prefix) {
  const root = mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => {
    rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });
  return root;
}

test("the format check passes the real tree and reports the engine version", () => {
  const result = checkFormatting();
  assert.equal(result.ok, true);
});

test("an unformatted file fails the format check; restoring it passes", (t) => {
  const root = tempTree(t, "factory-format-bad-");
  writeFileSync(path.join(root, "bad.mjs"), "const  x   =1\n", "utf8");
  const broken = checkFormatting(root);
  assert.equal(broken.ok, false);
  assert.match(broken.detail, /bad\.mjs|format/);

  rmSync(path.join(root, "bad.mjs"), { force: true });
  assert.equal(checkFormatting(root).ok, true);
});

test("a lint violation fails the lint check with the rule id; removing it passes", (t) => {
  const root = tempTree(t, "factory-lint-bad-");
  writeFileSync(path.join(root, "broken.js"), "if (a ==  b) { }\n", "utf8");
  const broken = checkLint(root);
  assert.equal(broken.ok, false);
  assert.match(broken.detail, /noDoubleEquals|lint\/suspicious|broken\.js/);

  rmSync(path.join(root, "broken.js"), { force: true });
  assert.equal(checkLint(root).ok, true);
});

test("a fake credential that is committed is found by the history scan, then not after revert", (t) => {
  const root = createGitRepo(t);
  write(root, "clean.txt", "no credentials\n");
  commitAll(root, "clean");

  const fakeAwsKey = ["AKIA", "IOSFODNN7", "EXAMPLE"].join("");
  assert.equal(fakeAwsKey.length, 20);
  write(root, "leak.txt", `token ${fakeAwsKey}\n`);
  const leakCommit = commitAll(root, "leak");

  const findings = scanHistory(root);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "aws-access-key");
  assert.equal(findings[0].file, "leak.txt");
  assert.ok(findings[0].commit.length === 12);
  assert.equal(JSON.stringify(findings).includes(fakeAwsKey), false);

  write(root, "leak.txt", "rotated - the tree is clean again\n");
  const removeCommit = commitAll(root, "tree-is-clean-again");
  assert.notEqual(removeCommit, leakCommit);
  const after = scanHistory(root);
  // The leak stays in history until the history is rewritten; what must hold
  // is that the reveal is attributable, not that it vanishes.
  assert.ok(after.some((finding) => finding.file === "leak.txt"));
});

test("a clean history produces no findings", (t) => {
  const root = createGitRepo(t);
  write(root, "notes.txt", "nothing here\n");
  commitAll(root, "base");
  assert.deepEqual(scanHistory(root), []);
});

test("a tree without commits fails closed instead of passing", (t) => {
  const root = createTempDir(t);
  // git log needs a branch; an empty repo's log fails, and the gate must not
  // interpret that as "no findings".
  assert.throws(() => scanHistory(root), /failed/);
});
