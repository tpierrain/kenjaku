import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import { NOTICE_MAX, writeNotice } from "./vault-write-notice.mjs";

const BRAIN = join("/", "home", "someone", "brain");
const inBrain = (...parts) => join(BRAIN, ...parts);
const REGISTRY = ["acme", "globex"];

const PROFILE = `---
displayName: Globex
universe: globex
---

# Globex

## Always true here

- aXiom — never: Axion, Axiom
`;

// The profile of the universe the NOTE is filed in, which is not always the pointer's.
const profiles = { globex: PROFILE };
const readProfile = (universe) => profiles[universe] ?? null;

const write = (relPath, content, extra = {}) =>
  writeNotice({
    toolName: "Write",
    toolInput: { file_path: inBrain(...relPath.split("/")), content },
    brainDir: BRAIN,
    registry: REGISTRY,
    pointer: "acme",
    readProfile,
    ...extra,
  });

// ── the two halves, and the one payload they share ───────────────────────────

test("a note landing in another sphere than the pointer is disclosed, and nothing is rewritten", () => {
  const notice = write("vault/globex/meeting.md", "A clean note.\n");
  assert.equal(notice.updatedInput, null);
  assert.match(notice.context, /'globex'/);
  assert.match(notice.context, /'acme'/);
  assert.deepEqual(notice.said.universes, ["globex"]);
});

test("a declared wrong spelling is corrected IN THE BYTES, before they exist", () => {
  const notice = write("vault/globex/meeting.md", "Axion confirmed the date.\n");
  assert.equal(notice.updatedInput.content, "aXiom confirmed the date.\n");
  assert.equal(notice.updatedInput.file_path, inBrain("vault", "globex", "meeting.md"));
  assert.deepEqual(notice.said.corrections, ["Axion→aXiom"]);
});

test("the correction is told to CLAUDE, with what to do about it", () => {
  // The directive addresses Claude, never the human: a hook that wrote the human's
  // sentence would speak English into a French conversation, in identical words every
  // time (the rule remote-arrivals.mjs already carries).
  const { context } = write("vault/globex/meeting.md", "Axion confirmed.\n");
  assert.match(context, /Axion.*aXiom/);
  assert.match(context, /say so once/i);
  assert.match(context, /undo/i);
});

test("both halves ride in ONE payload, because one hook carries both", () => {
  const { context, updatedInput } = write("vault/globex/meeting.md", "Axion confirmed.\n");
  assert.equal(updatedInput.content, "aXiom confirmed.\n");
  assert.match(context, /'globex'/); // the drift
  assert.match(context, /aXiom/); //  the correction
});

test("a write with nothing to disclose and nothing to fix says nothing at all", () => {
  const notice = write("vault/acme/note.md", "A perfectly ordinary note.\n");
  assert.equal(notice.context, null);
  assert.equal(notice.updatedInput, null);
});

test("a file outside the vault is none of this guard's business", () => {
  const notice = write("scripts/thing.md", "Axion everywhere.\n");
  assert.equal(notice.context, null);
  assert.equal(notice.updatedInput, null);
});

// ── said once, but corrected every time ──────────────────────────────────────

test("a sphere already named this session is not named again", () => {
  const notice = write("vault/globex/second.md", "A clean note.\n", {
    said: { universes: ["globex"], corrections: [] },
  });
  assert.equal(notice.context, null);
});

test("🔑 a correction already ANNOUNCED is still APPLIED — only the telling is once", () => {
  // Eight meeting preparations must produce one closing sentence, not eight
  // interruptions; they must not produce seven wrong spellings either.
  const notice = write("vault/globex/eighth.md", "Axion again.\n", {
    said: { universes: ["globex"], corrections: ["Axion→aXiom"] },
  });
  assert.equal(notice.updatedInput.content, "aXiom again.\n");
  assert.equal(notice.context, null);
});

test("a DIFFERENT wrong spelling is still worth saying", () => {
  const notice = write("vault/globex/note.md", "Axiom again.\n", {
    said: { universes: ["globex"], corrections: ["Axion→aXiom"] },
  });
  assert.match(notice.context, /Axiom/);
  assert.deepEqual(notice.said.corrections, ["Axiom→aXiom"]);
});

