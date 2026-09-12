import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import { NOTICE_MAX, writeNotice } from "./vault-write-notice.mjs";

const BRAIN = join("/", "home", "someone", "brain");
const inBrain = (...parts) => join(BRAIN, ...parts);
const REGISTRY = ["acme", "thales"];

const PROFILE = `---
displayName: Thales
universe: thales
---

# Thales

## Always true here

- cortAIx — never: Cortex, Cortaix
`;

// The profile of the universe the NOTE is filed in, which is not always the pointer's.
const profiles = { thales: PROFILE };
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
  const notice = write("vault/thales/meeting.md", "A clean note.\n");
  assert.equal(notice.updatedInput, null);
  assert.match(notice.context, /'thales'/);
  assert.match(notice.context, /'acme'/);
  assert.deepEqual(notice.said.universes, ["thales"]);
});

test("a declared wrong spelling is corrected IN THE BYTES, before they exist", () => {
  const notice = write("vault/thales/meeting.md", "Cortex confirmed the date.\n");
  assert.equal(notice.updatedInput.content, "cortAIx confirmed the date.\n");
  assert.equal(notice.updatedInput.file_path, inBrain("vault", "thales", "meeting.md"));
  assert.deepEqual(notice.said.corrections, ["Cortex→cortAIx"]);
});

test("the correction is told to CLAUDE, with what to do about it", () => {
  // The directive addresses Claude, never the human: a hook that wrote the human's
  // sentence would speak English into a French conversation, in identical words every
  // time (the rule remote-arrivals.mjs already carries).
  const { context } = write("vault/thales/meeting.md", "Cortex confirmed.\n");
  assert.match(context, /Cortex.*cortAIx/);
  assert.match(context, /say so once/i);
  assert.match(context, /undo/i);
});

test("both halves ride in ONE payload, because one hook carries both", () => {
  const { context, updatedInput } = write("vault/thales/meeting.md", "Cortex confirmed.\n");
  assert.equal(updatedInput.content, "cortAIx confirmed.\n");
  assert.match(context, /'thales'/); // the drift
  assert.match(context, /cortAIx/); //  the correction
});

test("a write with nothing to disclose and nothing to fix says nothing at all", () => {
  const notice = write("vault/acme/note.md", "A perfectly ordinary note.\n");
  assert.equal(notice.context, null);
  assert.equal(notice.updatedInput, null);
});

test("a file outside the vault is none of this guard's business", () => {
  const notice = write("scripts/thing.md", "Cortex everywhere.\n");
  assert.equal(notice.context, null);
  assert.equal(notice.updatedInput, null);
});

// ── said once, but corrected every time ──────────────────────────────────────

test("a sphere already named this session is not named again", () => {
  const notice = write("vault/thales/second.md", "A clean note.\n", {
    said: { universes: ["thales"], corrections: [] },
  });
  assert.equal(notice.context, null);
});

test("🔑 a correction already ANNOUNCED is still APPLIED — only the telling is once", () => {
  // Eight meeting preparations must produce one closing sentence, not eight
  // interruptions; they must not produce seven wrong spellings either.
  const notice = write("vault/thales/eighth.md", "Cortex again.\n", {
    said: { universes: ["thales"], corrections: ["Cortex→cortAIx"] },
  });
  assert.equal(notice.updatedInput.content, "cortAIx again.\n");
  assert.equal(notice.context, null);
});

test("a DIFFERENT wrong spelling is still worth saying", () => {
  const notice = write("vault/thales/note.md", "Cortaix again.\n", {
    said: { universes: ["thales"], corrections: ["Cortex→cortAIx"] },
  });
  assert.match(notice.context, /Cortaix/);
  assert.deepEqual(notice.said.corrections, ["Cortaix→cortAIx"]);
});

// ── the undo, and the loop it would otherwise create ─────────────────────────

test("🔁 a bypassed spelling is left exactly as written, so an undo can stick", () => {
  // Without this the owner says "no, put Cortex back", the brain writes it, the guard
  // replaces it again, and the owner's word loses to a hook.
  // Pointed at the sphere the note lands in, so the drift half has nothing to add and
  // the silence under test is the spelling half's alone.
  const notice = write("vault/thales/meeting.md", "Cortex confirmed.\n", {
    bypass: ["Cortex"],
    pointer: "thales",
  });
  assert.equal(notice.updatedInput, null);
  assert.equal(notice.context, null);
  assert.equal(notice.bypassUsed, true);
});

