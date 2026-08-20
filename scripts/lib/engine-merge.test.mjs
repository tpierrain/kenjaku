import { test } from "node:test";
import assert from "node:assert/strict";

import { mergeVerdict } from "./engine-merge.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-merge — the verdict that ends "preserve means abandon" (plan S2a of
// update-regime-owns-what-it-shipped-action.md).
//
// Until now an update had a base's DIGEST and never its BYTES, which leaves
// exactly one thing to do with it — an equality test — hence two outcomes:
// clobber the owner, or abandon the file. S1 put the bytes on disk; this module
// is the decision that finally uses them.
//
// The one trap it exists to make unmissable: **the disk receives the MERGE, the
// base advances to the CANDIDATE**. So a verdict carries the two separately —
// `write` (what the installed file becomes) and `deliver` (the engine content
// the base and the provenance move to). They differ on exactly one row, and if
// `deliver` ever carried the merged bytes, the next update would read the file
// as untouched and fast-forward straight over the owner's edit: this chantier's
// own defect, reintroduced by its fix.
//
// Fixtures: sha256 digests computed OUTSIDE this codebase (`shasum -a 256`),
// never through `fingerprint()`, so "the proof holds" cannot be true by
// construction.
// ═══════════════════════════════════════════════════════════════════════════

const ENGINE_V1 = "engine v1\n";
const ENGINE_V2 = "engine v2\n";
const OWNER_EDIT = "the owner rewrote this\n";
const SHA_ENGINE_V1 = "sha256:f8a3e8554176f0bcbae48316a4ea43438a62c2b15046a483c93b73a88f8abc92";
const SHA_ENGINE_V2 = "sha256:ea57eb09511b1a1de440f394a21a1100256757fb94a1d94ce4c337d24460edef";

// A merge double whose result is a FINGERPRINT: no other input to the verdict can
// produce these bytes, so seeing them in `write` proves the merged content flowed
// through rather than the candidate being passed off as a merge.
const MERGED_SENTINEL = "<<merged by the double>>\n";
const MARKED_SENTINEL = "<<conflict markers from the double>>\n";

function mergeSpy({ clean = true, merged = MERGED_SENTINEL } = {}) {
  const calls = [];
  const merge = (args) => {
    calls.push(args);
    return { clean, merged };
  };
  return { merge, calls };
}

// Every row below rides the SAME base-proof pair, so a test that changes outcome
// changes it for a stated reason and not because its fixture drifted.
const provable = { recorded: SHA_ENGINE_V1, baseContent: ENGINE_V1 };

// ─── Row 1: nothing on disk ──────────────────────────────────────────────────

// An absent file is not a merge subject: there is no "ours". It is delivered, and
// the base moves with it — asserted as the WHOLE object, because the interesting
// half is that `write` and `deliver` agree here and disagree on exactly one row.
test("row 1 — installed absent: deliver the candidate, base moves with it", () => {
  const { merge, calls } = mergeSpy();
  for (const installed of [null, undefined]) {
    assert.deepEqual(mergeVerdict({ installed, ...provable, candidate: ENGINE_V2, merge }), {
      verdict: "absent-install",
      write: ENGINE_V2,
      deliver: ENGINE_V2,
    });
  }
  assert.deepEqual(calls, [], "an absent file has no ancestor to merge from");
});

// ─── Rows 2 & 3: nothing was ever recorded ───────────────────────────────────

// Today's defect, in one row: with no provenance the engine reports "preserved"
// even when the brain holds the engine's EXACT bytes. Nothing is preserved there
// — there is simply nothing to do, and saying otherwise puts a phantom on the
// owner's update report forever.
test("row 2 — no provable base but the brain already holds the candidate: nothing to do", () => {
  const { merge, calls } = mergeSpy();
  assert.deepEqual(
    mergeVerdict({ installed: ENGINE_V2, recorded: undefined, baseContent: null, candidate: ENGINE_V2, merge }),
    { verdict: "unchanged", reason: "no-base" },
  );
  assert.deepEqual(calls, [], "no ancestor, no merge");
});

