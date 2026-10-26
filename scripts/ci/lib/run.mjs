import { spawnSync } from "node:child_process";

export const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

/**
 * Run a command and capture its output.
 *
 * On Windows, `.cmd` shims require a shell. All arguments here are constants
 * defined in repository scripts, never untrusted input.
 */
export function run(command, args = [], options = {}) {
  const isCmdShim = process.platform === "win32" && command.endsWith(".cmd");
  const spawnTarget = isCmdShim ? (process.env.ComSpec ?? "cmd.exe") : command;
  const spawnArgs = isCmdShim ? ["/d", "/s", "/c", [command, ...args].join(" ")] : args;
  const result = spawnSync(spawnTarget, spawnArgs, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    shell: false,
    timeout: options.timeoutMs ?? 0,
  });

  const status = result.status ?? 1;
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const error = result.error?.message;

  return {
    command: [command, ...args].join(" "),
    status,
    stdout,
    stderr,
    error,
    output: [stdout.trim(), stderr.trim()].filter(Boolean).join("\n"),
  };
}

export function runNpm(args, options = {}) {
  return run(npmCommand, args, options);
}