test("a bypass only covers the spelling it names", () => {
  const notice = write("vault/thales/meeting.md", "Cortaix confirmed.\n", { bypass: ["Cortex"] });
  assert.equal(notice.updatedInput.content, "cortAIx confirmed.\n");
  assert.equal(notice.bypassUsed, false);
});

// ── the passages it refuses to rewrite are still reported ────────────────────

test("a wrong spelling inside quoted material is reported and left alone", () => {
  const notice = write("vault/thales/meeting.md", 'Marie wrote: "Cortex will confirm".\n');
  assert.equal(notice.updatedInput, null);
  assert.match(notice.context, /left/i);
  assert.match(notice.context, /Cortex/);
});

// ── which profile is read, and what happens when there is none ───────────────

test("the spellings come from the sphere the NOTE is filed in, not the pointer's", () => {
  const notice = write("vault/acme/note.md", "Cortex confirmed.\n");
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
  const notice = write("vault/thales/note.md", "Cortex confirmed.\n", { readProfile: () => null });
  assert.equal(notice.updatedInput, null);
  assert.match(notice.context, /'thales'/);
});

// ── an Edit is a write too ───────────────────────────────────────────────────

test("an Edit's replacement text is corrected, exactly like a Write's content", () => {
  const notice = writeNotice({
    toolName: "Edit",
    toolInput: {
      file_path: inBrain("vault", "thales", "note.md"),
      old_string: "the client",
      new_string: "Cortex",
    },
    brainDir: BRAIN,
    registry: REGISTRY,
    pointer: "thales",
    readProfile,
  });
  assert.equal(notice.updatedInput.new_string, "cortAIx");
  assert.equal(notice.updatedInput.old_string, "the client", "the anchor must survive untouched");
});

test("🛑 an Edit's ANCHOR is never corrected: it has to match the bytes on disk", () => {
  // Correcting `old_string` would look for a passage that is not there, and the edit
  // would fail — a guard that breaks the write it was watching.
  const notice = writeNotice({
    toolName: "Edit",
    toolInput: { file_path: inBrain("vault", "thales", "note.md"), old_string: "Cortex", new_string: "them" },
    brainDir: BRAIN,
    registry: REGISTRY,
    pointer: "thales",
    readProfile,
  });
  assert.equal(notice.updatedInput, null);
  assert.equal(notice.context, null);
});

// ── it never refuses, whatever happens ───────────────────────────────────────

test("the notice never carries a verdict: refusing stays with the guard next door", () => {
  const notice = write("vault/thales/note.md", "Cortex confirmed.\n");
  assert.deepEqual(Object.keys(notice).sort(), ["bypassUsed", "context", "said", "updatedInput"]);
});

test("an unreadable profile fails OPEN rather than wedging the write", () => {
  const notice = write("vault/thales/note.md", "Cortex confirmed.\n", {
    readProfile: () => {
      throw new Error("disk gone");
    },
  });
  assert.equal(notice.updatedInput, null);
  assert.match(notice.context, /'thales'/);
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
  const profile = `# Thales\n\n## Always true here\n\n- cortAIx — never: ${many.join(", ")}\n`;
  const notice = write("vault/thales/note.md", `${many.join(" ")}\n`, {
    readProfile: () => profile,
  });
  assert.ok(notice.context.length <= NOTICE_MAX, `${notice.context.length} chars`);
});

test("what gets cut is the LIST, never the instruction", () => {
  const many = Array.from({ length: 40 }, (_, i) => `Wrong${i}`);
  const profile = `# Thales\n\n## Always true here\n\n- cortAIx — never: ${many.join(", ")}\n`;
  const { context } = write("vault/thales/note.md", `${many.join(" ")}\n`, { readProfile: () => profile });
  assert.match(context, /and 37 more/, "past three, the spellings become a count");
  assert.match(context, /say so once/i, "and the instruction survives whatever the list does");
});

test("the least important line is dropped before anything is truncated mid-sentence", () => {
  // Three lines can be in flight at once (the drift, the corrections, what was left
  // alone). The one that goes first is the one a reader can live without.
  const many = Array.from({ length: 40 }, (_, i) => `Wrong${i}`);
  const profile = `# Thales\n\n## Always true here\n\n- cortAIx — never: ${many.join(", ")}, Cortex\n`;
  const { context } = write("vault/thales/note.md", `${many.join(" ")} "Cortex said so".\n`, {
    readProfile: () => profile,
  });
  assert.ok(context.length <= NOTICE_MAX);
  assert.doesNotMatch(context, /👀/, "the 'left alone' line is the first to go");
  assert.match(context, /'thales'/, "the drift, which came first, is the last to go");
});
