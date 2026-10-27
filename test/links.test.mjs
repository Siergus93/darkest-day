import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { checkLinks } from "../scripts/ci/lib/links.mjs";

function withTempTree(run) {
  const root = mkdtempSync(path.join(tmpdir(), "factory-links-"));
  try {
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("existing relative links pass and missing ones are reported", () => {
  withTempTree((root) => {
    mkdirSync(path.join(root, "docs"));
    writeFileSync(path.join(root, "docs", "target.md"), "# Target\n", "utf8");
    writeFileSync(
      path.join(root, "docs", "source.md"),
      "# Source\n\n[ok](./target.md)\n[bad](./missing.md)\n[external](https://example.com)\n",
      "utf8",
    );

    const findings = checkLinks(root);
    assert.equal(findings.length, 1);
    assert.deepEqual(findings[0], {
      file: "docs/source.md",
      line: 4,
      target: "./missing.md",
    });
  });
});

test("links inside fenced code blocks are ignored", () => {
  withTempTree((root) => {
    writeFileSync(
      path.join(root, "guide.md"),
      "# Guide\n\n```md\n[example](./not-real.md)\n```\n",
      "utf8",
    );

    assert.deepEqual(checkLinks(root), []);
  });
});

test("reference-style definitions are checked", () => {
  withTempTree((root) => {
    writeFileSync(
      path.join(root, "guide.md"),
      "# Guide\n\nSee [the target][target] and [the gap][gap].\n\n" +
        "[target]: ./target.md\n[gap]: ./missing.md\n",
      "utf8",
    );
    writeFileSync(path.join(root, "target.md"), "# Target\n", "utf8");

    const findings = checkLinks(root);
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.target, "./missing.md");
  });
});

test("fragments resolve against headings", () => {
  withTempTree((root) => {
    writeFileSync(
      path.join(root, "doc.md"),
      "# Top\n\n## A real heading\n\n[ok](#a-real-heading)\n[bad](#no-such-heading)\n",
      "utf8",
    );

    const findings = checkLinks(root);
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.target, "#no-such-heading");
  });
});

test("line numbers stay accurate after a fenced code block", () => {
  withTempTree((root) => {
    writeFileSync(
      path.join(root, "doc.md"),
      "# Top\n\n```md\n[example](./not-real.md)\n```\n\n[bad](./missing.md)\n",
      "utf8",
    );

    const findings = checkLinks(root);
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.line, 7);
    assert.equal(findings[0]?.target, "./missing.md");
  });
});

test("malformed percent-encoding is reported instead of crashing", () => {
  withTempTree((root) => {
    writeFileSync(path.join(root, "doc.md"), "# Top\n\n[bad](%)\n", "utf8");

    const findings = checkLinks(root);
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.target, "%");
  });
});

test("a bare fragment points at the current document and is valid", () => {
  withTempTree((root) => {
    writeFileSync(path.join(root, "doc.md"), "# Top\n\n[top](#)\n", "utf8");

    assert.deepEqual(checkLinks(root), []);
  });
});
