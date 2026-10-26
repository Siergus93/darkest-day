import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { changeSetNote, gitChangedPaths } from "../scripts/ci/lib/blast-radius.mjs";
import { commitAll, createGitRepo, createTempDir, git, write } from "./helpers/git-repo.mjs";

test("a base run includes committed and uncommitted tracked changes", (t) => {
  const root = createGitRepo(t);
  write(root, "README.md", "base\n");
  write(root, "docs/guide.md", "base\n");
  const base = commitAll(root, "base");

  write(root, "README.md", "committed\n");
  commitAll(root, "committed change");

  write(root, "docs/guide.md", "uncommitted\n");

  assert.deepEqual(gitChangedPaths(root, base), ["README.md", "docs/guide.md"]);
});

test("a base run includes staged changes", (t) => {
  const root = createGitRepo(t);
  write(root, "README.md", "base\n");
  const base = commitAll(root, "base");

  write(root, "staged.md", "staged\n");
  git(root, ["add", "staged.md"]);

  assert.deepEqual(gitChangedPaths(root, base), ["staged.md"]);
});

test("a base run includes index-only staged changes", (t) => {
  const root = createGitRepo(t);
  write(root, "f.txt", "base\n");
  const base = commitAll(root, "base");

  write(root, "f.txt", "staged\n");
  git(root, ["add", "f.txt"]);
  git(root, ["restore", "--worktree", "--source=HEAD", "f.txt"]);

  write(root, "new.txt", "new\n");
  git(root, ["add", "new.txt"]);
  unlinkSync(path.join(root, "new.txt"));

  assert.deepEqual(gitChangedPaths(root, base), ["f.txt", "new.txt"]);
});

test("a base run includes uncommitted deletions", (t) => {
  const root = createGitRepo(t);
  write(root, "deleted.md", "gone\n");
  const base = commitAll(root, "base");

  unlinkSync(path.join(root, "deleted.md"));

  assert.deepEqual(gitChangedPaths(root, base), ["deleted.md"]);
});

test("a base run includes both sides of an uncommitted rename", (t) => {
  const root = createGitRepo(t);
  write(root, "old-name.md", "same content\n");
  const base = commitAll(root, "base");

  git(root, ["mv", "old-name.md", "new-name.md"]);

  assert.deepEqual(gitChangedPaths(root, base), ["new-name.md", "old-name.md"]);
});

test("a base run includes a staged typechange", (t) => {
  const root = createGitRepo(t);
  write(root, "thing", "regular\n");
  const base = commitAll(root, "base");

  unlinkSync(path.join(root, "thing"));
  const nested = path.join(root, "thing");
  mkdirSync(nested);
  git(nested, ["init"]);
  git(nested, ["config", "user.name", "Nested Test"]);
  git(nested, ["config", "user.email", "nested-test@example.invalid"]);
  git(nested, ["config", "commit.gpgsign", "false"]);
  write(nested, "file.txt", "nested\n");
  git(nested, ["add", "-A"]);
  git(nested, ["commit", "-m", "nested"]);
  git(root, ["add", "thing"]);

  assert.deepEqual(gitChangedPaths(root, base), ["thing"]);
});

test("a base run includes nested untracked files", (t) => {
  const root = createGitRepo(t);
  write(root, "README.md", "base\n");
  const base = commitAll(root, "base");

  write(root, "nested/deeper/new.md", "untracked\n");

  assert.deepEqual(gitChangedPaths(root, base), ["nested/deeper/new.md"]);
});

test("an empty or all-zero base falls back, and a clean tree is empty", (t) => {
  const root = createGitRepo(t);
  write(root, "README.md", "base\n");
  const base = commitAll(root, "base");

  write(root, "README.md", "uncommitted\n");

  assert.deepEqual(gitChangedPaths(root, ""), ["README.md"]);
  assert.deepEqual(gitChangedPaths(root, "0000000"), ["README.md"]);
  assert.deepEqual(gitChangedPaths(root, "   "), ["README.md"]);
  assert.deepEqual(gitChangedPaths(root, base), ["README.md"]);

  const clean = createGitRepo(t);
  write(clean, "README.md", "base\n");
  const cleanBase = commitAll(clean, "base");
  assert.deepEqual(gitChangedPaths(clean, cleanBase), []);
});

test("the change-set note explains the source and the fix", () => {
  assert.match(changeSetNote({}), /working tree only/);
  assert.match(changeSetNote({ baseRef: "0000000" }), /working tree only/);
  assert.match(changeSetNote({ baseRef: "   " }), /working tree only/);
  assert.equal(changeSetNote({ baseRef: "main" }), undefined);
  assert.match(changeSetNote({ baseRef: "main", explicit: true }), /explicit --changed/);
  assert.match(changeSetNote({ baseRef: "0000000", explicit: true }), /explicit --changed/);
});

test("a path found by more than one source is reported once", (t) => {
  const root = createGitRepo(t);
  write(root, "README.md", "base\n");
  const base = commitAll(root, "base");

  write(root, "README.md", "committed\n");
  commitAll(root, "committed change");
  write(root, "README.md", "uncommitted\n");

  assert.deepEqual(gitChangedPaths(root, base), ["README.md"]);
});

test("an invalid base fails instead of returning a partial set", (t) => {
  const root = createGitRepo(t);
  write(root, "README.md", "base\n");
  commitAll(root, "base");

  assert.throws(() => gitChangedPaths(root, "definitely-not-a-ref"), /git diff .* failed/);
  assert.throws(() => gitChangedPaths(root, "--output=evil"), /must not start with/);
});

test("a workspace that is not a git repository fails with an actionable message", (t) => {
  const root = createTempDir(t);

  assert.throws(() => gitChangedPaths(root), /Run inside a git repository, or pass --changed/);
});

test("a valueless --base is a usage error in both entry points, not a silent no-base run", (t) => {
  const scripts = path.join(import.meta.dirname, "..", "scripts", "ci");
  for (const entryPoint of ["blast-radius.mjs", "fast.mjs"]) {
    const result = spawnSync(process.execPath, [path.join(scripts, entryPoint), "--base"], {
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.equal(result.status, 1, `${entryPoint} --base should exit 1`);
    assert.match(result.stderr, /--base requires a git ref/);
  }
});

