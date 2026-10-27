/**
 * Minimal ambient Node globals for the CLI.
 *
 * The repo deliberately has no @types/node (no-new-dependency constraint);
 * src/tiers.ts needs none. These declare exactly the surface cli.ts uses —
 * if the CLI needs more, reconsider the constraint in an ADR instead of
 * growing this file.
 */

declare const process: {
  argv: string[];
  cwd(): string;
  exit(code: number): never;
};

declare const console: {
  log(...data: unknown[]): void;
  error(...data: unknown[]): void;
};
