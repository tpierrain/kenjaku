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

const SHIPPED_CRLF = "shipped at v3.6.0\r\n";

const SHA_SHIPPED = "sha256:c751cccd395fb5d8970138bf7e7870c9db8316af0b9f10d8c8c29cb1b21717b9";
const SHA_SHIPPED_FR = "sha256:e68105a49cf0819deb5fa4d7e3fbc937eccba20cf5e94ceec618e7e4060b9272";
const SHA_SHIPPED_V4 = "sha256:7d1e291931467a9f9bf2321565523a49d7079cbf114a59e3de90000417ab953e";
const SHA_LF = "sha256:e9024f1a07d29d52ad3aa5e1a18e94db1f3a9fd32b89e39d47c472cd99071e13";
// The digest a WINDOWS brain records for the very same delivery: the installer digests
// the bytes it wrote, and on Windows those bytes are CRLF. No table row is ever CRLF —
// every row is folded from a git blob, and the object store holds LF.
const SHA_SHIPPED_CRLF = "sha256:6443c1b2d6515f7f1bfc4e729dee41439f6c454fce8094bc3d780970ad703aeb";
const SHA_CRLF = "sha256:6612d9c94c2da8d2544e1188348fc7baf717ffff1bacde51929a166404a41ffc";

const DOCTRINE = "CLAUDE.engine.md";
const HOOK = "scripts/auto-commit.mjs";
const CONSTITUTION = "CLAUDE.md";

