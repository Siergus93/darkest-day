import { existsSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./config.mjs";
import { readTextFile, relativePath, walkFiles } from "./files.mjs";

const INLINE_LINK = /!?\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g;
const REFERENCE_DEFINITION = /^\s{0,3}\[[^\]]+\]:\s*(<[^>]+>|\S+)/;
const FENCE_START = /^\s{0,3}(```|~~~)/;
// eslint-disable-next-line @microsoft/sdl/no-insecure-url -- the http:// string is the scanner's own detection vocabulary, not a URL used at runtime
const EXTERNAL_PREFIXES = ["http://", "https://", "mailto:", "tel:", "data:"];

/** Approximate GitHub's heading anchors for links that point at a fragment. */
function slugify(heading) {
  return heading
    .replace(/<[^>]*>/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-");
}

function normaliseTarget(raw) {
  return raw.replace(/^<|>$/g, "").trim();
}

/**
 * Collect links and heading anchors in one pass so reported line numbers match
 * the source file even when fenced code appears earlier.
 */
function collectDocument(markdown) {
  const links = [];
  const anchors = new Set();
  const occurrences = new Map();
  let fence;

  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (fence !== undefined) {
      if (line.trim().startsWith(fence)) {
        fence = undefined;
      }
      continue;
    }

    const fenceMatch = line.match(FENCE_START);
    if (fenceMatch?.[1] !== undefined) {
      fence = fenceMatch[1];
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading?.[2] !== undefined) {
      const base = slugify(heading[2]);
      if (base !== "") {
        const seen = occurrences.get(base) ?? 0;
        occurrences.set(base, seen + 1);
        anchors.add(seen === 0 ? base : `${base}-${seen}`);
      }
    }

    for (const match of line.matchAll(INLINE_LINK)) {
      links.push({ line: index + 1, target: normaliseTarget(match[1] ?? "") });
    }

    const definition = line.match(REFERENCE_DEFINITION);
    if (definition?.[1] !== undefined) {
      links.push({ line: index + 1, target: normaliseTarget(definition[1]) });
    }
  }

  return { links, anchors };
}

/** Check relative Markdown links and fragments against the tree. */
export function checkLinks(root = repoRoot) {
  const findings = [];
  const documentCache = new Map();

  function documentFor(file) {
    const cached = documentCache.get(file);
    if (cached !== undefined) {
      return cached;
    }
    const text = readTextFile(file);
    const document = text === null ? { links: [], anchors: new Set() } : collectDocument(text);
    documentCache.set(file, document);
    return document;
  }

  for (const file of walkFiles(root)) {
    if (!file.toLowerCase().endsWith(".md")) {
      continue;
    }
    const text = readTextFile(file);
    if (text === null) {
      continue;
    }

    const source = relativePath(root, file);
    const { links } = collectDocument(text);

    for (const link of links) {
      const target = link.target;
      if (target === "" || EXTERNAL_PREFIXES.some((prefix) => target.startsWith(prefix))) {
        continue;
      }

      const [rawPath = "", rawAnchor] = target.split("#");
      const targetPath = rawPath;

      if (targetPath === "" && rawAnchor !== undefined) {
        if (rawAnchor !== "" && !documentFor(file).anchors.has(rawAnchor)) {
          findings.push({ file: source, line: link.line, target });
        }
        continue;
      }
      if (targetPath === "") {
        findings.push({ file: source, line: link.line, target });
        continue;
      }

      let decoded;
      try {
        decoded = decodeURI(targetPath);
      } catch {
        findings.push({ file: source, line: link.line, target });
        continue;
      }

      const resolved = path.resolve(path.dirname(file), decoded);
      if (!existsSync(resolved)) {
        findings.push({ file: source, line: link.line, target });
        continue;
      }

      if (
        rawAnchor !== undefined &&
        rawAnchor !== "" &&
        resolved.toLowerCase().endsWith(".md") &&
        !documentFor(resolved).anchors.has(rawAnchor)
      ) {
        findings.push({ file: source, line: link.line, target });
      }
    }
  }

  return findings;
}
