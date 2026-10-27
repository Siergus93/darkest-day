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
| AC-1 tag push → observed green run | PASS | owner pushed tag `v0.4.0` (commit `6a83203` = main HEAD); run **40574701583** green, all 13 steps ✔: https://github.com/Siergus93/darkest-day/actions/runs/40574701583 (workflow log prints `tag: v0.4.0`, `commit: 6a83203ed45e25a91d0496ad924a073429509c18`) |
| AC-2 asset list = archive + SHA256SUMS | PASS | `gh release view v0.4.0` → exactly 2 assets: `factory-cli-v0.4.0.zip` (20832 bytes) + `SHA256SUMS` (89 bytes); unpacked tree matches the A2 v2 pack list (`dist/cli.js`, `dist/tiers.js`, 10 engine `.mjs` files, `package.json`, `README.md`); no `node_modules`, no git info |
| AC-3 checksum recompute matches | PASS | downloaded asset recomputed locally: `b16349c7839d4ce6169adbd1a6423bee61006f0780a072a76a01d30ea4a035bb` == `SHA256SUMS` line `b16349c7839d4ce6169adbd1a6423bee61006f0780a072a76a01d30ea4a035bb  factory-cli-v0.4.0.zip` |
| AC-4 re-download byte-compare | PASS | second independent download hash: `b16349c7839d4ce6…` — byte-identical to the first download and to `SHA256SUMS` |
| AC-5 unpacked artifact runs | PASS | unpacked the RELEASED asset; run against a consumer-style fixture checkout (own `factory.config.json` + A4 + git): `status` → `factory 0.4.0`, gate catalog, **exit 0**; `check --base HEAD` → `change set: docs/n.md`, `factory check: PASS, T1`, **exit 0** |
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

- ~~AC-1..AC-4 are structurally pending on the owner's tag push~~ **resolved**: the
  owner cut `v0.4.0` on merged main; all five observation ACs are now verified above.
- ~~The G6a `wired` flip is a follow-up commit~~ **resolved**: flipped in this commit
  together with the `WIRED_GATE_EVIDENCE` row and the G6b–G6e stay-`n/a` reasons.
- The release workflow executed successfully on its first real run (v0.4.0). The
  create/upload split between two `gh` calls remains a sharp edge: a failure between
  them leaves a release without assets, and a re-run fails loudly by design.
- The zip is not byte-reproducible across builds (archive timestamps); not a defect
  for the immutability promise. `SOURCE_DATE_EPOCH`-style reproducibility is a
  recorded follow-up.
- CI annotations on the v0.4.0 run: Node-20 deprecation warnings for the pinned
  `actions/checkout`/`actions/setup-node` (they run on Node 24 regardless) and a
  transient cache save/restore failure — both non-blocking, recorded here for
  completeness.
