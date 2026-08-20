import { test } from "node:test";
import assert from "node:assert/strict";

import { baseRelPath, planBaseAdvance, planBaseSeed, verifyBase } from "./engine-base.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-base — the IMMUTABLE BASE: the bytes the engine last DELIVERED to an
// installed file, kept beside the brain so an update can finally do more than
// compare (plan S1 of update-regime-owns-what-it-shipped-action.md).
//
// Two facts this module owns, and nothing else (no fs, no verdicts):
//   • WHERE a base lives — a single `.engine-base/<rel>` tree, the fork answered
//     2026-08-20. One tree for the four `merge` families, because three of them
//     (the constitution, settings.json, the four engine scripts) have no home at
//     all today, and `engine-skills/` cannot host `CLAUDE.md` without becoming a
//     second thing.
//   • WHETHER the base on disk is PROVABLY the right one — the recorded sha256
//     stops being an equality test between two live files and becomes the proof
//     that the ancestor we are about to merge from is the one the engine wrote.
//     A base we cannot prove is not a base: the caller must be able to tell that
//     apart from "no base recorded", they lead to different repairs.
//   • WHEN a base MOVES — the sentence S1 is named after: to what was DELIVERED
//     to the installed file, never to the newest fetched content.
//   • WHERE THE FIRST ONE COMES FROM — the migration: on a brain whose installed
//     bytes still match their recorded sha, that file IS the engine's last
//     delivered content, so the tree seeds from the brain itself, with no fetch.
//
// Fixtures: sha256 digests computed OUTSIDE this codebase (`shasum -a 256`), never
// through `fingerprint()`, so "the proof holds" cannot be true by construction.
// ═══════════════════════════════════════════════════════════════════════════

const ENGINE_V1 = "engine v1\n";
const SHA_ENGINE_V1 = "sha256:f8a3e8554176f0bcbae48316a4ea43438a62c2b15046a483c93b73a88f8abc92";
const SHA_ENGINE_V2 = "sha256:ea57eb09511b1a1de440f394a21a1100256757fb94a1d94ce4c337d24460edef";

// ─── Where a base lives ──────────────────────────────────────────────────────

// The whole point of the answered fork: ONE tree, whatever family the file belongs
// to. Asserted as a complete list over the four families at once (a skill, the
// constitution, the allowlist, an engine script) — checking one path would leave a
// per-family special case alive. The decoy is a path already under `.engine-base/`:
// it must nest like any other, never be short-circuited, or a base could be asked
// to stand in for itself.
test("baseRelPath — one `.engine-base/` tree for every family, no special case", () => {
  const rels = [
    ".claude/skills/coach/SKILL.md",
    "CLAUDE.md",
    ".claude/settings.json",
    "scripts/auto-commit.mjs",
    ".engine-base/CLAUDE.md",
  ];
  assert.deepEqual(rels.map(baseRelPath), [
    ".engine-base/.claude/skills/coach/SKILL.md",
    ".engine-base/CLAUDE.md",
    ".engine-base/.claude/settings.json",
    ".engine-base/scripts/auto-commit.mjs",
    ".engine-base/.engine-base/CLAUDE.md",
  ]);
});

// ─── Whether that base is provable ───────────────────────────────────────────

test("verifyBase — bytes that hash to the recorded sha are a usable base", () => {
  assert.deepEqual(verifyBase({ recorded: SHA_ENGINE_V1, baseContent: ENGINE_V1 }), { usable: true });
});

// The failure this whole tree exists to make impossible: a base tree that drifted
// (hand-edited, half-written, restored from another brain) would silently feed a
// three-way merge the WRONG ancestor, and the merge would look successful. The
// recorded sha is the only thing that can catch it, so a mismatch is refused —
// distinctly from "absent", because the repairs differ (re-seed vs re-deliver).
test("verifyBase — bytes that hash elsewhere are refused, and named as a mismatch", () => {
  assert.deepEqual(verifyBase({ recorded: SHA_ENGINE_V2, baseContent: ENGINE_V1 }), {
    usable: false,
    reason: "mismatch",
  });
});

// A sha recorded but nothing on disk = an incomplete base tree (a brain from before
// this release, a file added by a later update). Fed as BOTH null and undefined:
// the reader returns null for an absent file, an unseeded map returns undefined,
// and the two must not diverge.
test("verifyBase — a recorded sha with nothing on disk is absent, null or undefined alike", () => {
  const absent = { usable: false, reason: "absent" };
  assert.deepEqual(verifyBase({ recorded: SHA_ENGINE_V1, baseContent: null }), absent);
  assert.deepEqual(verifyBase({ recorded: SHA_ENGINE_V1, baseContent: undefined }), absent);
});

