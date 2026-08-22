import { test } from "node:test";
import assert from "node:assert/strict";

import { decideSkillRetirement } from "./skill-retirement.mjs";
import { fingerprint } from "./engine-source.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// skill-retirement — THE ONLY SUBTRACTIVE DOOR (plan S6b, ADR 0039 amending 0025).
// The engine's surface is additive by construction; retiring a skill is the one
// exception, and it is shaped on ADR 0036's status-line retreat, the only removal
// that came before it: DECLARED (a manifest tombstone, never inferred from an
// absence) and PROVENANCE-GUARDED (remove only what is byte-for-byte what we
// delivered). The cost asymmetry is the whole argument — a leftover skill is
// cosmetic, deleting someone's work is not — so every doubt preserves, and says
// which file caused it.
//
// Pure: the caller lists the directory and reads the bytes; this decides.
// ═══════════════════════════════════════════════════════════════════════════

const DIR = ".claude/skills/tdd-discipline";
const delivered = (rel, content) => ({ rel, content });
const recordOf = (...pairs) => Object.fromEntries(pairs.map(([rel, content]) => [rel, fingerprint(content)]));

test("every file is byte-for-byte what the engine delivered — the skill goes", () => {
  const files = [
    delivered(`${DIR}/SKILL.md`, "# tdd-discipline\n"),
    delivered(`${DIR}/examples.md`, "one test at a time\n"),
  ];
  const decision = decideSkillRetirement({
    dir: DIR,
    files,
    provenance: {
      ...recordOf([`${DIR}/SKILL.md`, "# tdd-discipline\n"], [`${DIR}/examples.md`, "one test at a time\n"]),
      // The record covers the whole brain; entries outside this directory are none
      // of this decision's business and must not sway it either way.
      "CLAUDE.md": fingerprint("someone else's file\n"),
    },
  });
  assert.deepEqual(decision, { dir: DIR, verdict: "remove", blockers: [] });
});

// THE WINDOWS FLEET. A brain cloned on Windows has its files rewritten LF→CRLF by git
// itself, and the recorded sha was taken on the LF bytes the engine delivered. Judge
// that as an edit and every Windows brain keeps its retired skill forever — which is
// exactly why this asks `verifyBase` rather than comparing bytes for itself.
test("a CRLF rewrite is not authorship — the skill still goes", () => {
  const decision = decideSkillRetirement({
    dir: DIR,
    files: [delivered(`${DIR}/SKILL.md`, "# tdd-discipline\r\nline two\r\n")],
    provenance: recordOf([`${DIR}/SKILL.md`, "# tdd-discipline\nline two\n"]),
  });
  assert.deepEqual(decision, { dir: DIR, verdict: "remove", blockers: [] });
});

test("the owner edited a file we delivered — the whole directory stays, and the file is named", () => {
  const decision = decideSkillRetirement({
    dir: DIR,
    files: [
      delivered(`${DIR}/SKILL.md`, "# tdd-discipline\nMY OWN NOTES\n"),
      delivered(`${DIR}/examples.md`, "untouched\n"),
    ],
    provenance: recordOf([`${DIR}/SKILL.md`, "# tdd-discipline\n"], [`${DIR}/examples.md`, "untouched\n"]),
  });
  assert.deepEqual(decision, {
    dir: DIR,
    verdict: "preserve",
    blockers: [{ rel: `${DIR}/SKILL.md`, reason: "customized" }],
  });
});

test("one file the engine never delivered is enough — an unrecorded file preserves the directory", () => {
  const decision = decideSkillRetirement({
    dir: DIR,
    files: [
      delivered(`${DIR}/SKILL.md`, "# tdd-discipline\n"),
      delivered(`${DIR}/my-cheatsheet.md`, "notes I dropped in here\n"),
    ],
    provenance: recordOf([`${DIR}/SKILL.md`, "# tdd-discipline\n"]),
  });
  assert.deepEqual(decision, {
    dir: DIR,
    verdict: "preserve",
    blockers: [{ rel: `${DIR}/my-cheatsheet.md`, reason: "no-provenance" }],
  });
});

// A brain that recorded nothing (installed before provenance existed) must land on the
// SAFE side of the asymmetry, and it does so by the same door as any other doubt: with
// no record there is no proof, and unproven bytes are never deleted.
test("no provenance at all — nothing is deleted, and every file says why", () => {
  const decision = decideSkillRetirement({
    dir: DIR,
    files: [delivered(`${DIR}/SKILL.md`, "# tdd-discipline\n"), delivered(`${DIR}/examples.md`, "x\n")],
  });
  assert.deepEqual(decision, {
    dir: DIR,
    verdict: "preserve",
    blockers: [
      { rel: `${DIR}/examples.md`, reason: "no-provenance" },
      { rel: `${DIR}/SKILL.md`, reason: "no-provenance" },
    ],
  });
});

// Two blockers, handed over in the order a directory walk happened to yield them, and
// they come back in a fixed order with BOTH named. The report reads them aloud, so a
// listing order the owner cannot see must not reorder a message they can — and naming
// only the first would hide the second repair from them.
test("several blockers are all reported, in an order the listing cannot shuffle", () => {
  const decision = decideSkillRetirement({
    dir: DIR,
    files: [
      delivered(`${DIR}/zebra.md`, "mine\n"),
      delivered(`${DIR}/SKILL.md`, "edited\n"),
      delivered(`${DIR}/examples.md`, "untouched\n"),
    ],
    provenance: recordOf([`${DIR}/SKILL.md`, "# tdd-discipline\n"], [`${DIR}/examples.md`, "untouched\n"]),
  });
  assert.deepEqual(decision, {
    dir: DIR,
    verdict: "preserve",
    blockers: [
      { rel: `${DIR}/SKILL.md`, reason: "customized" },
      { rel: `${DIR}/zebra.md`, reason: "no-provenance" },
    ],
  });
});

// The common case on the fleet, and it is neither a removal nor a refusal: most brains
// never had this skill (or already lost it). Saying "preserved" there would report a
// rescue that did not happen, and "removed" would announce a delete that never ran.
test("the directory is not there — the third verdict, and it is neither of the other two", () => {
  const decision = decideSkillRetirement({ dir: DIR, files: [], provenance: recordOf([`${DIR}/SKILL.md`, "x\n"]) });
  assert.deepEqual(decision, { dir: DIR, verdict: "absent", blockers: [] });
});
