import { test } from "node:test";
import assert from "node:assert/strict";

import { healProvenance } from "./engine-heal.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-heal — THE HEAL that unfreezes brains installed before v5.0.0
// (plan S7 of v5-unfreezes-the-existing-fleet-action.md).
//
// The whole fleet is frozen: `CLAUDE.engine.md` was in NO regime at any published
// tag, so no deployed brain has provenance for it, and `mergeVerdict` answers
// `preserve/no-provenance` — forever. The bytes of the ancestor are sitting on the
// disk; only the PROOF was missing.
//
// This module supplies the proof, and it does it at the ONE place that heals every
// consumer at once: the `recorded` INPUT. `mergeVerdict` short-circuits on
// `!recorded` BEFORE `verifyBase` is ever called (engine-merge.mjs:59), so teaching
// `verifyBase` a second source would have healed nothing on the merge path. Hand it
// a `recorded` the brain can prove instead, and rows 4-6 of that table do the right
// thing untouched.
//
// 🛑 THE PROOF IS MEMBERSHIP, NOT ARITHMETIC. The sha recorded for a healed file is
// the one the engine ACTUALLY SHIPPED, looked up in a generated table of every
// version ever published. It is recognised, never invented — and that is the only
// thing standing between this module and silently telling the engine that an
// owner's edited file is untouched.
//
// Fixtures: every sha256 below was computed OUTSIDE this codebase (`shasum -a 256`),
// never through `fingerprint()`, so "the proof holds" cannot be true by construction.
// ═══════════════════════════════════════════════════════════════════════════

const EN_V1 = "doctrine v1\n";
const EN_V2 = "doctrine v2\n";
const FR_V1 = "doctrine fr v1\n";
const LF = "line one\nline two\n";
const CRLF = "line one\r\nline two\r\n";
const EDITED = "the owner own words\n";
const CURRENT = "engine current\n";

const SHA_EN_V1 = "sha256:6e7efd84e8eb4690ebf26d2d8bd03db7e54e741fe6fbcbc30432293fa3923e14";
const SHA_EN_V2 = "sha256:a2689497ccae3a77a9d1a7cd3a23085c408b3c27e8889c89ddd3cc21d12024ab";
const SHA_FR_V1 = "sha256:f82adeb73589cb1cf6cf5805f1c8f29826093cba4a2ff13f6ffe4447d932cd5a";
const SHA_LF = "sha256:e9024f1a07d29d52ad3aa5e1a18e94db1f3a9fd32b89e39d47c472cd99071e13";
const SHA_CRLF = "sha256:6612d9c94c2da8d2544e1188348fc7baf717ffff1bacde51929a166404a41ffc";
const SHA_CURRENT = "sha256:207073f629516028c07bec0ff7404ed97b3ce51bce147a5d09e7c4fff113ac93";

const DOCTRINE = "CLAUDE.engine.md";
const COACH = ".claude/skills/coach/SKILL.md";
const RETIRED = ".claude/skills/tdd-discipline/SKILL.md";
const SCRIPT = "scripts/auto-commit.mjs";
const REPLACED = "rag/src/index.ts";

const MANIFEST = {
  regimes: {
    merge: [DOCTRINE, ".claude/skills/coach/**", ".claude/skills/tdd-discipline/**", SCRIPT],
    replace: ["rag/src/**"],
  },
  retired: [".claude/skills/tdd-discipline/**"],
};

// Several versions for one rel, both locales for another, and two DECOYS whose
// digests match perfectly but whose rel must be refused: a retired skill and a
// `replace` file. A table lookup that forgets the regime gate passes every other
// test in this file and ships a heal for files the engine never merges.
const TABLE = {
  generatedAt: "v5.0.0",
  files: {
    [DOCTRINE]: {
      [SHA_EN_V1]: { since: "v3.6.0", locale: "en" },
      [SHA_EN_V2]: { since: "v4.9.1", locale: "en" },
      [SHA_FR_V1]: { since: "v3.6.0", locale: "fr" },
    },
    [COACH]: { [SHA_LF]: { since: "v3.0.0", locale: "en" } },
    [SCRIPT]: { [SHA_CURRENT]: { since: "v5.0.0", locale: "en" } },
    [RETIRED]: { [SHA_EN_V1]: { since: "v4.0.0", locale: "en" } },
    [REPLACED]: { [SHA_EN_V1]: { since: "v4.0.0", locale: "en" } },
  },
};