// The other term, alone: bytes ARE there, but nothing was ever recorded about them.
// Unprovable, so unusable — and it is NOT a mismatch: nobody drifted, the file
// simply never entered the regime (the 9 staged skills, `CLAUDE.engine.md`).
test("verifyBase — bytes with no recorded sha are unprovable, not a mismatch", () => {
  assert.deepEqual(verifyBase({ recorded: undefined, baseContent: ENGINE_V1 }), {
    usable: false,
    reason: "no-provenance",
  });
});

// Both terms missing: the reason that describes the state a repair should act on is
// the MISSING RECORD (seeding bytes without a sha would prove nothing), so
// no-provenance wins over absent. Pinned because the opposite order is a one-word
// change no other test could see.
test("verifyBase — neither sha nor bytes reports the missing record, not the missing file", () => {
  assert.deepEqual(verifyBase({ recorded: undefined, baseContent: null }), {
    usable: false,
    reason: "no-provenance",
  });
});

// Line endings are not authorship, and even less so here: this tree is written by
// the engine, never by hand — but a brain cloned on Windows can have it rewritten
// LF→CRLF by git itself, which would condemn the whole Windows fleet to an
// unprovable base. The recorded sha was taken on the LF bytes the engine delivered.
test("verifyBase — a base rewritten CRLF by a Windows checkout still proves out", () => {
  assert.deepEqual(verifyBase({ recorded: SHA_ENGINE_V1, baseContent: "engine v1\r\n" }), { usable: true });
});

// The OTHER side of the same fleet, and the one that makes the raw comparison
// load-bearing rather than redundant: a brain installed on Windows fingerprints
// whatever it copied, so the RECORD itself can be taken over CRLF bytes. Normalizing
// then hashes LF and misses — the base is proven only by comparing the bytes as they
// are. Dropping either term condemns one half of the fleet, and each half needs its
// own case to say so.
test("verifyBase — a base whose sha was RECORDED over CRLF bytes proves out too", () => {
  const SHA_ENGINE_V1_CRLF = "sha256:ad736b9c544c7c10b30d9547157c498eacf8e8494393269b651c70a60d380ad7";
  assert.deepEqual(verifyBase({ recorded: SHA_ENGINE_V1_CRLF, baseContent: "engine v1\r\n" }), { usable: true });
});

// ─── When the base moves — the ADVANCE rule ──────────────────────────────────
// The one sentence S1 exists for: the base moves to what was **delivered** to the
// installed file, never to the newest content the update fetched. The planner is
// therefore driven by the DELIVERY MAP the reconcile already returns
// (`installedFileMap` / `refreshedFileMap` — {rel: the bytes actually written}),
// and by nothing else. Feeding it a source tree instead is not a shortcut, it IS
// the false positive this step kills: `engine-skills/**` is a `replace` target, so
// its bytes advance at every update while the installed skill stands still — and a
// base that ran ahead makes an untouched file look customized, forever.

const MANIFEST = {
  regimes: {
    merge: ["CLAUDE.md", ".claude/settings.json", ".claude/skills/coach/**", "scripts/auto-commit.mjs"],
    replace: ["engine-skills/**", "rag/src/**"],
  },
};

const CONSTITUTION_V2 = "# constitution v2\n";
const SHA_CONSTITUTION_V2 = "sha256:9f3062e79301831bdd211605d6aed10b03ff86b7ef3fcea02c895dd378eed913";
const COACH_V2 = "coach skill v2\n";
const SHA_COACH_V2 = "sha256:c8fb41884c1c0046be0cc556c59fe44021f797dcbdf18f9dc62fd5252264875c";
const AUTO_COMMIT_V2 = "auto-commit v2\n";
const SHA_AUTO_COMMIT_V2 = "sha256:93f71e680574fe1f11969a2816eb7fdc0fb6ece2469946c595f89a0e2d02a49a";

