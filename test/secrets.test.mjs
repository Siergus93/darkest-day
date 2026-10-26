import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { scanSecrets } from "../scripts/ci/lib/secrets.mjs";

function withTempTree(run) {
  const root = mkdtempSync(path.join(tmpdir(), "factory-secrets-"));
  try {
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("a credential-shaped value is reported with file and line, without the value", () => {
  withTempTree((root) => {
    const fakeAwsKey = ["AKIA", "IOSFODNN7", "EXAMPLE"].join("");
    writeFileSync(path.join(root, "creds.txt"), `aws_access_key_id = ${fakeAwsKey}\n`, "utf8");

    const findings = scanSecrets(root);
    assert.equal(findings.length, 1);
    assert.deepEqual(findings[0], {
      file: "creds.txt",
      line: 1,
      rule: "aws-access-key",
      description: "AWS access key id",
    });
    assert.equal(JSON.stringify(findings).includes(fakeAwsKey), false);
  });
});

test("a private key block is detected", () => {
  withTempTree((root) => {
    const header = ["-----BEGIN", " OPENSSH ", "PRIVATE KEY-----"].join("");
    writeFileSync(path.join(root, "id_key"), `${header}\nbody\n`, "utf8");

    const findings = scanSecrets(root);
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.rule, "private-key");
  });
});

test("a marker does not suppress a finding", () => {
  withTempTree((root) => {
    const fakeToken = ["ghp", "_", "a".repeat(36)].join("");
    writeFileSync(
      path.join(root, "fixture.txt"),
      `token = ${fakeToken} secret-scan:allow\n`,
      "utf8",
    );

    const findings = scanSecrets(root);
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.rule, "github-token");
  });
});

test("a clean tree produces no findings", () => {
  withTempTree((root) => {
    writeFileSync(path.join(root, "notes.md"), "No credentials here.\n", "utf8");
    assert.deepEqual(scanSecrets(root), []);
  });
});
