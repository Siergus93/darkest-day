import { repoRoot } from "./config.mjs";
import { readTextFile, relativePath, walkFiles } from "./files.mjs";

/**
 * Secrets ruleset.
 *
 * This is a repository-owned first line of defence, not a substitute for a
 * maintained scanner. Rules are deliberately narrow to keep false positives
 * near zero; add a rule when a real leak type is named, not speculatively.
 */
export const SECRET_RULES = [
  {
    id: "aws-access-key",
    description: "AWS access key id",
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    id: "github-token",
    description: "GitHub token",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g,
  },
  {
    id: "github-fine-grained-token",
    description: "GitHub fine-grained token",
    pattern: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g,
  },
  {
    id: "private-key",
    description: "Private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
  },
  {
    id: "slack-token",
    description: "Slack token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    id: "google-api-key",
    description: "Google API key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    id: "stripe-live-key",
    description: "Stripe live key",
    pattern: /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}\b/g,
  },
  {
    id: "connection-string",
    description: "Connection string with embedded credentials",
    pattern: /\b(?:postgres|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s/]+:[^@\s/]+@/g,
  },
  {
    id: "assigned-credential",
    description: "Assigned credential-like value",
    pattern:
      /\b(?:api[_-]?key|apikey|secret|token|password|passwd)\s*[:=]\s*['"][A-Za-z0-9_\-./+=]{16,}['"]/gi,
  },
];

/** Scan a tree and return findings without ever returning the matched value. */
export function scanSecrets(root = repoRoot) {
  const findings = [];

  for (const file of walkFiles(root)) {
    const text = readTextFile(file);
    if (text === null) {
      continue;
    }

    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const rule of SECRET_RULES) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(line)) {
          findings.push({
            file: relativePath(root, file),
            line: index + 1,
            rule: rule.id,
            description: rule.description,
          });
          break;
        }
      }
    }
  }

  return findings;
}

export function formatFinding(finding) {
  return `${finding.file}:${finding.line} [${finding.rule}] ${finding.description}`;
}