// Nothing recorded means nothing can be PROVEN about this file — not that the
// owner customized it. The two deserve different prose in the update report, and
// only one of them earns a sidecar.
test("row 3 — nothing recorded: the owner's copy stands, and we say we cannot prove why", () => {
  const { merge, calls } = mergeSpy();
  assert.deepEqual(
    mergeVerdict({ installed: OWNER_EDIT, recorded: undefined, baseContent: ENGINE_V1, candidate: ENGINE_V2, merge }),
    { verdict: "preserve", reason: "no-provenance" },
  );
  assert.deepEqual(calls, [], "an unprovable ancestor must never reach the merge");
});

// ─── Rows 4 & 5: the owner never touched it ──────────────────────────────────

test("row 4 — untouched and already at the candidate: write nothing at all", () => {
  const { merge, calls } = mergeSpy();
  assert.deepEqual(mergeVerdict({ installed: ENGINE_V1, ...provable, candidate: ENGINE_V1, merge }), {
    verdict: "unchanged",
  });
  assert.deepEqual(calls, [], "nothing to merge when both sides stood still");
});

test("row 5 — untouched and outdated: fast-forward, today's behaviour unchanged", () => {
  const { merge, calls } = mergeSpy();
  assert.deepEqual(mergeVerdict({ installed: ENGINE_V1, ...provable, candidate: ENGINE_V2, merge }), {
    verdict: "refresh",
    write: ENGINE_V2,
    deliver: ENGINE_V2,
  });
  assert.deepEqual(calls, [], "a fast-forward has nothing to reconcile");
});

// Line endings are not authorship: a Windows checkout can rewrite the installed
// file LF→CRLF with nobody touching a word. Read as an edit, it would drag every
// Windows brain into a merge — and eventually into conflicts — for whitespace.
test("row 5, triangulated on EOL — a CRLF copy of the base is still untouched", () => {
  const { merge, calls } = mergeSpy();
  assert.deepEqual(mergeVerdict({ installed: "engine v1\r\n", ...provable, candidate: ENGINE_V2, merge }), {
    verdict: "refresh",
    write: ENGINE_V2,
    deliver: ENGINE_V2,
  });
  assert.deepEqual(calls, [], "CRLF is not an edit");
});

// ─── Row 6: the owner edited, the engine did not ─────────────────────────────

// The second defect today's code carries: a customized file is handed a `.new`
// sidecar even when the engine has shipped nothing new, so every single update
// drops a sidecar byte-identical to the base. Noise, and it teaches owners to
// ignore the one signal that will matter on row 8.
test("row 6 — the owner edited but the engine shipped nothing new: their edit simply stands", () => {
  const { merge, calls } = mergeSpy();
  assert.deepEqual(mergeVerdict({ installed: OWNER_EDIT, ...provable, candidate: ENGINE_V1, merge }), {
    verdict: "unchanged",
    reason: "owner-edit-stands",
  });
  assert.deepEqual(calls, [], "there is no update to merge in");
});

// ─── Row 7: the fleet's first update — edited, and no ancestor on disk ───────

// THE row that decides whether this release is safe to ship. `reconcileBrain` runs
// the skill refresh BEFORE `syncBaseTree` lays the tree down, so on the first update
// of every brain installed before S1 there is no ancestor at all. The verdict must
// degrade to exactly today's behaviour — keep the owner's file, offer the engine's
// version beside it — and pick the merge up at the second update.
test("row 7 — edited with no ancestor on disk: today's behaviour, sidecar and all", () => {
  const { merge, calls } = mergeSpy();
  const unusable = [
    { recorded: SHA_ENGINE_V1, baseContent: null },
    { recorded: SHA_ENGINE_V1, baseContent: "a base that hashes elsewhere\n" },
  ];
  assert.deepEqual(
    unusable.map(({ recorded, baseContent }) =>
      mergeVerdict({ installed: OWNER_EDIT, recorded, baseContent, candidate: ENGINE_V2, merge }),
    ),
    [
      { verdict: "preserve", reason: "customized", sidecar: ENGINE_V2 },
      { verdict: "preserve", reason: "customized", sidecar: ENGINE_V2 },
    ],
  );
  assert.deepEqual(calls, [], "there is nothing to merge from");
});