const heal = (installedFileMap, provenance = {}, table = TABLE) =>
  healProvenance({ manifest: MANIFEST, provenance, installedFileMap, table });

// ─── What it heals ───────────────────────────────────────────────────────────

// The whole object, because the three outputs have to AGREE: a provenance entry
// with no matching `healed` line would heal silently, and a `healed` line with no
// provenance entry would report a heal that did not happen.
test("an untouched file is recognised — the sha, the version it came from, and the report all land", () => {
  assert.deepEqual(heal({ [DOCTRINE]: EN_V1 }), {
    provenance: { [DOCTRINE]: SHA_EN_V1 },
    baseRefs: { [DOCTRINE]: "v3.6.0" },
    healed: [{ rel: DOCTRINE, since: "v3.6.0", locale: "en" }],
  });
});

// 🇫🇷 The test that decides whether the release heals the owner's OWN two brains,
// both French. A FR brain holds the bytes of `templates/fr/<rel>` AT `<rel>`, so the
// table is keyed by where the file LIVES and merely reports which locale it came
// from. An EN-only table recognises nothing here, and the measurement that found
// this is in the plan: `CLAUDE.engine.md` has 5 EN versions and 4 FR ones.
test("a FRENCH brain's bytes are recognised at the same rel, and the locale is reported", () => {
  assert.deepEqual(heal({ [DOCTRINE]: FR_V1 }), {
    provenance: { [DOCTRINE]: SHA_FR_V1 },
    baseRefs: { [DOCTRINE]: "v3.6.0" },
    healed: [{ rel: DOCTRINE, since: "v3.6.0", locale: "fr" }],
  });
});

// Triangulates the lookup against "return the first entry you find": three versions
// are on file for this rel and the SECOND one is the answer.
test("out of several versions shipped for one file, the one that matches is the one recorded", () => {
  assert.deepEqual(heal({ [DOCTRINE]: EN_V2 }), {
    provenance: { [DOCTRINE]: SHA_EN_V2 },
    baseRefs: { [DOCTRINE]: "v4.9.1" },
    healed: [{ rel: DOCTRINE, since: "v4.9.1", locale: "en" }],
  });
});

// A Windows checkout rewrites LF→CRLF with nobody touching a word. `verifyBase`
// forgives that (engine-base.mjs:50); if the heal does not, the entire Windows fleet
// stays frozen by the release that unfreezes everyone else.
//
// And it records the SHIPPED digest, not the digest of the bytes on disk: the
// recorded sha means "the engine published these bytes", and the engine never
// published the CRLF ones. `verifyBase` normalises before comparing, so the LF
// digest proves the CRLF file just as well — the reverse would record a digest that
// appears in no release.
test("a CRLF checkout is recognised, and what gets recorded is the digest the engine SHIPPED", () => {
  const healed = heal({ [COACH]: CRLF });
  assert.deepEqual(healed, {
    provenance: { [COACH]: SHA_LF },
    baseRefs: { [COACH]: "v3.0.0" },
    healed: [{ rel: COACH, since: "v3.0.0", locale: "en" }],
  });
  assert.notEqual(healed.provenance[COACH], SHA_CRLF, "never the digest of the bytes as they sit on disk");
});

// Row 2 of the merge table, the inherited exclusion S7 absorbs: a no-record file
// holding the engine's EXACT CURRENT bytes. It needs no code of its own — the
// release being cut is in the table like any other version.
test("row 2 — a file holding the bytes of the release being cut is recognised like any other version", () => {
  assert.deepEqual(heal({ [SCRIPT]: CURRENT }), {
    provenance: { [SCRIPT]: SHA_CURRENT },
    baseRefs: { [SCRIPT]: "v5.0.0" },
    healed: [{ rel: SCRIPT, since: "v5.0.0", locale: "en" }],
  });
});

// Three rels healed from one call, handed in an order that is neither sorted NOR
// reversed. ⚠️ The first version of this test passed them in exactly reverse order,
// so a comparator that simply never swaps produced the right answer by accident and
// the mutant survived. An unsorted fixture has to be unsorted in both directions.
test("the report is ordered by path, never by the order the files arrived", () => {
  const { healed } = heal({ [DOCTRINE]: EN_V1, [SCRIPT]: CURRENT, [COACH]: LF });
  assert.deepEqual(healed, [
    { rel: COACH, since: "v3.0.0", locale: "en" },
    { rel: DOCTRINE, since: "v3.6.0", locale: "en" },
    { rel: SCRIPT, since: "v5.0.0", locale: "en" },
  ]);
});