// The nominal move, asserted as a COMPLETE list over three of the four families at
// once (the constitution, a skill, an engine script) — one family checked alone
// would leave a per-family special case alive. Each entry carries everything the
// orchestrator needs so it never recomputes anything: where the bytes go, the bytes
// themselves, and the sha that will PROVE them. Order is the delivery map's, not
// sorted: nothing downstream may depend on an ordering we do not control.
test("planBaseAdvance — the base moves to the bytes DELIVERED, one plan for every family", () => {
  const plan = planBaseAdvance({
    manifest: MANIFEST,
    deliveredFileMap: {
      "scripts/auto-commit.mjs": AUTO_COMMIT_V2,
      "CLAUDE.md": CONSTITUTION_V2,
      ".claude/skills/coach/SKILL.md": COACH_V2,
    },
  });
  assert.deepEqual(plan, [
    {
      rel: "scripts/auto-commit.mjs",
      baseRel: ".engine-base/scripts/auto-commit.mjs",
      content: AUTO_COMMIT_V2,
      sha: SHA_AUTO_COMMIT_V2,
    },
    {
      rel: "CLAUDE.md",
      baseRel: ".engine-base/CLAUDE.md",
      content: CONSTITUTION_V2,
      sha: SHA_CONSTITUTION_V2,
    },
    {
      rel: ".claude/skills/coach/SKILL.md",
      baseRel: ".engine-base/.claude/skills/coach/SKILL.md",
      content: COACH_V2,
      sha: SHA_COACH_V2,
    },
  ]);
});

// The half that makes "preserve" mean something: a `merge` file the update did NOT
// deliver (the owner customized it, so their copy stood) is absent from the delivery
// map — and its base must stay exactly where it was, at the version the engine last
// delivered. That base is the ancestor S2's three-way merge will diff against; move
// it to the new content and the owner's edits vanish from the diff, silently.
// Two undelivered merge files, so a planner that returned "everything the manifest
// declares" would have to fake both.
test("planBaseAdvance — a merge file the update PRESERVED does not move", () => {
  const plan = planBaseAdvance({
    manifest: MANIFEST,
    deliveredFileMap: { ".claude/skills/coach/SKILL.md": COACH_V2 },
  });
  assert.deepEqual(plan, [
    {
      rel: ".claude/skills/coach/SKILL.md",
      baseRel: ".engine-base/.claude/skills/coach/SKILL.md",
      content: COACH_V2,
      sha: SHA_COACH_V2,
    },
  ]);
});

// A base belongs to the `merge` regime alone — the same rule provenance has always
// followed, restated here because this planner is the one that could break it. The
// decoy is deliberate: `engine-skills/coach/SKILL.md` is the STAGED source of the
// very skill delivered above, and it is a `replace` target. Give it a base and the
// tree records what was fetched instead of what was installed, which is the exact
// false positive named in the step.
test("planBaseAdvance — a file outside the `merge` regime never gets a base", () => {
  const plan = planBaseAdvance({
    manifest: MANIFEST,
    deliveredFileMap: {
      "engine-skills/coach/SKILL.md": COACH_V2,
      "rag/src/index.mjs": "compiled\n",
    },
  });
  assert.deepEqual(plan, []);
});

// An update that delivered nothing (a converged brain: every file `unchanged`) moves
// no base and writes nothing. Pinned because "nothing to do" is the common case on a
// fleet that updates often, and the orchestrator downstream must be able to tell it
// apart from work.
test("planBaseAdvance — an update that delivered nothing moves nothing", () => {
  assert.deepEqual(planBaseAdvance({ manifest: MANIFEST, deliveredFileMap: {} }), []);
});