// The other half of the same guarantee, and the one whose absence would have been
// catastrophic: with no tree on disk, an UNTOUCHED skill must still fast-forward.
// Reading the ancestor's absence as "we cannot decide" would have frozen every
// skill on the fleet, on the very release that exists to unfreeze them.
test("row 5, on a brain with no tree at all — an untouched skill still fast-forwards", () => {
  const { merge, calls } = mergeSpy();
  assert.deepEqual(
    mergeVerdict({ installed: ENGINE_V1, recorded: SHA_ENGINE_V1, baseContent: null, candidate: ENGINE_V2, merge }),
    { verdict: "refresh", write: ENGINE_V2, deliver: ENGINE_V2 },
  );
  assert.deepEqual(calls, [], "the sha alone proves nobody touched it");
});

// And the third: the engine standing still is a question the sha answers too, so a
// brain with no tree is not handed a sidecar for an update that does not exist.
test("row 6, on a brain with no tree at all — no sidecar for an update that never came", () => {
  const { merge } = mergeSpy();
  assert.deepEqual(
    mergeVerdict({ installed: OWNER_EDIT, recorded: SHA_ENGINE_V1, baseContent: null, candidate: ENGINE_V1, merge }),
    { verdict: "unchanged", reason: "owner-edit-stands" },
  );
});

// ─── Row 8: both moved, and they do not clash ────────────────────────────────

// THE row this whole chantier exists for, and the one where `write` and `deliver`
// must disagree. Asserted as the whole object: an implementation that delivered
// the merged bytes would pass any test that only checked `write`.
test("row 8 — a clean merge: the disk gets the merge, the base gets the CANDIDATE", () => {
  const { merge, calls } = mergeSpy();
  assert.deepEqual(mergeVerdict({ installed: OWNER_EDIT, ...provable, candidate: ENGINE_V2, merge }), {
    verdict: "merge",
    write: MERGED_SENTINEL,
    deliver: ENGINE_V2,
  });
  assert.deepEqual(calls, [{ base: ENGINE_V1, ours: OWNER_EDIT, theirs: ENGINE_V2 }]);
});

// The ours/theirs inversion is the silent catastrophe of every three-way merge:
// swapped, `git merge-file` still returns a plausible file, in which the ENGINE
// wins every hunk the owner touched. Only the roles, asserted by name, catch it —
// which is why the call above is asserted as a whole object and pinned again here
// against a candidate that could not be mistaken for the owner's side.
test("row 8 — the three sides reach the merge under the right names, never swapped", () => {
  const { merge, calls } = mergeSpy();
  mergeVerdict({
    installed: "MINE\n",
    recorded: SHA_ENGINE_V2,
    baseContent: ENGINE_V2,
    candidate: "THEIRS\n",
    merge,
  });
  assert.deepEqual(calls, [{ base: ENGINE_V2, ours: "MINE\n", theirs: "THEIRS\n" }]);
});

// A merge whose result equals what is already installed is still a merge: the
// engine's change was already there. The base must move all the same, or the
// next update would keep re-merging content nobody is missing. Whether those
// identical bytes are re-written to disk is the fs layer's call, and one place
// decides it — this one only says what the file should now be.
test("row 8 — a merge that changes nothing on disk still moves the base", () => {
  const { merge } = mergeSpy({ merged: OWNER_EDIT });
  assert.deepEqual(mergeVerdict({ installed: OWNER_EDIT, ...provable, candidate: ENGINE_V2, merge }), {
    verdict: "merge",
    write: OWNER_EDIT,
    deliver: ENGINE_V2,
  });
});

// ─── Row 9: both moved, and they clash ───────────────────────────────────────

// The only case that costs a human anything. The engine's answer is to keep its
// hands off the file entirely — and, decisively, to NOT deliver: an advanced base
// would claim the engine shipped content this file never received, and the next
// merge would read that as the owner deleting the update.
test("row 9 — a conflict writes nothing, delivers nothing, and hands over the marked merge", () => {
  const { merge, calls } = mergeSpy({ clean: false, merged: MARKED_SENTINEL });
  assert.deepEqual(mergeVerdict({ installed: OWNER_EDIT, ...provable, candidate: ENGINE_V2, merge }), {
    verdict: "conflict",
    sidecar: MARKED_SENTINEL,
  });
  assert.deepEqual(calls, [{ base: ENGINE_V1, ours: OWNER_EDIT, theirs: ENGINE_V2 }]);
});