// ─── What it must REFUSE to heal ─────────────────────────────────────────────

// The forbidden claim the release may not make: the merge does not reach BACK. A
// file the owner edited matches no published version, so it stays unprovable —
// preserved and reported, exactly as today.
test("a file the owner edited matches nothing and is left unprovable", () => {
  assert.deepEqual(heal({ [DOCTRINE]: EDITED }), { provenance: {}, baseRefs: {}, healed: [] });
});

// 🛑 The dangerous one. The brain ALREADY records a sha for this file, and the bytes
// on disk match a DIFFERENT published version. Overwriting the record would tell the
// engine the file is untouched when the recorded fact says otherwise — a wrong heal
// clobbers an owner's edit, which is worse than the freeze it cures.
// One fact, one owner: a recorded provenance is never re-derived.
test("a file that already has a recorded sha is left strictly alone, even when the disk matches another version", () => {
  assert.deepEqual(heal({ [DOCTRINE]: EN_V1 }, { [DOCTRINE]: SHA_EN_V2 }), {
    provenance: { [DOCTRINE]: SHA_EN_V2 },
    baseRefs: {},
    healed: [],
  });
});

// A retired file is one the engine no longer ships, so healing it would seed an
// ancestor for something nobody delivers — and, worse, hand the retirement path a
// proof it could act on. `selectMergeFiles` already subtracts tombstones; this pins
// that the heal asks it rather than reading the merge globs raw.
test("a RETIRED file is never healed, however well the table knows its bytes", () => {
  assert.deepEqual(heal({ [RETIRED]: EN_V1 }), { provenance: {}, baseRefs: {}, healed: [] });
});

// The founding principle (ADR 0012): a file the manifest does not name as `merge` is
// the user's property. A `replace` file is overwritten whole at every update and
// carries no base, so a provenance entry for one would describe nothing.
test("a file outside the merge regime is never healed, even with a digest that matches", () => {
  assert.deepEqual(heal({ [REPLACED]: EN_V1 }), { provenance: {}, baseRefs: {}, healed: [] });
});

// ─── The absent table ────────────────────────────────────────────────────────

// A brain updating from a source that predates S7-2 has no table. The heal must then
// be a no-op that RETURNS WHAT IT WAS GIVEN — an empty map here would wipe the
// brain's provenance and freeze the whole fleet in one line.
//
// ⚠️ `COACH` is deliberately UNRECORDED here. The first version of this test recorded
// both files, so every rel was filtered out before the table was ever consulted and
// the test proved nothing about an absent table — three surviving mutants said so.
// `null` is in the list because a table read that fails yields null, and a default
// parameter only fires on `undefined`.
test("with no table the recorded provenance is handed back untouched, never emptied", () => {
  const recorded = { [DOCTRINE]: SHA_EN_V2 };
  const installedFileMap = { [DOCTRINE]: EN_V1, [COACH]: LF };
  const nothingHealed = { provenance: recorded, baseRefs: {}, healed: [] };

  for (const table of [{}, { files: {} }, null]) {
    assert.deepEqual(heal(installedFileMap, recorded, table), nothingHealed);
  }
  // Omitted entirely, which is NOT the same call: it is the only one that exercises
  // the parameter default. Called directly, because this file's own `heal` helper
  // defaults the argument to the real table — and that helper is what made the first
  // version of this case silently test the populated table instead of the absent one.
  assert.deepEqual(
    healProvenance({ manifest: MANIFEST, provenance: recorded, installedFileMap }),
    nothingHealed,
  );
});

// A merge file the table has never heard of — a skill shipped after the last tag the
// table covers, or one the generator missed. It must be passed over, not crashed on:
// without the guard, the lookup indexes into `undefined` and takes the whole update
// down over a file it simply could not vouch for.
test("a merge file absent from the table is passed over, never crashed on", () => {
  assert.deepEqual(heal({ ".claude/skills/coach/UNKNOWN.md": EN_V1 }), {
    provenance: {},
    baseRefs: {},
    healed: [],
  });
});
