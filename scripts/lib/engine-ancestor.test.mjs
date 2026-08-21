import { test } from "node:test";
import assert from "node:assert/strict";

import { planAncestorFetch } from "./engine-ancestor.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-ancestor — WHICH ancestors are worth going to get, and from where
// (plan S7-5-1 of v5-unfreezes-the-existing-fleet-action.md).
//
// S7 healed the files with NO recorded sha. This is the OTHER half of the fleet and
// the two do not overlap: files that HAVE a recorded sha, whose bytes on disk no
// longer match it (the owner edited them), and whose ancestor is not on the disk —
// `.engine-base/` was only invented in this release. Today they land on row 7 of
// `mergeVerdict`, `preserve/customized`, with a `.new` sidecar beside them: the sha
// proves the file moved, and there is nothing to merge FROM.
//
// The bytes exist. They are in a published tag, and the recorded sha says WHICH:
// `table.files[rel][recordedSha]` → `{ since, locale }` is a direct lookup, no index
// to build. This module decides what to ask for; the git shell next door goes and
// gets it, and verifies it before a byte reaches the disk.
//
// 🛑 EVERY SKIP BELOW IS A TEST, because each one is a way this could go wrong:
// planning a file that needs nothing is a wasted network call, and planning one whose
// ancestor is ALREADY on disk would overwrite a real ancestor with a guess.
//
// Fixtures: every sha256 was computed OUTSIDE this codebase (`shasum -a 256`), never
// through `fingerprint()`, so no test here can be true by construction.
// ═══════════════════════════════════════════════════════════════════════════

const SHIPPED = "shipped at v3.6.0\n";
const SHIPPED_FR = "shipped fr at v3.6.0\n";
const SHIPPED_V4 = "shipped at v4.0.0\n";
const EDITED = "whatever the owner wrote instead\n";
const LF = "line one\nline two\n";
const CRLF = "line one\r\nline two\r\n";

const SHA_SHIPPED = "sha256:c751cccd395fb5d8970138bf7e7870c9db8316af0b9f10d8c8c29cb1b21717b9";
const SHA_SHIPPED_FR = "sha256:e68105a49cf0819deb5fa4d7e3fbc937eccba20cf5e94ceec618e7e4060b9272";
const SHA_SHIPPED_V4 = "sha256:7d1e291931467a9f9bf2321565523a49d7079cbf114a59e3de90000417ab953e";
const SHA_LF = "sha256:e9024f1a07d29d52ad3aa5e1a18e94db1f3a9fd32b89e39d47c472cd99071e13";

const DOCTRINE = "CLAUDE.engine.md";
const HOOK = "scripts/auto-commit.mjs";

const MANIFEST = {
  regimes: { merge: [DOCTRINE, HOOK, ".claude/skills/coach/**"], replace: ["scripts/lib/**"] },
  retired: [".claude/skills/tdd-discipline/**"],
};

const TABLE = {
  generatedAt: "v5.0.0",
  files: {
    [DOCTRINE]: {
      [SHA_SHIPPED]: { since: "v3.6.0", locale: "en" },
      [SHA_SHIPPED_FR]: { since: "v3.6.0", locale: "fr" },
      [SHA_SHIPPED_V4]: { since: "v4.0.0", locale: "en" },
    },
    [HOOK]: { [SHA_LF]: { since: "v4.9.1", locale: "en" } },
  },
};

const plan = (over = {}) =>
  planAncestorFetch({ manifest: MANIFEST, table: TABLE, provenance: {}, installedFileMap: {}, ...over });

// ── The population: row 7, and only row 7 ───────────────────────────────────

test("planAncestorFetch — an EDITED file whose ancestor is missing is exactly what we go and fetch", () => {
  assert.deepEqual(
    plan({ provenance: { [DOCTRINE]: SHA_SHIPPED }, installedFileMap: { [DOCTRINE]: EDITED } }),
    [{ rel: DOCTRINE, tag: "v3.6.0", sourcePath: DOCTRINE, recorded: SHA_SHIPPED }],
  );
});

test("planAncestorFetch — a FRENCH brain is sent to the FRENCH source path at that tag", () => {
  // The locale comes back from the same lookup as the tag, which is why no reverse
  // index is needed — and it is what decides whether the bytes live at `<rel>` or at
  // `templates/fr/<rel>`. Both of the owner's real brains are French.
  assert.deepEqual(
    plan({ provenance: { [DOCTRINE]: SHA_SHIPPED_FR }, installedFileMap: { [DOCTRINE]: EDITED } }),
    [{ rel: DOCTRINE, tag: "v3.6.0", sourcePath: `templates/fr/${DOCTRINE}`, recorded: SHA_SHIPPED_FR }],
  );
});

test("planAncestorFetch — the tag is the one the RECORDED sha points at, not the newest one on file", () => {
  // The table holds three byte-states for this rel. The brain's own record is what
  // selects among them; fetching the newest would hand the merge someone else's
  // ancestor, which is the clobber risk wearing a plausible face.
  assert.deepEqual(
    plan({ provenance: { [DOCTRINE]: SHA_SHIPPED_V4 }, installedFileMap: { [DOCTRINE]: EDITED } }),
    [{ rel: DOCTRINE, tag: "v4.0.0", sourcePath: DOCTRINE, recorded: SHA_SHIPPED_V4 }],
  );
});

