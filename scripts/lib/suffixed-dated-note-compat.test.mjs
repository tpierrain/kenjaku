// ─────────────────────────────────────────────────────────────────────────────
// suffixed-dated-note-compat.test.mjs — plan step 4.6, and it says "ASSERT that,
// do not assume it".
//
// Per-person dated notes change the SHAPE of the vault for every brain, not only
// duo ones: `daily/2026-09-02-claire-dubois.md` is a file name nothing in this repo
// had ever seen. Three separate machines decide what a note IS, and each of them
// could plausibly have keyed on the file name:
//
//   • the index's type detection (a `daily/` note must still be a daily);
//   • the linter's zone lists (a raw capture is orphan-excluded and frontmatter-
//     exempt — flag it and the owner gets a complaint they cannot clear);
//   • the consolidation gesture's capture zones (miss it and the note is never
//     offered for consolidation).
//
// All three match on the FOLDER, which is why the suffix is free. That is exactly
// the kind of fact that is true today and quietly stops being true — and the
// universe blind spot in those very lists already has a hardening plan of its own.
// So it is pinned here, in one place, from the outside.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { consolidationCandidates } from "./consolidation-candidates.mjs";
import { datedNotePath } from "./dated-note-path.mjs";
import { lintVault } from "./wiki-lint.mjs";

// Built by the rule itself, so this file cannot drift from the names actually written.
const SUFFIXED = datedNotePath({
  folder: "daily",
  date: "2026-09-02",
  author: "Claire Dubois",
  base: { author: "Thomas Pierrain" },
}).path;
const IN_A_UNIVERSE = datedNotePath({
  folder: "acme/daily",
  date: "2026-09-02",
  author: "Claire Dubois",
  base: { author: "Thomas Pierrain" },
}).path;

const raw = (path) => ({ path, frontmatter: {}, body: "Wrote up the invoicing question." });

test("the names this rule produces are the ones this file claims to be about", () => {
  assert.deepEqual([SUFFIXED, IN_A_UNIVERSE], [
    "daily/2026-09-02-claire-dubois.md",
    "acme/daily/2026-09-02-claire-dubois.md",
  ]);
});

// 🛑 A raw capture carries no taxonomy frontmatter and is linked by nobody, by
// design. Held to either rule, it becomes a permanent complaint about a file the
// owner is doing nothing wrong with (CONVENTIONS §5quater).
test("a suffixed daily is still a raw capture to the linter — no orphan, no frontmatter complaint", () => {
  const report = lintVault([raw(SUFFIXED), raw(IN_A_UNIVERSE), raw("daily/2026-09-01.md")]);

  assert.deepEqual(report.orphans, []);
  assert.deepEqual(report.frontmatterViolations, []);
});

// Read as a capture, the note's unresolved mentions become consolidation candidates.
// Read as anything else, they are skipped — silently, which is how a note stops being
// offered without anyone noticing.
test("a suffixed daily is still read as a capture, at the root and inside a universe", () => {
  const mentioning = (path) => ({ path, frontmatter: {}, body: "Talked to [[people/amina-haddad]]." });

  const { newPages } = consolidationCandidates([mentioning(SUFFIXED), mentioning(IN_A_UNIVERSE)]);

  assert.equal(newPages.length, 1, "one page to create, mentioned by both captures");
  assert.equal(newPages[0].target, "people/amina-haddad");
  assert.deepEqual(
    newPages[0].sources.map((s) => s.path).sort(),
    [IN_A_UNIVERSE, SUFFIXED].sort(),
    "both suffixed notes were scanned; a name-keyed zone list would have skipped them",
  );
});

// The negative pole: the suffix must not smuggle a note INTO a zone it does not
// belong to. A curated page named like a day is still a curated page.
test("the suffix grants nothing — a curated note named like a day is still held to the rules", () => {
  const report = lintVault([{ path: "people/2026-09-02-claire-dubois.md", frontmatter: {}, body: "x" }]);

  assert.deepEqual(report.frontmatterViolations, [
    { path: "people/2026-09-02-claire-dubois.md", missing: ["type", "created", "updated", "tags"] },
  ]);
});