const MANIFEST = {
  regimes: {
    merge: [CONSTITUTION, DOCTRINE, HOOK, ".claude/skills/coach/**"],
    replace: ["scripts/lib/**"],
    // S12's family, and T4 is why this planner has to read it too: a file the owner is
    // INVITED to edit is generated per brain, so its recorded sha names bytes no tag ever
    // published and no candidate can ever be proved.
    invited: [CONSTITUTION],
  },
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
    // 🚨 THE ROWS THE OLD FIXTURE OMITTED, AND OMITTING THEM IS WHAT MADE ITS POLE A LIE
    // (T4). The shipped table really does hold `CLAUDE.md` rows — **five**, v3.0.0 through
    // v4.2.0 — because the LAUNCHER's own install stub lives at that rel and is folded
    // like any other delivered file. The test that stood here asserted *"no published byte
    // can name its tag"* against a fixture with no such rows, so it proved a property of
    // the fixture. `engine-fingerprints.test.mjs` now pins the premise on the SHIPPED
    // table, so this cannot drift back into agreement with itself.
    //
    // TWO rows, not one: a carve-out that only worked for a single-row rel would pass a
    // one-row fixture, and the real rel has five.
    [CONSTITUTION]: {
      [SHA_SHIPPED_V4]: { since: "v4.0.0", locale: "en" },
      [SHA_LF]: { since: "v4.2.0", locale: "en" },
    },
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

// ── The Windows half of the fleet (W1 · plan § The DESIGN for (a)) ──────────
// A digest cannot be un-digested: given a CRLF `recorded`, nothing derives the LF row
// it corresponds to. So the miss path does not resolve the tag — it hands the fetch
// every row the rel has, and the fetch PROVES which one by digesting its CRLF form.

test("planAncestorFetch — a CRLF-recorded sha names no row, so the rel's rows become CANDIDATES", () => {
  // 🚨 THE defect W1 repairs, at the seam that has it. A Windows brain records the
  // bytes it was given, CRLF included; the table is folded from git blobs and holds
  // none. The direct lookup misses and USED to give up here — no plan, no fetch, no
  // merge, and the release's "your edits survive AND the update lands" went quiet on
  // a whole platform.
  assert.deepEqual(
    plan({ provenance: { [DOCTRINE]: SHA_SHIPPED_CRLF }, installedFileMap: { [DOCTRINE]: EDITED } }),
    [
      {
        rel: DOCTRINE,
        recorded: SHA_SHIPPED_CRLF,
        candidates: [
          { tag: "v3.6.0", sourcePath: DOCTRINE },
          { tag: "v3.6.0", sourcePath: `templates/fr/${DOCTRINE}` },
          { tag: "v4.0.0", sourcePath: DOCTRINE },
        ],
      },
    ],
  );
});

test("planAncestorFetch — an LF brain gets the SAME direct hit it always did, and no candidates", () => {
  // The other half of the same guarantee: the miss path must cost the rest of the fleet
  // nothing. One entry, one tag, no `candidates` key at all — so the fetch's argv, and
  // its call count, are byte-for-byte what they were before W1.
  const entries = plan({ provenance: { [DOCTRINE]: SHA_SHIPPED }, installedFileMap: { [DOCTRINE]: EDITED } });

  assert.deepEqual(entries, [{ rel: DOCTRINE, tag: "v3.6.0", sourcePath: DOCTRINE, recorded: SHA_SHIPPED }]);
  assert.ok(!("candidates" in entries[0]), "a hit carries no candidate list to walk");
});

test("planAncestorFetch — an UNTOUCHED Windows brain still plans nothing, candidates or not", () => {
  // The negative pole, in the EOL form the line above does not cover: recorded CRLF,
  // installed CRLF, nobody touched a word. Loosening the miss path must not turn a
  // whole platform's untouched files into fetches.
  assert.deepEqual(
    plan({ provenance: { [DOCTRINE]: SHA_SHIPPED_CRLF }, installedFileMap: { [DOCTRINE]: SHIPPED_CRLF } }),
    [],
  );
  assert.deepEqual(plan({ provenance: { [HOOK]: SHA_CRLF }, installedFileMap: { [HOOK]: CRLF } }), []);
});

test("planAncestorFetch — a CRLF-recorded file whose ancestor is ALREADY on disk is left alone", () => {
  // The dangerous skip, re-asserted on the new path: the miss branch must sit BELOW the
  // hole guard, or a Windows brain would have its real ancestor replaced by a guess.
  assert.deepEqual(
    plan({
      provenance: { [DOCTRINE]: SHA_SHIPPED_CRLF },
      installedFileMap: { [DOCTRINE]: EDITED },
      baseContentMap: { [DOCTRINE]: SHIPPED },
    }),
    [],
  );
});

test("planAncestorFetch — a sha the table cannot place still yields candidates, and the FETCH refuses", () => {
  // ⚠️ THIS TEST WAS INVERTED BY W1, and its old claim is kept: *"a sha the table does
  // not know cannot name a tag, so nothing is planned"*. True while the lookup was the
  // only way to place a sha — and it is exactly what silenced the Windows fleet, since
  // a CRLF digest is indistinguishable, here, from a bogus one.
  //
  // The planner is PURE: it cannot digest a blob it has not read, so it cannot tell the
  // two apart and does not try. It hands over the rows; the fetch proves or refuses, and
  // refusing costs at most N `git show` on a brain that already has the defect.
  assert.deepEqual(
    plan({
      provenance: { [DOCTRINE]: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
      installedFileMap: { [DOCTRINE]: EDITED },
    }),
    [
      {
        rel: DOCTRINE,
        recorded: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
        candidates: [
          { tag: "v3.6.0", sourcePath: DOCTRINE },
          { tag: "v3.6.0", sourcePath: `templates/fr/${DOCTRINE}` },
          { tag: "v4.0.0", sourcePath: DOCTRINE },
        ],
      },
    ],
  );
});

test("planAncestorFetch — a rel the table holds NO row for plans nothing at all", () => {
  // The floor under the miss path: candidates come from rows, so a rel with none is
  // still a `null`. Without this the branch would return an entry with an empty
  // candidate list, and the fetch would report a failure for a file nobody can help.
  assert.deepEqual(
    plan({
      table: { generatedAt: "v5.0.0", files: { [HOOK]: { [SHA_LF]: { since: "v4.9.1", locale: "en" } } } },
      provenance: { [DOCTRINE]: SHA_SHIPPED_CRLF },
      installedFileMap: { [DOCTRINE]: EDITED },
    }),
    [],
  );
});

// ── The INVITED carve-out (T4, third review pass) ────────────────────────────
//
// ⛔ WHAT STOOD HERE WAS WRONG, and it is kept in words because the way it was wrong is
// the lesson: *"CLAUDE.md is generated per brain, so no published byte can name its
// tag — not a special case in the code, and deliberately so: it falls out of the
// lookup."* It does not fall out of anything. The shipped table holds FIVE `CLAUDE.md`
// rows (the launcher's own install stub, same rel), and the pole was green only because
// its fixture had none. **A test whose premise is supplied by its own fixture proves the
// fixture.**
//
// Measured on the REAL shipped table and the REAL shipped manifest, before a line was
// changed: one plan entry, **five candidates, ten git subprocesses on a flawless
// network**, `hydrated: []`, `failed: ["CLAUDE.md"]`. And permanent — `planBaseSeed`
// defers an edited file, so no `.engine-base/CLAUDE.md` is ever written and the miss
// recurs at **every** update of **every** v4+ brain.
test("planAncestorFetch — an INVITED file is never nominated, however many rows the table holds for it", () => {
  // The fleet's actual state: the constitution was generated for THIS owner, so its
  // recorded sha is in no row — the miss path, which nominates every row as a candidate.
  assert.deepEqual(
    plan({ provenance: { [CONSTITUTION]: SHA_SHIPPED }, installedFileMap: { [CONSTITUTION]: EDITED } }),
    [],
  );
});

test("planAncestorFetch — nor when the table CAN place the invited file's record", () => {
  // The other way in, and it needs its own pole: the carve-out has to precede the direct
  // lookup as well as the miss path, or a record the table happens to know would still
  // buy a fetch for a file nothing can help.
  assert.deepEqual(
    plan({ provenance: { [CONSTITUTION]: SHA_SHIPPED_V4 }, installedFileMap: { [CONSTITUTION]: EDITED } }),
    [],
  );
});

test("planAncestorFetch — a brain whose manifest predates the `invited` key still spares its constitution", () => {
  // NOT a defensive habit: it is the state the whole deployed fleet is in. An update is
  // performed by the brain's OLD engine, and `invited` is this release's own invention —
  // so the brains that would spend ten subprocesses per update are exactly the ones whose
  // manifest cannot name the family. Same fallback, same reason, as the session nudge's.
  const { invited, ...withoutInvited } = MANIFEST.regimes;
  assert.deepEqual(
    plan({
      manifest: { ...MANIFEST, regimes: withoutInvited },
      provenance: { [CONSTITUTION]: SHA_SHIPPED },
      installedFileMap: { [CONSTITUTION]: EDITED },
    }),
    [],
  );
});

test("planAncestorFetch — `CLAUDE.engine.md` is ONE DOT away, and is still fetched for", () => {
  // The discriminating negative, and the whole risk of this change: a carve-out that
  // matched by prefix would silence the ENGINE's own half of the constitution — the file
  // this release exists to unfreeze — while every other assertion here stayed green.
  assert.deepEqual(
    plan({ provenance: { [DOCTRINE]: SHA_SHIPPED }, installedFileMap: { [DOCTRINE]: EDITED } }),
    [{ rel: DOCTRINE, tag: "v3.6.0", sourcePath: DOCTRINE, recorded: SHA_SHIPPED }],
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

test("planAncestorFetch — a table with no `files` key at all is survived, not crashed on", () => {
  // Demanded by the mutation run, and reachable for real: a table file holding `{}`
  // parses fine and comes back as a table with nothing in it. Each `?.` in the lookup
  // chain guards a different absence, and this is the middle one.
  assert.deepEqual(
    plan({ table: {}, provenance: { [DOCTRINE]: SHA_SHIPPED }, installedFileMap: { [DOCTRINE]: EDITED } }),
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
