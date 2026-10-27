# Spec (A2)

> Station S1 · Gate G1 · Each acceptance criterion is observable and has a tier of test.
> Version 2 · Owner Siergus · 2026-10-27
>
> v2: the pack list gains `scripts/ci/lib/*.mjs` (+ `package-lock.json` for `npm ci`
> in the artifact? no — the artifact is dependency-free). The local pack dry-run
> (A4 step 3) proved `dist/cli.js` cannot run standalone without the shared engines
> it imports. The archive therefore mirrors the repo layout it needs:
> `dist/**` + `scripts/ci/lib/**` + `package.json` + `README.md`.

## Problem being solved

Nothing in the factory produces a versioned, checksummed, re-downloadable artifact. This
slice stands up the deployment lane's first gate (G6a, artifact.immutability) as a real,
observed workflow, sized so a future production deployment inherits the mechanism.

## Design

A new workflow, `.github/workflows/release.yml` (separate from the fast lane; triggers
only on `v*` tag pushes):

1. **Build** — clean checkout at the tag, `npm ci` (pinned lockfile), `npm run build`
   (the same G4a step). A deliberate decision, recorded: the release job runs `npm test`
   only and does NOT re-run the full lane — the lane already greened the PR that produced
   the tag, and re-running it on a duplicated checkout cannot strengthen that evidence;
   `npm test` is enough to fail-loud on a broken tree, and it keeps the runner small.
2. **Pack** — assemble `factory-cli-v<version>` archive: `dist/**` +
   `scripts/ci/lib/*.mjs` (v2: the shared engines the CLI imports at runtime; the
   pack dry-run proved the artifact is not self-contained without them —
   `dist/cli.js` imports `../scripts/ci/lib/*.mjs`, and the packed layout preserves
   every relative specifier, including the engines' own `../../../dist/tiers.js`)
   + `package.json` (name/version/bin) + `README.md` (the repo has no LICENSE file;
   one is added by a later slice before any third-party distribution decision).
   Contents list fixed in the workflow; no `node_modules`, no secrets, no git history.
   The `bin` value in
   `package.json` (`factory` → `dist/cli.js`) is this slice's only product-facing
   contract, added as glue for the artifact.
3. **Checksum** — `SHA256SUMS` for the archive.
4. **Attach** — GitHub Release created **for the tag** with the two files as assets
   (release notes from the CHANGELOG section of that version; falls back to a pointer
   if not found).

Gates / statuses:

- `G6a` flips `n/a` → `wired` in `factory.config.json` **only after** an observed run in
  A5 (the 0005 lesson: statuses follow observations, not intentions). The slice-0004
  config-status check must be extended first: its `WIRED_GATE_EVIDENCE` table only knows
  fast-lane evidence (wrapper files + `fast.mjs` rows), so it gains a release-lane
  evidence shape (e.g. `workflow` entries checked against the release workflow file's
  step names) — wired-but-unverifiable must stay impossible.
- G6b (config.validate), G6c (rollback), G6d (flag.control), G6e (observe) stay `n/a`
  with recorded reasons — no runtime to validate, no instance to roll back, no flags, no
  traffic.
- Rollback semantics for artifacts: the previous release remains downloadable and
  byte-identical; "roll back" = re-reference the previous release; no automation (that
  would be G6c graduation when real consumers exist).

Immutability promise: the tag is created by the owner on merged main; CI never moves
tags; the release assets are never re-uploaded (re-runs produce a distinct draft or
fail loudly on pre-existing assets).

## Acceptance criteria

| AC | Statement | Tier of test |
| --- | --- | --- |
| AC-1 | A `v*` tag push produces a workflow run that builds dist from a clean checkout and exits 0 | manual → observed (CI URL in A5) |
| AC-2 | The release contains exactly the archive + SHA256SUMS, contents per the workflow list (no node_modules, no git info) | manual → observed (asset list in A5) |
| AC-3 | `SHA256SUMS` recomputed locally against the downloaded archive matches the uploaded checksum | isolated + manual |
| AC-4 | Re-downloaded archive bytes equal the local pack (immutability spot check) | manual |
| AC-5 | The archive runs: unpack on a clean machine-like path and invoke `factory status`/`factory check` once (Node 24 available), sane output, exit 0 | isolated + manual |
| AC-6 | `factory.config.json` G6a is `wired` + `smokeTested: true` only after AC-1..AC-5 are recorded in A5; G6b–G6e remain `n/a` with notes naming the reason; the 0004 evidence-table check passes with the new release-lane evidence shape (a wired gate with only unwired-style evidence still fails) | isolated (config test guards form) |
| AC-7 | v0.4.0 release cut lands with the slice (CHANGELOG, `factoryVersion`, package.json three-way) | isolated |
| AC-8 | No change to the fast lane; the fast lane on the PR still passes (release lane is additive) | command |

## Non-criteria

- Platform matrix (Windows-asset bundling); single Linux builder, Node-consumer package.
- npm publish (owner decision recorded in the backlog roadmap context).
- Automated release notes beyond the CHANGELOG mirror; any richer changelog is a later slice.
- SBOM/signing: noted as out of scope; revisit at the first production deployment tier.

## Open questions

None blocking. The archive contents/extension (`factory-cli-v<version>.zip`,
zip for Windows-friendly unzipping) are recorded choices, revisable by a v2 amendment
if the 0006 review prefers tarballs.
