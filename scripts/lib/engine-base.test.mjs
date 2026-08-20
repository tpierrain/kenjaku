import { test } from "node:test";
import assert from "node:assert/strict";

import { baseRelPath, verifyBase } from "./engine-base.mjs";

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