// ── the undo, and the loop it would otherwise create ─────────────────────────

test("🔁 a bypassed spelling is left exactly as written, so an undo can stick", () => {
  // Without this the owner says "no, put Axion back", the brain writes it, the guard
  // replaces it again, and the owner's word loses to a hook.
  // Pointed at the sphere the note lands in, so the drift half has nothing to add and
  // the silence under test is the spelling half's alone.
  const notice = write("vault/globex/meeting.md", "Axion confirmed.\n", {
    bypass: ["Axion"],
    pointer: "globex",
  });
  assert.equal(notice.updatedInput, null);
  assert.equal(notice.context, null);
  assert.equal(notice.bypassUsed, true);
});

test("a bypass only covers the spelling it names", () => {
  const notice = write("vault/globex/meeting.md", "Axiom confirmed.\n", { bypass: ["Axion"] });
  assert.equal(notice.updatedInput.content, "aXiom confirmed.\n");
  assert.equal(notice.bypassUsed, false);
});

// ── the passages it refuses to rewrite are still reported ────────────────────

test("a wrong spelling inside quoted material is reported and left alone", () => {
  const notice = write("vault/globex/meeting.md", 'Marie wrote: "Axion will confirm".\n');
  assert.equal(notice.updatedInput, null);
  assert.match(notice.context, /left/i);
  assert.match(notice.context, /Axion/);
});

// ── which profile is read, and what happens when there is none ───────────────

test("the spellings come from the sphere the NOTE is filed in, not the pointer's", () => {
  const notice = write("vault/acme/note.md", "Axion confirmed.\n");
  assert.equal(notice.updatedInput, null, "acme declares nothing, so acme's notes are untouched");
});

test("the default universe's own profile is read for a note at the vault root", () => {
  const rootProfile = "# Home\n\n## Always true here\n\n- Globex — never: globbex\n";
  const notice = writeNotice({
    toolName: "Write",
    toolInput: { file_path: inBrain("vault", "note.md"), content: "globbex called.\n" },
    brainDir: BRAIN,
    registry: REGISTRY,
    pointer: "acme",
    // The root profile carries no `universe:` key by design, so this is the OTHER
    // path through universeProfilePath and it has to be exercised on purpose.
    readProfile: (universe) => (universe === "default" ? rootProfile : null),
  });
  assert.equal(notice.updatedInput.content, "Globex called.\n");
});

test("a brain whose profile does not exist yet still gets the drift disclosure", () => {
  const notice = write("vault/globex/note.md", "Axion confirmed.\n", { readProfile: () => null });
  assert.equal(notice.updatedInput, null);
  assert.match(notice.context, /'globex'/);
});

// ── an Edit is a write too ───────────────────────────────────────────────────

test("an Edit's replacement text is corrected, exactly like a Write's content", () => {
  const notice = writeNotice({
    toolName: "Edit",
    toolInput: {
      file_path: inBrain("vault", "globex", "note.md"),
      old_string: "the client",
      new_string: "Axion",
    },
    brainDir: BRAIN,
    registry: REGISTRY,
    pointer: "globex",
    readProfile,
  });
  assert.equal(notice.updatedInput.new_string, "aXiom");
  assert.equal(notice.updatedInput.old_string, "the client", "the anchor must survive untouched");
});

test("🛑 an Edit's ANCHOR is never corrected: it has to match the bytes on disk", () => {
  // Correcting `old_string` would look for a passage that is not there, and the edit
  // would fail — a guard that breaks the write it was watching.
  const notice = writeNotice({
    toolName: "Edit",
    toolInput: { file_path: inBrain("vault", "globex", "note.md"), old_string: "Axion", new_string: "them" },
    brainDir: BRAIN,
    registry: REGISTRY,
    pointer: "globex",
    readProfile,
  });
  assert.equal(notice.updatedInput, null);
  assert.equal(notice.context, null);
});

// ── it never refuses, whatever happens ───────────────────────────────────────

test("the notice never carries a verdict: refusing stays with the guard next door", () => {
  const notice = write("vault/globex/note.md", "Axion confirmed.\n");
  assert.deepEqual(Object.keys(notice).sort(), ["bypassUsed", "context", "said", "updatedInput"]);
});

