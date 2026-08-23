import { test } from "node:test";
import assert from "node:assert/strict";

import { agreeing, countOf, itIsOrTheyAre, itOrThem } from "./plural.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// The agreement rule was written three times in this engine and got fixed once
// (F14), which is how S11 found six survivors of the same defect in a report that
// had already been "fixed". It is one rule now, and this is where the boundary —
// the only place it can be wrong — is pinned.
// ═══════════════════════════════════════════════════════════════════════════

test("the boundary is ONE, and zero takes the plural, as English does", () => {
  assert.deepEqual(
    [0, 1, 2, 11].map((n) => countOf(n, "engine file")),
    ["0 engine files", "1 engine file", "2 engine files", "11 engine files"],
  );
});

test("the noun alone agrees the same way, for a sentence that shows its count as a list", () => {
  assert.deepEqual(
    [0, 1, 2].map((n) => agreeing(n, "skill")),
    ["skills", "skill", "skills"],
  );
});

test("and the pronoun that follows a count agrees with it too", () => {
  assert.deepEqual([0, 1, 2].map(itOrThem), ["them", "it", "them"]);
});

// The VERB has to agree as well, and the update report was about to hand-roll it a
// second time in the same function — which is the exact history this file records.
test("the pronoun and its verb agree together, so no sentence has to hand-roll them", () => {
  assert.deepEqual([0, 1, 2].map(itIsOrTheyAre), ["they are", "it is", "they are"]);
});

// A multi-word noun is the common case here ("engine file", "vault note"), and only
// the LAST word may be pluralised — "engines file" would be a new kind of nonsense.
test("only the last word of a multi-word noun is pluralised", () => {
  assert.equal(countOf(2, "vault note"), "2 vault notes");
  assert.equal(agreeing(2, "hook command"), "hook commands");
});