// Emptiness is content: a release that empties an engine file DELIVERED those zero
// bytes, and the base has to follow, or the next update reads a stale ancestor and
// the emptying looks like the owner's edit. The trap is a falsy-content skip, which
// no other case here can see.
test("planBaseAdvance — a file delivered EMPTY advances the base to the empty bytes", () => {
  assert.deepEqual(planBaseAdvance({ manifest: MANIFEST, deliveredFileMap: { "CLAUDE.md": "" } }), [
    {
      rel: "CLAUDE.md",
      baseRel: ".engine-base/CLAUDE.md",
      content: "",
      sha: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
  ]);
});

// The sha is taken over the delivered bytes AS THEY ARE, never over a normalized
// copy — the same rule `buildProvenance` follows at install. Both paths must record
// the same sha for the same file, or a Windows brain would flip its recorded digest
// between install day and its first update, for content nobody touched.
// (`verifyBase` accepts either form, so only this assertion can hold the two ends
// of the fleet to one convention.)
test("planBaseAdvance — CRLF bytes are hashed as delivered, like the installer records them", () => {
  const SHA_ENGINE_V1_CRLF = "sha256:ad736b9c544c7c10b30d9547157c498eacf8e8494393269b651c70a60d380ad7";
  const plan = planBaseAdvance({ manifest: MANIFEST, deliveredFileMap: { "CLAUDE.md": "engine v1\r\n" } });
  assert.deepEqual(plan, [
    { rel: "CLAUDE.md", baseRel: ".engine-base/CLAUDE.md", content: "engine v1\r\n", sha: SHA_ENGINE_V1_CRLF },
  ]);
});

// ─── Where the FIRST base comes from — the SEEDING migration ─────────────────
// Every brain in the fleet was installed before this tree existed, so the advance
// rule above has nothing to move: a base has to appear first. It does NOT have to be
// fetched. The measurement on the deployed brains is what makes the migration cheap:
// a file whose installed bytes still match their recorded sha IS, by definition, the
// content the engine last delivered — so the brain can seed its own base tree, no
// network, no release. 13 of the 15 recorded entries qualified on the live brain; the
// two that did not (`CLAUDE.md`, `.claude/settings.json`) are the owner's edits, and
// they seed from the fetched copy at their next delivery, through the advance rule.
//
// The proof is the SAME one `verifyBase` applies, asked of the installed file instead
// of the base: "would these bytes make a provable base?". So the three refusals are
// the same three, renamed to what they mean on the installed side, because their
// repairs differ — a customized file waits for a delivery, a missing record waits for
// a regime, a deleted file waits for nothing.

const SEEDED = { manifest: MANIFEST };

// The nominal migration, over three families at once: nothing in the tree yet, three
// installed files that still prove out, three seeds carrying the BRAIN's bytes. No sha
// travels with them, deliberately — the record already exists and already matches, and
// re-deriving it here would be a second writer for one fact.
test("planBaseSeed — a brain seeds its own tree from the files that still prove out", () => {
  const plan = planBaseSeed({
    ...SEEDED,
    provenance: {
      "CLAUDE.md": SHA_CONSTITUTION_V2,
      ".claude/skills/coach/SKILL.md": SHA_COACH_V2,
      "scripts/auto-commit.mjs": SHA_AUTO_COMMIT_V2,
    },
    installedFileMap: {
      "CLAUDE.md": CONSTITUTION_V2,
      ".claude/skills/coach/SKILL.md": COACH_V2,
      "scripts/auto-commit.mjs": AUTO_COMMIT_V2,
    },
    baseContentMap: {},
  });
  assert.deepEqual(plan, {
    seeds: [
      { rel: "CLAUDE.md", baseRel: ".engine-base/CLAUDE.md", content: CONSTITUTION_V2 },
      {
        rel: ".claude/skills/coach/SKILL.md",
        baseRel: ".engine-base/.claude/skills/coach/SKILL.md",
        content: COACH_V2,
      },
      { rel: "scripts/auto-commit.mjs", baseRel: ".engine-base/scripts/auto-commit.mjs", content: AUTO_COMMIT_V2 },
    ],
    deferred: [],
  });
});

// The two that did NOT qualify on the live brain, and the reason the migration cannot
// be "seed everything": the owner edited these, so their installed bytes are NOT what
// the engine delivered. Seeding from them would enshrine the owner's own text as the
// ancestor, and S2's three-way would then diff their edits against themselves — the
// edits would vanish from the merge, silently. They wait for a real delivery.
test("planBaseSeed — a file the owner edited is NOT the engine's last delivery, so it defers", () => {
  const plan = planBaseSeed({
    ...SEEDED,
    provenance: { "CLAUDE.md": SHA_ENGINE_V2, ".claude/settings.json": SHA_ENGINE_V2 },
    installedFileMap: { "CLAUDE.md": CONSTITUTION_V2, ".claude/settings.json": "{}\n" },
    baseContentMap: {},
  });
  assert.deepEqual(plan, {
    seeds: [],
    deferred: [
      { rel: "CLAUDE.md", reason: "customized" },
      { rel: ".claude/settings.json", reason: "customized" },
    ],
  });
});

// A `merge` file the manifest declares but this brain never fingerprinted (a file a
// later release moved into the regime, on a brain installed before it). Bytes without
// a record prove nothing, so seeding them would manufacture a base nobody can check —
// which is the one thing `verifyBase` exists to refuse.
test("planBaseSeed — bytes with no recorded sha are not seeded, they are unprovable", () => {
  const plan = planBaseSeed({
    ...SEEDED,
    provenance: {},
    installedFileMap: { "scripts/auto-commit.mjs": AUTO_COMMIT_V2 },
    baseContentMap: {},
  });
  assert.deepEqual(plan, {
    seeds: [],
    deferred: [{ rel: "scripts/auto-commit.mjs", reason: "no-provenance" }],
  });
});

// The mirror case, and the one that proves the candidate list is not just "what is on
// disk": the engine recorded this file, and the owner has since DELETED it. It cannot
// be seeded from a brain that no longer holds it, and it must still be named — a
// planner that enumerated only installed files would report nothing at all here.
test("planBaseSeed — a recorded file the owner deleted is named, not silently skipped", () => {
  const plan = planBaseSeed({
    ...SEEDED,
    provenance: { ".claude/skills/coach/SKILL.md": SHA_COACH_V2 },
    installedFileMap: {},
    baseContentMap: {},
  });
  assert.deepEqual(plan, {
    seeds: [],
    deferred: [{ rel: ".claude/skills/coach/SKILL.md", reason: "not-installed" }],
  });
});

// Idempotence, and it is not decoration: this migration runs on every update, on brains
// that ran it already. A base that is present AND proves out is the truth — re-seeding
// it from the installed file would be a write for nothing at best, and at worst would
// overwrite a correct ancestor with a file the owner has edited since.
test("planBaseSeed — a base already on disk and provable is left alone", () => {
  const plan = planBaseSeed({
    ...SEEDED,
    provenance: { "CLAUDE.md": SHA_CONSTITUTION_V2 },
    installedFileMap: { "CLAUDE.md": "the owner has edited this since\n" },
    baseContentMap: { "CLAUDE.md": CONSTITUTION_V2 },
  });
  assert.deepEqual(plan, { seeds: [], deferred: [] });
});

// The repair the same rule buys for free: a base tree that DRIFTED (half-written,
// hand-edited, restored from another brain) hashes elsewhere, so it is not a base at
// all — and if the installed file still proves out, the brain can rebuild the right
// ancestor from itself. Distinguishes "seed when absent" from "seed whenever the tree
// cannot be proven", which is the rule that actually holds.
test("planBaseSeed — a base that drifted is re-seeded from the file that still proves out", () => {
  const plan = planBaseSeed({
    ...SEEDED,
    provenance: { "CLAUDE.md": SHA_CONSTITUTION_V2 },
    installedFileMap: { "CLAUDE.md": CONSTITUTION_V2 },
    baseContentMap: { "CLAUDE.md": "a base from somewhere else\n" },
  });
  assert.deepEqual(plan, {
    seeds: [{ rel: "CLAUDE.md", baseRel: ".engine-base/CLAUDE.md", content: CONSTITUTION_V2 }],
    deferred: [],
  });
});

// The Windows half of the fleet, at migration time: git rewrote the installed file
// LF→CRLF, nobody touched a word, and the recorded sha was taken on the LF bytes. It
// still qualifies — and it is seeded with the bytes AS THEY ARE on disk, not with a
// normalized copy the brain never held. `verifyBase` proves either form, so the tree
// stays checkable; inventing bytes would make the base a fiction.
test("planBaseSeed — a file rewritten CRLF still qualifies, and seeds the bytes as they are", () => {
  const plan = planBaseSeed({
    ...SEEDED,
    provenance: { "CLAUDE.md": SHA_ENGINE_V1 },
    installedFileMap: { "CLAUDE.md": "engine v1\r\n" },
    baseContentMap: {},
  });
  assert.deepEqual(plan, {
    seeds: [{ rel: "CLAUDE.md", baseRel: ".engine-base/CLAUDE.md", content: "engine v1\r\n" }],
    deferred: [],
  });
});

// Emptiness is content here too: a file the engine delivered empty proves out against
// the empty digest and must seed. The trap is a falsy-content skip, which would silently
// leave that file with no ancestor forever — and no other case here can see it.
test("planBaseSeed — a file the engine delivered EMPTY seeds an empty base", () => {
  const plan = planBaseSeed({
    ...SEEDED,
    provenance: { "CLAUDE.md": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
    installedFileMap: { "CLAUDE.md": "" },
    baseContentMap: {},
  });
  assert.deepEqual(plan, {
    seeds: [{ rel: "CLAUDE.md", baseRel: ".engine-base/CLAUDE.md", content: "" }],
    deferred: [],
  });
});

// A file outside the `merge` regime has no base to seed, whatever the brain holds —
// the same gate the advance rule applies, restated on the migration path because it is
// the other door into the tree. The decoy is a `replace` target that IS recorded and
// DOES sit on disk: only the regime keeps it out.
test("planBaseSeed — a file outside the `merge` regime is never seeded", () => {
  const plan = planBaseSeed({
    ...SEEDED,
    provenance: { "engine-skills/coach/SKILL.md": SHA_COACH_V2 },
    installedFileMap: { "engine-skills/coach/SKILL.md": COACH_V2, "rag/src/index.mjs": "compiled\n" },
    baseContentMap: {},
  });
  assert.deepEqual(plan, { seeds: [], deferred: [] });
});