test("an unreadable profile fails OPEN rather than wedging the write", () => {
  const notice = write("vault/globex/note.md", "Axion confirmed.\n", {
    readProfile: () => {
      throw new Error("disk gone");
    },
  });
  assert.equal(notice.updatedInput, null);
  assert.match(notice.context, /'globex'/);
});

test("a tool call with no input at all is answered with silence, not a crash", () => {
  const notice = writeNotice({ toolName: "Write", brainDir: BRAIN, registry: REGISTRY, pointer: "acme", readProfile });
  assert.equal(notice.context, null);
  assert.equal(notice.updatedInput, null);
});

// ── the budget: volume IS the defect (F5) ────────────────────────────────────

test("a payload that runs long is CUT, because volume IS the defect (F5)", () => {
  // This directive rides the most-walked path there is — every single write — so an
  // unbounded one teaches its reader to stop reading, which is how a net dies.
  const many = Array.from({ length: 40 }, (_, i) => `Wrong${i}`);
  const profile = `# Globex\n\n## Always true here\n\n- aXiom — never: ${many.join(", ")}\n`;
  const notice = write("vault/globex/note.md", `${many.join(" ")}\n`, {
    readProfile: () => profile,
  });
  assert.ok(notice.context.length <= NOTICE_MAX, `${notice.context.length} chars`);
});

test("what gets cut is the LIST, never the instruction", () => {
  const many = Array.from({ length: 40 }, (_, i) => `Wrong${i}`);
  const profile = `# Globex\n\n## Always true here\n\n- aXiom — never: ${many.join(", ")}\n`;
  const { context } = write("vault/globex/note.md", `${many.join(" ")}\n`, { readProfile: () => profile });
  assert.match(context, /and 37 more/, "past three, the spellings become a count");
  assert.match(context, /say so once/i, "and the instruction survives whatever the list does");
});

test("the least important line is dropped before anything is truncated mid-sentence", () => {
  // Three lines can be in flight at once (the drift, the corrections, what was left
  // alone). The one that goes first is the one a reader can live without.
  const many = Array.from({ length: 40 }, (_, i) => `Wrong${i}`);
  const profile = `# Globex\n\n## Always true here\n\n- aXiom — never: ${many.join(", ")}, Axion\n`;
  const { context } = write("vault/globex/note.md", `${many.join(" ")} "Axion said so".\n`, {
    readProfile: () => profile,
  });
  assert.ok(context.length <= NOTICE_MAX);
  assert.doesNotMatch(context, /👀/, "the 'left alone' line is the first to go");
  assert.match(context, /'globex'/, "the drift, which came first, is the last to go");
});

test("ONE line that alone busts the budget is cut mid-sentence, not dropped", () => {
  // The pop loop above removes whole lines while more than one is in flight. When a
  // single line is left, dropping it would leave the write silent about a correction
  // it MADE — so the last line is truncated instead, and the ellipsis says so.
  const long = "Axiomat".padEnd(600, "x");
  const profile = `# Acme\n\n## Always true here\n\n- ${long} — never: Axion\n`;
  const { context, updatedInput } = write("vault/acme/note.md", "Axion here.", {
    readProfile: () => profile,
  });
  assert.equal(context.length, NOTICE_MAX, "cut to exactly the budget");
  assert.ok(context.endsWith("…"), `ends mid-sentence: ${JSON.stringify(context.slice(-20))}`);
  assert.equal(updatedInput.content, `${long} here.`, "and the correction itself still happened");
});

test("a payload that fits exactly is kept whole, ellipsis and all", () => {
  // The boundary is inclusive: at exactly the budget nothing is cut. Found by growing
  // the declared spelling one character at a time rather than hard-coded, so the test
  // stays true if the wording of the directive ever changes.
  const contextFor = (padding) => {
    const long = "Axiomat".padEnd(padding, "x");
    const profile = `# Acme\n\n## Always true here\n\n- ${long} — never: Axion\n`;
    return write("vault/acme/note.md", "Axion here.", { readProfile: () => profile }).context;
  };
  let padding = 100;
  while (contextFor(padding).length < NOTICE_MAX) padding += 1;
  const context = contextFor(padding);
  assert.equal(context.length, NOTICE_MAX);
  assert.ok(!context.endsWith("…"), "exactly at the budget is not over it");
});

