import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const DEFAULT_IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".cache",
]);

const MAX_TEXT_BYTES = 1_048_576;

/** Walk a tree deterministically, skipping ignored directories and symlinks. */
export function walkFiles(root, options = {}) {
  const ignored = options.ignored ?? DEFAULT_IGNORED_DIRECTORIES;
  const files = [];

  function visit(directory) {
    const entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) {
          visit(absolute);
        }
      } else if (entry.isFile()) {
        files.push(absolute);
      }
    }
  }

  visit(root);
  return files;
}

/** Return file text, or null when the file is binary or too large to scan. */
export function readTextFile(file, maxBytes = MAX_TEXT_BYTES) {
  const buffer = readFileSync(file);
  if (buffer.length > maxBytes) {
    return null;
  }
  const sample = buffer.subarray(0, 8192);
  if (sample.includes(0)) {
    return null;
  }
  return buffer.toString("utf8");
}

export function relativePath(root, file) {
  return path.relative(root, file).replaceAll("\\", "/");
}
