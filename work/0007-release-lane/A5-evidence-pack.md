# Evidence pack (A5)

> Station S4 · Gate G5a · Every AC maps to reproducible evidence. An agent summary
> is not evidence; a gate passes only on output a reviewer can reproduce.

| Field | Value |
| --- | --- |
| Slice | [0007 — Deployment lane: immutable release artifacts on tag](A4-slice-plan.md) |
| Spec | [A2](A2-spec.md) v2 (v2: pack list gains the shared engines — probe finding, below) |
| Slice plan | [A4](A4-slice-plan.md) v2 (v2: paths glob corrected, caught by G4f) |
| Verified by | drafting agent (self-verification; fresh-context verification pending) |
| Date | 2026-10-27 |
| Status flip | G6a is still `n/a` in this PR, by design: it flips to `wired` + `smokeTested: true` only after the owner cuts the tag and the run is observed (follow-up commit) |

## Probe findings that changed the artifacts (A4 step 3 working as intended)

1. **The packed CLI was not self-contained.** The local pack dry-run proved
   `dist/cli.js` imports the shared engines (`../scripts/ci/lib/*.mjs`) at runtime;
   the A2 v1 pack list omitted them. A2 amended to v2: the archive mirrors the repo
   layout it needs (`dist/**` + `scripts/ci/lib/*.mjs` + `package.json` + `README.md`),
   preserving every relative specifier including the engines' `../../../dist/tiers.js`.
2. **The A4 glob `work/0007/**` never matched `work/0007-release-lane/**`** (literal
   slash after `0007`). Caught by G4f on the first full lane run; A4 amended to v2.
3. **The zip is not byte-reproducible across builds** (repack changed the hash:
   `22b9a78…` vs `54a58e7…` — archive timestamps). Not a defect for the immutability
   promise: verification recomputes against the `SHA256SUMS` uploaded *with* the
   release. Byte-reproducible archives (`SOURCE_DATE_EPOCH`) are a recorded
   follow-up, out of scope.
4. **The evidence table extension could not ship with the G6a row**: the 0004
   set-equality test treats a table entry without `status: "wired"` as stale, and the
   status flip must wait for the observed run. The PR ships the *mechanism*
   (workflow evidence shape + synthetic-fixture test); the G6a row lands with the
   flip commit.

## AC-to-evidence map

| AC | Result | Evidence |
| --- | --- | --- |
| AC-1 tag push → observed green run | PENDING | the tag is cut by the OWNER on merged main (A2 constraint); run URL to be appended after `v0.4.0` is pushed |
| AC-2 asset list = archive + SHA256SUMS | PENDING | observed on the release after the tag; the workflow's pack + upload steps pin the list |
| AC-3 checksum recompute matches | rehearsed | method verified locally: `Get-FileHash -Algorithm SHA256` of the packed zip vs `SHA256SUMS` line (see probe finding 3 for the repack caveat); to be repeated against the downloaded release asset |
| AC-4 re-download byte-compare | PENDING | after the release; the workflow prints the commit SHA it built, recorded here with the checksum |
| AC-5 unpacked artifact runs | PASS (rehearsal) | packed per the workflow list, unpacked to a clean temp dir, run against a consumer-style fixture checkout: `status` → `factory 0.4.0`, `active slice: work/0001-test`, gate catalog, **exit 0**; `check --base HEAD` → `change set: docs/note.md`, `Slice work/0001-test: declared T1, required T1, 1 changed path(s).`, `factory check: PASS, T1`, **exit 0**; failure paths fail loudly (`Cannot read factory.config.json` on a non-factory cwd; `No changed paths were found` on an empty change set; `A4 must declare a tier…` on a malformed plan) |
| AC-6 G6a wired only post-observation; G6b–G6e n/a | PASS (form) | `test/config.test.mjs`: the workflow evidence shape is proven on a synthetic fixture ("the workflow evidence shape passes on a matching fixture and fails on drift" ✔); the set-equality test enforces that the G6a table row and the `wired` status land in the same commit; G6b–G6e remain `n/a` |
| AC-7 v0.4.0 three-way version chain | PASS | `npm test` → 67/67, including "factoryVersion matches the newest released CHANGELOG section and package.json" (0.4.0 == 0.4.0 == [0.4.0]) and "activeSlice names an existing slice directory with an A4 plan" |
| AC-8 fast lane unaffected, green | PASS | `npm run fast -- --base 4631113` → **Fast lane PASSED in 25.8s**, 12/12 gate rows PASS, 67/67 tests; the fast workflow file is untouched by this diff |

## Pack-list dry-run (verbatim, PowerShell rehearsal of the workflow steps)

```
$ npm run build; $v = "0.4.0"
$ New-Item -ItemType Directory "pack/factory-cli-v$v/scripts/ci/lib"
$ Copy-Item -Recurse dist "pack/factory-cli-v$v/"
$ Copy-Item scripts/ci/lib/*.mjs "pack/factory-cli-v$v/scripts/ci/lib/"
$ Copy-Item package.json, README.md "pack/factory-cli-v$v/"
$ Compress-Archive -Path "pack\factory-cli-v$v" -DestinationPath "factory-cli-v$v.zip"
$ Expand-Archive "factory-cli-v0.4.0.zip" -DestinationPath <temp>
packed tree:
  factory-cli-v0.4.0/package.json
  factory-cli-v0.4.0/README.md
  factory-cli-v0.4.0/dist/cli.js
  factory-cli-v0.4.0/dist/tiers.js
  factory-cli-v0.4.0/scripts/ci/lib/{blast-radius,config,engines,files,format-lint,
    links,run,sast,secrets-history,secrets}.mjs
$ node <unpacked>\dist\cli.js status        → factory 0.4.0 …  exit 0
$ node <unpacked>\dist\cli.js check --base HEAD → factory check: PASS, T1  exit 0
```

(Compress-Archive omits the `pack/` prefix that the workflow's `zip -r … pack`
keeps; the contents list is what this smoke verifies.)

## Residual risks / notes for the fresh-context verifier

- AC-1..AC-4 are **structurally pending** on the owner's tag push — this is the A2's
  declared process (owner cuts the release), not a gap. This PR must merge first.
- The G6a `wired` + `smokeTested: true` flip is a follow-up commit that must include
  the `WIRED_GATE_EVIDENCE` G6a row; the config test will refuse any other order.
- The release workflow has never executed; its first run is the v0.4.0 tag. Known
  sharp edge: `gh release create --verify-tag` requires the tag to be a real repo
  tag (it is, by trigger); asset upload happens in a second `gh` call, so a failure
  between create and upload leaves a release without assets — a re-run then fails
  loudly on the pre-existing release (the immutability guard working, at the cost of
  manual recovery: delete the empty release and re-tag or re-run).