test("two lines in flight are joined by a blank line, which is what makes them two", () => {
  const { context } = write("vault/globex/note.md", "Axion here.");
  assert.equal(
    context,
    "\n🧭 Heads-up: I filed this note in 'globex' while your active universe is 'acme' — " +
      "my searches keep answering from 'acme', so it will not come back until you switch. " +
      "Say `/switch globex` if that is where you are working.\n" +
      "\n✍️ I corrected the spelling here, from this universe's declared rule: 'Axion' → 'aXiom'. " +
      "Say so once when you hand back, in the owner's own language and your own words, and offer to undo it.",
  );
});

test("exactly three spellings are all named; the fourth is what starts the counting", () => {
  // Three is the boundary, and it is the one a roll-call test never checks: a list of
  // three must read as a list, not as "two and 1 more".
  const three = "# Acme\n\n## Always true here\n\n- aXiom — never: Axion, Axiom, Axiomat\n";
  const { context } = write("vault/acme/note.md", "Axion Axiom Axiomat", { readProfile: () => three });
  assert.match(context, /rule: 'Axion' → 'aXiom', 'Axiom' → 'aXiom', 'Axiomat' → 'aXiom'\. Say so/);

  const four = "# Acme\n\n## Always true here\n\n- aXiom — never: Axion, Axiom, Axiomat, Cortecks\n";
  const counted = write("vault/acme/note.md", "Axion Axiom Axiomat Cortecks", { readProfile: () => four });
  assert.match(
    counted.context,
    /rule: 'Axion' → 'aXiom', 'Axiom' → 'aXiom', 'Axiomat' → 'aXiom' and 1 more\. Say so/,
  );
});

test("a bypass spends itself on the sphere's OWN declared spellings, not on any entry", () => {
  // Two entries, and only the second one carries what the bypass names. A verdict that
  // needed EVERY entry to match would silently refuse to spend the one shot.
  const profile =
    "# Acme\n\n## Always true here\n\n- aXiom — never: Axion\n- Globex — never: globbex\n";
  const { updatedInput, bypassUsed } = write("vault/acme/note.md", "globbex shipped.", {
    readProfile: () => profile,
    bypass: ["globbex"],
  });
  assert.equal(bypassUsed, true);
  assert.equal(updatedInput, null, "and the spelling it spares is left exactly as written");
});

test("a vault write whose text field is missing is silence, not a crash", () => {
  // The path is a vault note, so everything downstream runs — but a Write with no
  // `content` still reaches hooks, and this one may never throw on the write path.
  const notice = writeNotice({
    toolName: "Write",
    toolInput: { file_path: inBrain("vault", "globex", "note.md") },
    brainDir: BRAIN,
    registry: REGISTRY,
    pointer: "globex",
    readProfile,
  });
  assert.deepEqual(notice, {
    updatedInput: null,
    context: null,
    said: { universes: [], corrections: [] },
    bypassUsed: false,
  });
});

test("a file outside the vault is answered with the WHOLE empty verdict", () => {
  // Asserting only `context === null` cannot tell "nothing to say" from "said nothing
  // because it crashed on the way" — every field of the verdict is checked here.
  const notice = write("docs/README.md", "Axion everywhere.");
  assert.deepEqual(notice, {
    updatedInput: null,
    context: null,
    said: { universes: [], corrections: [] },
    bypassUsed: false,
  });
});

test("it works from the arguments a caller MUST pass, defaults doing the rest", () => {
  // No registry, no session memory, no bypass: this is the shape the hook falls back to
  // on a brain that has none of them yet, and it is the shape no other test exercises.
  const notice = writeNotice({
    toolName: "Write",
    toolInput: { file_path: inBrain("vault", "globex", "note.md"), content: "Axion here." },
    brainDir: BRAIN,
    pointer: "acme",
    readProfile,
  });
  // And what it answers is the honest thing: with no registry, `vault/globex/` is a
  // folder rather than a sphere, so there is no drift to disclose and no profile to
  // read. A brain mid-setup gets silence, not a guess.
  assert.deepEqual(notice, {
    updatedInput: null,
    context: null,
    said: { universes: [], corrections: [] },
    bypassUsed: false,
  });
});