// ── Every skip, one test each ───────────────────────────────────────────────

test("planAncestorFetch — a file with NO recorded sha is S7's business, never this one", () => {
  assert.deepEqual(plan({ provenance: {}, installedFileMap: { [DOCTRINE]: SHIPPED } }), []);
});

test("planAncestorFetch — a file whose ancestor is ALREADY on disk is left alone", () => {
  // 🛑 The dangerous skip. An existing `.engine-base/<rel>` is the REAL recorded
  // ancestor; replacing it with bytes fetched on the strength of a historical digest
  // would swap a fact for a guess.
  assert.deepEqual(
    plan({
      provenance: { [DOCTRINE]: SHA_SHIPPED },
      installedFileMap: { [DOCTRINE]: EDITED },
      baseContentMap: { [DOCTRINE]: SHIPPED },
    }),
    [],
  );
});

test("planAncestorFetch — an UNTOUCHED file needs no ancestor, so none is fetched", () => {
  // Rows 4-5 deliver on the record alone. Planning this file would buy a network call
  // and change no outcome.
  assert.deepEqual(
    plan({ provenance: { [DOCTRINE]: SHA_SHIPPED }, installedFileMap: { [DOCTRINE]: SHIPPED } }),
    [],
  );
});

test("planAncestorFetch — untouched EXCEPT for its line endings is still untouched", () => {
  // A Windows checkout, forgiven exactly as `verifyBase` forgives it. Without this a
  // whole platform would fetch ancestors it does not need.
  assert.deepEqual(plan({ provenance: { [HOOK]: SHA_LF }, installedFileMap: { [HOOK]: CRLF } }), []);
});

test("planAncestorFetch — a sha the table does not know cannot name a tag, so nothing is planned", () => {
  assert.deepEqual(
    plan({
      provenance: { [DOCTRINE]: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
      installedFileMap: { [DOCTRINE]: EDITED },
    }),
    [],
  );
});

test("planAncestorFetch — CLAUDE.md is generated per brain, so no published byte can name its tag", () => {
  // Not a special case in the code, and deliberately so: it falls out of the lookup
  // above. Named here because it is 2 of the 15 files measured on the real brains, and
  // someone will otherwise wonder why it never appears.
  assert.deepEqual(
    plan({
      manifest: { ...MANIFEST, regimes: { ...MANIFEST.regimes, merge: [...MANIFEST.regimes.merge, "CLAUDE.md"] } },
      provenance: { "CLAUDE.md": SHA_SHIPPED },
      installedFileMap: { "CLAUDE.md": EDITED },
    }),
    [],
  );
});

test("planAncestorFetch — a RETIRED file is never fetched for, however well the table knows it", () => {
  const rel = ".claude/skills/tdd-discipline/SKILL.md";
  assert.deepEqual(
    plan({
      table: { generatedAt: "v5.0.0", files: { [rel]: { [SHA_SHIPPED]: { since: "v3.6.0", locale: "en" } } } },
      provenance: { [rel]: SHA_SHIPPED },
      installedFileMap: { [rel]: EDITED },
    }),
    [],
  );
});

test("planAncestorFetch — a file in ANOTHER regime is not this machine's business", () => {
  const rel = "scripts/lib/demo-locale.mjs";
  assert.deepEqual(
    plan({
      table: { generatedAt: "v5.0.0", files: { [rel]: { [SHA_SHIPPED]: { since: "v3.6.0", locale: "en" } } } },
      provenance: { [rel]: SHA_SHIPPED },
      installedFileMap: { [rel]: EDITED },
    }),
    [],
  );
});

test("planAncestorFetch — NO table at all plans nothing, and does not throw", () => {
  // A failed or absent read yields null, and a parameter default only fires on
  // `undefined` — the lesson S7-1's own measurement taught.
  assert.deepEqual(
    plan({ table: null, provenance: { [DOCTRINE]: SHA_SHIPPED }, installedFileMap: { [DOCTRINE]: EDITED } }),
    [],
  );
});

test("planAncestorFetch — the table argument may be omitted entirely", () => {
  assert.deepEqual(
    planAncestorFetch({
      manifest: MANIFEST,
      provenance: { [DOCTRINE]: SHA_SHIPPED },
      installedFileMap: { [DOCTRINE]: EDITED },
    }),
    [],
  );
});

// ── Shape ───────────────────────────────────────────────────────────────────

test("planAncestorFetch — two files come back sorted by path, whatever order they arrived in", () => {
  // Unsorted in BOTH directions, or a comparator that never swaps is indistinguishable
  // from one that sorts (the lesson S7-1's mutation run taught).
  const provenance = { [HOOK]: SHA_LF, [DOCTRINE]: SHA_SHIPPED };
  const forward = plan({ provenance, installedFileMap: { [HOOK]: EDITED, [DOCTRINE]: EDITED } });
  const backward = plan({ provenance, installedFileMap: { [DOCTRINE]: EDITED, [HOOK]: EDITED } });

  assert.deepEqual(
    forward.map((f) => f.rel),
    [DOCTRINE, HOOK],
  );
  assert.deepEqual(backward, forward, "and the order of the input map changes nothing");
});

test("planAncestorFetch — an empty brain plans nothing", () => {
  assert.deepEqual(plan(), []);
});
