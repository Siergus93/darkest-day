// Local ESLint rule for the factory's G4b SAST pack (added by slice 0005).
//
// Coverage decision (ADR-0004 amendment, 2026-10-27): `security/detect-child-process`
// fires only on non-literal command first arguments — an injected
// `child_process.exec("node --version")` sailed through the gate as PASS (0003, smoke 3).
// No stock rule in eslint-plugin-security (up to 4.2.0) or the SDL plugin exists with
// this signature, so this rule closes the literal-argument side.
//
// Flags a call when BOTH:
//   - the callee resolves to a child_process exec-family method
//     (exec, execFile, execSync, execFileSync), via either
//       * a member-expression call on any object (cp.exec, child_process.execFile,
//         require("child_process").exec), or
//       * a bare identifier that resolves to an import or require-destructure of
//         child_process; and
//   - the first argument is a raw command string: a literal, or any template
//     literal (a template with statically-known parts is effectively literal
//     and escapes security/detect-child-process).
//
// Out of scope, deliberately: `spawn`/`spawnSync` with argument arrays (the repo's
// only child_process usage, and the sanctioned pattern); bare `exec("...")`
// identifiers not resolving to child_process (a repo-local helper may have its own
// semantics — tightening that needs a different decision). Together with
// `security/detect-child-process` (non-literal), the exec family is covered on both
// shapes.

const EXEC_FAMILY = new Set(["exec", "execFile", "execSync", "execFileSync"]);
const CHILD_PROCESS_MODULES = new Set(["node:child_process", "child_process"]);

function isStaticFirstArgument(node) {
  // Templates count as needing justification regardless of interpolation:
  // `exec(`a ${c} b`)` with a statically-known `c` is effectively literal and
  // escapes security/detect-child-process (which treats statically-known
  // interpolations as static and stays silent); with a dynamic `c` the
  // non-literal rule already flags it. Binary string concatenation is out of
  // scope of this rule; when both operands are statically known statically it
  // escapes the non-literal rule the same way today — the edge pre-exists and
  // is recorded in ADR-0004.
  return node.arguments[0].type === "Literal" || node.arguments[0].type === "TemplateLiteral";
}

/**
 * Returns the imported exec-family method name when the bare identifier is a
 * local alias (or the same name) for a child_process import, or null.
 * Import aliases matter: `import { exec as e }` must not bypass the ban.
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
          for (const specifier of declaration.specifiers ?? []) {
            if (specifier.local?.name === identifier.name) {
              const importedName = specifier.imported?.name;
              if (importedName && EXEC_FAMILY.has(importedName)) {
                return importedName;
              }
            }
          }
        }
        if (def.type === "Variable") {
          const init = def.node?.init;
          if (
            init?.type === "CallExpression" &&
            init.callee?.type === "Identifier" &&
            init.callee.name === "require" &&
            init.arguments[0]?.type === "Literal" &&
            CHILD_PROCESS_MODULES.has(init.arguments[0].value)
          ) {
            if (def.node.id?.type === "Identifier" && EXEC_FAMILY.has(def.node.id.name)) {
              return def.node.id.name;
            }
            if (def.node.id?.type === "ObjectPattern") {
              for (const property of def.node.id.properties ?? []) {
                if (
                  property.type === "Property" &&
                  property.value?.type === "Identifier" &&
                  property.value.name === identifier.name &&
                  !property.computed &&
                  property.key?.type === "Identifier" &&
                  EXEC_FAMILY.has(property.key.name)
                ) {
                  return property.key.name;
                }
              }
            }
          }
        }
      }
    }
  }
  return null;
}

const literalCommandExec = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Flags child_process exec-family calls (exec, execFile, execSync, execFileSync) " +
        "whose first argument is a raw command string (literal or template literal). " +
        "Pairs with security/detect-child-process, which covers non-literal first " +
        "arguments only.",
      recommended: true,
    },
  },
  create(context) {
    function report(node, methodName) {
      context.report({
        node,
        message:
          "Factory SAST: literal command execution via " +
          `child_process.${methodName}() is banned; use spawn/spawnSync with an ` +
          "argument array instead.",
      });
    }
    return {
      CallExpression(node) {
        if (node.arguments.length === 0 || !isStaticFirstArgument(node)) {
          return;
        }
        const callee = node.callee;
        if (callee.type === "MemberExpression" && callee.computed !== true) {
          if (callee.property?.type === "Identifier" && EXEC_FAMILY.has(callee.property.name)) {
            report(node, callee.property.name);
          }
          return;
        }
        if (callee.type === "Identifier") {
          // For bare identifiers the local name may be an import alias, so
          // the family membership is decided by the imported name, not by the
          // identifier itself.
          const importedName = resolveChildProcessExecBinding(context, callee);
          if (importedName) {
            report(node, importedName);
          }
        }
      },
    };
  },
};

export default { rules: { "literal-command-exec": literalCommandExec } };
