import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../scripts/ci/lib/run.mjs";

const gitEnvByRoot = new Map();

/**
 * Create a temporary git repository for change-set integration tests.
 *
 * The repository is removed by the test's `t.after` hook. Git is configured
 * with an empty global/system config and empty excludes/hooks so a developer's
 * settings cannot change the fixture.
 */
export function createTempDir(t) {
  const root = mkdtempSync(path.join(tmpdir(), "factory-git-"));
  t.after(() => {
    rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });
  return root;
}

export function createGitRepo(t) {
  const root = createTempDir(t);
  const configRoot = createTempDir(t);
  const configFile = path.join(configRoot, "gitconfig");
  writeFileSync(configFile, "");
  gitEnvByRoot.set(root, {
    GIT_CONFIG_GLOBAL: configFile,
    GIT_CONFIG_SYSTEM: configFile,
    GIT_CONFIG_NOSYSTEM: "1",
  });

  git(root, ["init", "-b", "main"]);
  const emptyExcludes = path.join(root, ".git", "empty-excludes");
  const emptyHooks = path.join(root, ".git", "empty-hooks");
  writeFileSync(emptyExcludes, "");
  mkdirSync(emptyHooks, { recursive: true });
  git(root, ["config", "user.name", "Factory Test"]);
  git(root, ["config", "user.email", "factory-test@example.invalid"]);
  git(root, ["config", "commit.gpgsign", "false"]);
  git(root, ["config", "core.autocrlf", "false"]);
  git(root, ["config", "core.excludesFile", emptyExcludes]);
  git(root, ["config", "core.hooksPath", emptyHooks]);
  return root;
}

/** Run git in `root`, throwing with the command and output when it fails. */
export function git(root, args, env) {
  const isolatedEnv = env ?? gitEnvByRoot.get(root);
  const result = run("git", args, { cwd: root, ...(isolatedEnv ? { env: isolatedEnv } : {}) });
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed in ${root} (exit ${result.status}):\n${result.output}`,
    );
  }
  return result.stdout.trim();
}

/** Write a UTF-8 file, creating parent directories as needed. */
export function write(root, relativePath, content = "") {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
}

/** Stage every change and commit it; returns the new commit SHA. */
export function commitAll(root, message = "test commit") {
  git(root, ["add", "-A"]);
  git(root, ["commit", "-m", message]);
  return git(root, ["rev-parse", "HEAD"]);
}
