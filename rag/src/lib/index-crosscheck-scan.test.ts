import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { collectDiskNotes, defaultScanPorts, runCrosscheck } from "./index-crosscheck-scan.js";
import { sha256 } from "./index-manager.js";

const raw = "---\ntitle: Crise\n---\n\nBody.\n";

test("each scanned note comes back keyed like the index, with the ENGINE's own hash", async () => {
  const notes = await collectDiskNotes({
    scan: async () => [
      { absolutePath: "/brain/vault/topics/crise.md", relativePath: "topics/crise.md" },
    ],
    readFile: async () => raw,
    parse: () => {},
  });

  assert.deepEqual(notes, [
    { path: "topics/crise.md", hash: sha256(raw), parseError: null },
  ]);
});

test("a note the parser refuses carries the parser's own message, and the scan goes on", async () => {
  const damaged = "---\nupdated: 2026-08-01\nupdated: 2026-08-02\n---\n\nBody.\n";

  const notes = await collectDiskNotes({
    scan: async () => [
      { absolutePath: "/brain/vault/topics/crise.md", relativePath: "topics/crise.md" },
      { absolutePath: "/brain/vault/people/lea.md", relativePath: "people/lea.md" },
    ],
    readFile: async (abs) => (abs.endsWith("crise.md") ? damaged : raw),
    parse: (_raw, relativePath) => {
      if (relativePath === "topics/crise.md") {
        throw new Error('damaged front-matter key "updated": declared twice, on lines 2 and 3');
      }
    },
  });

  assert.deepEqual(notes, [
    {
      path: "topics/crise.md",
      hash: sha256(damaged),
      parseError: 'damaged front-matter key "updated": declared twice, on lines 2 and 3',
    },
    { path: "people/lea.md", hash: sha256(raw), parseError: null },
  ]);
});

test("a note that cannot even be READ stays on the disk side, so its index row is never called residue", async () => {
  const notes = await collectDiskNotes({
    scan: async () => [
      { absolutePath: "/brain/vault/topics/crise.md", relativePath: "topics/crise.md" },
      { absolutePath: "/brain/vault/people/lea.md", relativePath: "people/lea.md" },
    ],
    readFile: async (abs) => {
      if (abs.endsWith("crise.md")) throw new Error("EACCES: permission denied");
      return raw;
    },
    parse: () => {},
  });

  assert.deepEqual(notes, [
    { path: "topics/crise.md", hash: "", parseError: "EACCES: permission denied" },
    { path: "people/lea.md", hash: sha256(raw), parseError: null },
  ]);
});

test("runCrosscheck composes the disk scan and the index rows into one report", async () => {
  const report = await runCrosscheck(
    {
      scan: async () => [
        { absolutePath: "/brain/vault/topics/crise.md", relativePath: "topics/crise.md" },
      ],
      readFile: async () => raw,
      parse: () => {},
    },
    () => [{ path: "topics/crise.md", hash: "indexed-long-ago", chunks: 4 }],
  );

  assert.deepEqual(report, {
    stale: ["topics/crise.md"],
    goneFromDisk: [],
    missingFromIndex: [],
    emptyInIndex: [],
    unreadable: [],
  });
});

// ── defaultScanPorts: the wiring, which every test above replaces with a fake ──
// Found by mutation testing, not by reading: every test above injects its own ports,
// so `defaultScanPorts` was observed by NOTHING. Five mutants survived there, and one
// of them — `parse: () => {}` — is this whole feature's failure mode: a crosscheck that
// never reports a damaged note again, with the suite still green. The file's own comment
// swears these defaults must stay the engine's eyes (F16); these tests are what makes
// that a claim instead of a hope.

test("defaultScanPorts.parse throws exactly when the INDEXER refuses the note, not when it likes it", async () => {
  // The real payload from the field (F11/F12): a second `updated:` key. The engine's
  // parser refuses it, so the crosscheck must hear a throw — that is the only signal
  // that reaches the owner.
  const damaged = "---\ntype: person\nupdated: 2026-08-01\nupdated: 2026-08-02\n---\n\n# Léa\n";

  assert.throws(
    () => defaultScanPorts.parse(damaged, "people/lea.md"),
    /updated/,
    "a note the indexer refuses must throw here, or the crosscheck goes permanently blind",
  );
  // The false-positive side, which decides whether the probe is trusted or muted.
  assert.doesNotThrow(() => defaultScanPorts.parse("---\ntype: person\n---\n\n# Léa\n", "people/lea.md"));
});

test("defaultScanPorts.readFile reads real bytes as UTF-8 — an accent is not mojibake", async () => {
  const dir = mkdtempSync(join(tmpdir(), "crosscheck-ports-"));
  try {
    const note = join(dir, "réunion.md");
    writeFileSync(note, "---\ntype: briefing\n---\n\n# Réunion, décidée\n");

    const raw = await defaultScanPorts.readFile(note);

    // The whole content, not a substring: `readFile(path, "")` yields a Buffer whose
    // `String()` is lossless-looking, so a loose /Réunion/ can pass on the wrong encoding.
    assert.equal(raw, "---\ntype: briefing\n---\n\n# Réunion, décidée\n");
    assert.equal(typeof raw, "string", "a Buffer here would hash differently from the indexer's");
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("defaultScanPorts.scan really walks the vault through the engine's own scanner", async () => {
  const files = await defaultScanPorts.scan();

  // Deliberately not a count: the vault's contents change. What must hold is that the
  // port RETURNS the scanner's shape — `scan: () => undefined` survived every test above.
  assert.ok(Array.isArray(files), "the default port must hand back the engine's scan result");
  for (const file of files) {
    assert.equal(typeof file.absolutePath, "string");
    assert.equal(typeof file.relativePath, "string");
  }
});
