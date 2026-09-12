import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import { noteUniverse, vaultNotePath } from "./vault-paths.mjs";
import { guardedNotePath } from "./vault-write-guard.mjs";
import { DEFAULT_UNIVERSE } from "./universes.mjs";

const BRAIN = join("/", "home", "someone", "brain");
const inBrain = (...parts) => join(BRAIN, ...parts);

// ── vaultNotePath — the derivation lifted out of vault-write-guard ────────────

test("vaultNotePath returns the vault-relative path of a note being written", () => {
  assert.equal(
    vaultNotePath({ toolName: "Write", filePath: inBrain("vault", "acme", "note.md"), brainDir: BRAIN }),
    "vault/acme/note.md",
  );
});

test("vaultNotePath answers for Edit too, not only Write", () => {
  assert.equal(
    vaultNotePath({ toolName: "Edit", filePath: inBrain("vault", "note.md"), brainDir: BRAIN }),
    "vault/note.md",
  );
});

test("vaultNotePath ignores a tool that is not a write", () => {
  assert.equal(
    vaultNotePath({ toolName: "Read", filePath: inBrain("vault", "note.md"), brainDir: BRAIN }),
    null,
  );
});

test("vaultNotePath ignores a file outside the vault", () => {
  assert.equal(
    vaultNotePath({ toolName: "Write", filePath: inBrain("scripts", "thing.md"), brainDir: BRAIN }),
    null,
  );
});

test("vaultNotePath ignores a path that climbs out of the brain", () => {
  assert.equal(
    vaultNotePath({ toolName: "Write", filePath: join("/", "elsewhere", "note.md"), brainDir: BRAIN }),
    null,
  );
});

test("vaultNotePath ignores a file the indexer would not read", () => {
  assert.equal(
    vaultNotePath({ toolName: "Write", filePath: inBrain("vault", "photo.png"), brainDir: BRAIN }),
    null,
  );
});

test("vaultNotePath accepts an upper-case extension, which is the same note", () => {
  assert.equal(
    vaultNotePath({ toolName: "Write", filePath: inBrain("vault", "NOTE.MD"), brainDir: BRAIN }),
    "vault/NOTE.MD",
  );
});

test("vaultNotePath ignores a file path that is not a string", () => {
  assert.equal(vaultNotePath({ toolName: "Write", filePath: undefined, brainDir: BRAIN }), null);
});

test("the write guard now ASKS the codec instead of deriving the path itself", () => {
  // One question, one place (§ M2). Asserted as the SAME FUNCTION, not as two
  // functions that agree today: a copy that agrees is exactly what this codec
  // exists to stop, and equal outputs cannot tell a delegation from a duplicate.
  assert.equal(guardedNotePath, vaultNotePath);
  const call = { toolName: "Write", filePath: inBrain("vault", "acme", "note.md"), brainDir: BRAIN };
  assert.equal(guardedNotePath(call), "vault/acme/note.md");
});

// ── noteUniverse — the one question the second consumer needed ────────────────

test("noteUniverse reads the universe from the note's first segment", () => {
  assert.equal(noteUniverse({ notePath: "vault/acme/people/marie.md", registry: ["acme"] }), "acme");
});

test("noteUniverse only ever looks at the FIRST segment under the vault", () => {
  assert.equal(
    noteUniverse({ notePath: "vault/acme/clients/globex/meeting.md", registry: ["acme", "globex"] }),
    "acme",
  );
});

test("noteUniverse calls a note at the vault root the default universe", () => {
  // An ABSENT prefix is what "default" means (ADR 0034) — there is no `vault/default/`.
  assert.equal(noteUniverse({ notePath: "vault/note.md", registry: ["acme"] }), DEFAULT_UNIVERSE);
});

test("noteUniverse does not promote an unregistered folder into a universe", () => {
  // `vault/inbox/` is a folder someone made, not a sphere; guessing otherwise would
  // turn every stray directory into a warning.
  assert.equal(noteUniverse({ notePath: "vault/inbox/note.md", registry: ["acme"] }), DEFAULT_UNIVERSE);
});

test("noteUniverse answers the default on a brain that has no universes at all", () => {
  assert.equal(noteUniverse({ notePath: "vault/acme/note.md", registry: [] }), DEFAULT_UNIVERSE);
});

test("noteUniverse treats a missing registry as an empty one rather than throwing", () => {
  assert.equal(noteUniverse({ notePath: "vault/acme/note.md" }), DEFAULT_UNIVERSE);
});

test("noteUniverse has nothing to say about a path the codec refused", () => {
  assert.equal(noteUniverse({ notePath: null, registry: ["acme"] }), DEFAULT_UNIVERSE);
});
