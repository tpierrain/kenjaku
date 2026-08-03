import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOpenNoteCommand } from "./open-note.mjs";

test("outside the vault, darwin → the OS opener on the file itself", () => {
  assert.deepEqual(
    buildOpenNoteCommand({
      platform: "darwin",
      absPath: "/home/u/notes/scratch.md",
      insideVault: false,
      obsidianOk: true,
    }),
    { command: "open", args: ["/home/u/notes/scratch.md"] },
  );
});

test("outside the vault, linux → xdg-open on the file itself", () => {
  assert.deepEqual(
    buildOpenNoteCommand({
      platform: "linux",
      absPath: "/home/u/notes/scratch.md",
      insideVault: false,
      obsidianOk: true,
    }),
    { command: "xdg-open", args: ["/home/u/notes/scratch.md"] },
  );
});

test("outside the vault, win32 → start with its mandatory empty title argument", () => {
  assert.deepEqual(
    buildOpenNoteCommand({
      platform: "win32",
      absPath: "C:\\u\\notes\\scratch.md",
      insideVault: false,
      obsidianOk: true,
    }),
    { command: "start", args: ["", "C:\\u\\notes\\scratch.md"] },
  );
});

test("inside the vault with Obsidian registered, darwin → the obsidian:// URI, path url-encoded", () => {
  assert.deepEqual(
    buildOpenNoteCommand({
      platform: "darwin",
      absPath: "/Users/t/mind-palace/vault/people/jérémy dupont.md",
      insideVault: true,
      obsidianOk: true,
    }),
    {
      command: "open",
      args: [
        "obsidian://open?path=%2FUsers%2Ft%2Fmind-palace%2Fvault%2Fpeople%2Fj%C3%A9r%C3%A9my%20dupont.md",
      ],
    },
  );
});

test("inside the vault but Obsidian NOT registered → the OS opener, unchanged", () => {
  assert.deepEqual(
    buildOpenNoteCommand({
      platform: "darwin",
      absPath: "/Users/t/mind-palace/vault/topics/hiring.md",
      insideVault: true,
      obsidianOk: false,
    }),
    { command: "open", args: ["/Users/t/mind-palace/vault/topics/hiring.md"] },
  );
});

test("unknown platform → null, so the caller falls back to showing the note inline", () => {
  assert.equal(
    buildOpenNoteCommand({
      platform: "aix",
      absPath: "/home/u/notes/scratch.md",
      insideVault: false,
      obsidianOk: false,
    }),
    null,
  );
});
