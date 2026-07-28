import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Field QA, 2026-07-28 — the capture flow pre-filled five of seven profile answers and
// the owner engaged MORE because of it. But it got the CTO wrong, and stated it in the
// same voice as the five correct ones, with nothing marking it as a guess: the drafted
// reply was "c'est bon pour tout, sauf mon rôle" — one keystroke from blanket acceptance.
//
// Root cause, verified on disk: it never read the person notes. The vault was neither
// ambiguous nor stale — `vault/inqom/people/michael-aboumelhem.md` is tagged `cto`, and
// its first two lines answer BOTH things the pre-fill got wrong. There was no need to
// guess at all. So the fix is RETRIEVAL, not phrasing, and this guard pins it: the
// pre-fill must query the structured source (`type: person` / `type: universe` notes)
// rather than synthesise from whatever a similarity search happens to surface.
//
// `.claude/skills/switch/**` is a `merge` file, so a provenance-gated refresh carries
// this to every brain that has not customised the skill (ADR 0012 / Increment 2.5).
const SKILL_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../.claude/skills/switch/SKILL.md"
);

const readSkill = () => readFileSync(SKILL_PATH, "utf8");

// The profile section alone — the procedure that pre-fills and then asks. Scoping the
// assertions here keeps them from passing on a stray mention elsewhere in the skill.
function profileSection() {
  const skill = readSkill();
  const start = skill.indexOf("### Describe a universe — its profile");
  assert.notEqual(start, -1, "the profile section must exist — it is what this guard is about");
  const end = skill.indexOf("\n### ", start + 1);
  return skill.slice(start, end === -1 ? undefined : end);
}

test("switch profile — the pre-fill reads the vault's structured source, not a similarity search", () => {
  // The vault HAS a shape; the pre-fill ignored it and paid for it. `list_documents`
  // filtered by type is the exhaustive, deterministic roster — a search_vault ranking is
  // not, and that difference is the whole defect.
  const structured = ["list_documents", "type: person", "type: universe"];
  const missing = structured.filter((needle) => !profileSection().includes(needle));
  assert.deepEqual(
    missing,
    [],
    "the pre-fill must query the typed notes — the fix is retrieval, not phrasing"
  );
});

test("switch profile — the skill says out loud what ACCEPTING a pre-filled batch costs", () => {
  // The pre-fill's cost is concentrated in the one interaction that costs nothing:
  // agreeing. What is accepted becomes a note whose digest is injected at every session
  // start — ambient truth. Consented and repairable, but it has to be SAID, or "yes"
  // is not consent to anything the owner actually weighed.
  const section = profileSection();
  const claims = {
    // One clause, not two fragments that happen to co-occur in the section: the copy
    // must tie the ACT of accepting to what it turns the proposal into.
    // `[^.]` keeps both halves inside ONE sentence (markdown wraps lines, so a newline
    // must be allowed — a full stop must not).
    "ties accepting to the facts it records": /accept\w*[^.]{0,120}\b(fact|truth)/i,
    "says the digest is injected at session start": /session start/i,
    "says it stays repairable": /\b(editable|rewrite|correct\w*)\b/i,
  };
  const unmet = Object.entries(claims)
    .filter(([, pattern]) => !pattern.test(section))
    .map(([claim]) => claim);
  assert.deepEqual(unmet, [], "the consent copy must state all four, not just the reassuring ones");
});

test("switch profile — proposing answers must not turn the batch back into an interrogation", () => {
  // The pre-fill turned seven questions into a one-line reply; the skill already rejects
  // the alternative (seven round-trips) in as many words. Now that the flow also PROPOSES,
  // the tempting next edit is to walk the owner through the values one at a time — which
  // is the interrogation, rebuilt. Pin both halves.
  const section = profileSection();
  const kept = {
    "still asks as ONE batch": /ONE short batch/,
    "still refuses to interrogate": /[Dd]o not interrogate/,
  };
  const dropped = Object.entries(kept)
    .filter(([, pattern]) => !pattern.test(section))
    .map(([claim]) => claim);
  assert.deepEqual(dropped, [], "the batch is the ergonomics that made the owner engage — keep it");
});
