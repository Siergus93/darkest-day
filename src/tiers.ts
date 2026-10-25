/**
 * Tier resolution for the Darkest Day factory.
 *
 * Factory-level logic: no tool, language, or pipeline names appear here.
 * The tier a slice must satisfy is the maximum of its declared tier and the
 * escalation demanded by every protected path it touches.
 */

export const TIERS = ["T0", "T1", "T2", "T3"] as const;

export type Tier = (typeof TIERS)[number];

export interface ProtectedPath {
  /** Glob relative to the repository root, using forward slashes. */
  pattern: string;
  /** Tier the slice is escalated to when this path is touched. */
  escalateTo: Tier;
  /** Accountable owner for the protection, not for the slice. */
  owner: string;
}

export interface TierEscalation {
  path: string;
  pattern: string;
  escalateTo: Tier;
}

export interface TierResolution {
  /** Tier the slice must satisfy after escalation. */
  required: Tier;
  /** Tier written in the slice plan. */
  declared: Tier;
  escalations: TierEscalation[];
}

export class TierDowngradeError extends Error {
  constructor(required: Tier, declared: Tier) {
    super(
      `Declared tier ${declared} is below the required tier ${required} and no written reason was supplied. ` +
        "Record the downgrade reason in the slice plan or raise the tier.",
    );
    this.name = "TierDowngradeError";
  }
}

export function isTier(value: string): value is Tier {
  return (TIERS as readonly string[]).includes(value);
}

export function tierRank(tier: Tier): number {
  return TIERS.indexOf(tier);
}

export function maxTier(left: Tier, right: Tier): Tier {
  return tierRank(left) >= tierRank(right) ? left : right;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Match a repository-relative path against a glob.
 *
 * Supported syntax is deliberately small:
 *   `**`  any number of path segments
 *   `*`   any characters inside one segment
 *   `?`   one character inside one segment
 */
export function matchesGlob(path: string, pattern: string): boolean {
  const normalizedPath = path.replaceAll("\\", "/").replace(/^\.\//, "");
  const normalizedPattern = pattern.replaceAll("\\", "/").replace(/^\.\//, "");

  let expression = "^";
  for (let index = 0; index < normalizedPattern.length; index += 1) {
    const character = normalizedPattern[index];
    if (character === "*") {
      if (normalizedPattern[index + 1] === "*") {
        index += 1;
        if (normalizedPattern[index + 1] === "/") {
          index += 1;
          expression += "(?:.*/)?";
        } else {
          expression += ".*";
        }
      } else {
        expression += "[^/]*";
      }
    } else if (character === "?") {
      expression += "[^/]";
    } else {
      expression += escapeRegExp(character ?? "");
    }
  }
  expression += "$";

  return new RegExp(expression).test(normalizedPath);
}

/** Resolve the tier a slice must satisfy, including protected-path escalation. */
export function resolveTier(
  declared: Tier,
  changedPaths: readonly string[],
  protectedPaths: readonly ProtectedPath[],
): TierResolution {
  const escalations: TierEscalation[] = [];

  for (const path of changedPaths) {
    for (const protection of protectedPaths) {
      if (matchesGlob(path, protection.pattern)) {
        escalations.push({
          path,
          pattern: protection.pattern,
          escalateTo: protection.escalateTo,
        });
      }
    }
  }

  const required = escalations.reduce<Tier>(
    (tier, escalation) => maxTier(tier, escalation.escalateTo),
    declared,
  );

  return { required, declared, escalations };
}

/**
 * Validate the tier written in a slice plan.
 *
 * Lowering a tier is allowed only with a written reason; silently shipping
 * below the required tier is not.
 */
export function applyDeclaredTier(
  required: Tier,
  declared: Tier,
  reason: string | undefined,
): Tier {
  if (tierRank(declared) >= tierRank(required)) {
    return declared;
  }
  if (reason === undefined || reason.trim() === "") {
    throw new TierDowngradeError(required, declared);
  }
  return declared;
}
