// Local ESLint rule for the factory's G4b SAST pack (slice 0005).
//
// Coverage decision (ADR-0004 amendment, 2026-10-27, updated after the fresh-context
// verification found escape shapes — see "Amendment 2026-10-27 (slice 0005)"): the
// child_process exec family (exec, execFile, execSync, execFileSync) is BANNED
// UNCONDITIONALLY. The fresh-context verifier of slice 0005 falsified the narrower
// "raw-command" version with three shapes that escaped both this rule and
// security/detect-child-process (top-level `await import()` destructure, computed
// member access `cp["exec"](…)`, and non-`exec` family methods with dynamic args), so
// the gate does not attempt to classify arguments at all: any resolved exec-family
// call fails. `spawn`/`spawnSync` with an argument array is the sanctioned pattern and
// the repo's only child_process usage, so there is no legitimate exec-family call to
// support — and argument-classification edges (static-string concatenation,
// dynamic-import resolution) cannot silently reopen the ban.
//
// Resolving "exec-family call":
//   - member access on any object, computed or not: cp.exec(…), cp["exec"](…),
//     require("node:child_process").exec(…);
//   - a bare identifier resolving to an import (including named aliases:
//     `import { exec as e }`), a require-destructure, or an
//     `await import("node:child_process")` destructure of an exec-family method.
//
// `security/detect-child-process` stays in the pack as an independent second opinion
// over static import declarations and `require()` for non-literal first arguments.

const EXEC_FAMILY = new Set(["exec", "execFile", "execSync", "execFileSync"]);
const CHILD_PROCESS_MODULES = new Set(["node:child_process", "child_process"]);

function memberReportsExecFamily(node) {
  if (node.type !== "MemberExpression") {
    return null;
  }
  if (node.computed) {
    if (node.property?.type === "Literal" && EXEC_FAMILY.has(node.property.value)) {
      return node.property.value;
    }
    return null;
  }
  if (node.property?.type === "Identifier" && EXEC_FAMILY.has(node.property.name)) {
    return node.property.name;
  }
  return null;
}

/**
 * Returns the exec-family method name when the bare identifier is a local binding
 * (import, import alias, require-destructure, or `await import()` destructure) of a
 * child_process exec-family method, or null otherwise.
 */
function resolveChildProcessExecBinding(context, identifier) {
  const sourceCode = context.sourceCode || context.getSourceCode();
  const startingScope = sourceCode.getScope ? sourceCode.getScope(identifier) : context.getScope();
  for (let scope = startingScope; scope !== null; scope = scope.upper) {
    for (const variable of scope.variables) {
      if (variable.name !== identifier.name) {
        continue;
      }
      for (const def of variable.defs) {
        if (def.type === "ImportBinding") {
          const declaration = def.parent;
          const importedName = specifierOf(declaration, identifier.name);
          if (importedName && EXEC_FAMILY.has(importedName)) {
            return importedName;
          }
        }
        if (def.type === "Variable" && def.node?.id) {
          const init = def.node.init;
          const source = staticModuleSource(init);
          if (!source) {
            continue;
          }
          const importedName = patternImportsName(def.node.id, identifier.name);
          if (importedName && EXEC_FAMILY.has(importedName)) {
            return importedName;
          }
        }
      }
    }
  }
  return null;
}

/** The module source of a `require("…")` / `await import("…")` init, or null. */
function staticModuleSource(init) {
  if (
    init?.type === "CallExpression" &&
    init.callee?.type === "Identifier" &&
    init.callee.name === "require"
  ) {
    const arg = init.arguments[0];
    return arg?.type === "Literal" && CHILD_PROCESS_MODULES.has(arg.value) ? init : null;
  }
  if (init?.type === "AwaitExpression") {
    const awaited = init.argument;
    const arg = awaited?.type === "ImportExpression" ? awaited.source : null;
    return arg?.type === "Literal" && CHILD_PROCESS_MODULES.has(arg.value) ? init : null;
  }
  return null;
}

/** The imported method name bound to `localName` by an import declaration. */
function specifierOf(declaration, localName) {
  for (const specifier of declaration?.specifiers ?? []) {
    if (specifier.local?.name === localName) {
      return specifier.imported?.name;
    }
  }
  return null;
}

/** The imported method name bound to `localName` by an object/destructure pattern. */
function patternImportsName(pattern, localName) {
  for (const property of pattern?.properties ?? []) {
    if (
      property.type === "Property" &&
      !property.computed &&
      property.value?.type === "Identifier" &&
      property.value.name === localName &&
      property.key?.type === "Identifier"
    ) {
      return property.key.name;
    }
  }
  return null;
}

const literalCommandExec = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Bans child_process exec-family calls (exec, execFile, execSync, execFileSync) " +
        "unconditionally — argument classification cannot cover every shape safely " +
        "(see ADR-0004 amendment, slice 0005). Use spawn/spawnSync with an argument " +
        "array instead.",
      recommended: true,
    },
  },
  create(context) {
    function report(node, methodName) {
      context.report({
        node,
        message:
          "Factory SAST: child_process." +
          `${methodName}()` +
          " is banned; command shape cannot be classified safely at analysis time " +
          "and literal command execution is part of the banned class — use " +
          "spawn/spawnSync with an argument array instead (ADR-0004 amendment).",
      });
    }
    return {
      CallExpression(node) {
        if (node.callee.type === "MemberExpression") {
          const methodName = memberReportsExecFamily(node.callee);
          if (methodName) {
            report(node, methodName);
          }
          return;
        }
        if (node.callee.type === "Identifier") {
          const importedName = resolveChildProcessExecBinding(context, node.callee);
          if (importedName) {
            report(node, importedName);
          }
        }
      },
    };
  },
};

export default { rules: { "literal-command-exec": literalCommandExec } };
