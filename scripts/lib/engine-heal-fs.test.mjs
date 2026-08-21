import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

import { readFingerprintTable, healFromDisk, FINGERPRINTS_REL } from "./engine-heal-fs.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-heal-fs — THE I/O AROUND THE HEAL (plan S7-3). `healProvenance` is pure and
// takes its table and its installed bytes as data; something has to go and get them.
// This is that something, and it is the whole of the heal's contact with a disk.
//
// Two things it must never do, and both have a test below:
//
//  1. **Die.** A missing or corrupt table means "we recognise nothing today" — never a
//     thrown error over an update that is otherwise fine. An engine that refuses to
//     update because a DATA file was unreadable is worse than one that never had the
//     table at all.
//  2. **Read the vault.** The installed bytes come from `readInstalledMergeFiles`,
//     which walks the merge globs' ROOTS (S4-4c). This module adds no walk of its own,
//     because it runs on every SessionStart self-heal.
//
// House pattern for an fs-touching lib module: real `node:fs` against a temp dir. A
// double that ignores its arguments certifies nothing, and this module's whole job IS
// its arguments reaching the disk.
// ═══════════════════════════════════════════════════════════════════════════

// The digest as `engine-source` records it, written HERE rather than imported, so a
// production change to the fingerprint shows up as a red test instead of moving both
// sides of the comparison at once.
const fp = (content) => "sha256:" + createHash("sha256").update(content).digest("hex");

const DOCTRINE = "the doctrine, as v3.6.0 shipped it\n";
const EDITED = "the doctrine, with the owner's own paragraph\n";

const MANIFEST = {
  regimes: { merge: ["CLAUDE.engine.md", "scripts/auto-commit.mjs"] },
  retired: [],
};

const TABLE = {
  generatedAt: "v5.0.0",
  files: { "CLAUDE.engine.md": { [fp(DOCTRINE)]: { since: "v3.6.0", locale: "fr" } } },
};

function writeFile(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function dirs(t) {
  const root = mkdtempSync(join(tmpdir(), "heal-fs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const brainDir = join(root, "brain");
  const sourceDir = join(root, "source");
  mkdirSync(brainDir, { recursive: true });
  mkdirSync(sourceDir, { recursive: true });
  return { brainDir, sourceDir };
}

// ── readFingerprintTable — fail-soft, source first ──────────────────────────

test("readFingerprintTable — reads the SOURCE's table, the freshest one there is", (t) => {
  const { brainDir, sourceDir } = dirs(t);
  writeFile(sourceDir, FINGERPRINTS_REL, JSON.stringify(TABLE));

  assert.deepEqual(readFingerprintTable({ sourceDir, brainDir }), TABLE);
});

test("readFingerprintTable — the source WINS when both carry one", (t) => {
  // The brain's copy is whatever its last update delivered; the source's is the one
  // being delivered now. A brain healing against its own stale table would recognise
  // strictly less than the release it is updating to.
  const { brainDir, sourceDir } = dirs(t);
  writeFile(sourceDir, FINGERPRINTS_REL, JSON.stringify(TABLE));
  writeFile(brainDir, FINGERPRINTS_REL, JSON.stringify({ generatedAt: "v4.0.0", files: {} }));

  assert.equal(readFingerprintTable({ sourceDir, brainDir }).generatedAt, "v5.0.0");
});

test("readFingerprintTable — falls back to the BRAIN's copy, which is what a self-heal has", (t) => {
  const { brainDir, sourceDir } = dirs(t);
  writeFile(brainDir, FINGERPRINTS_REL, JSON.stringify(TABLE));

  assert.deepEqual(readFingerprintTable({ sourceDir, brainDir }), TABLE);
});

test("readFingerprintTable — no table anywhere is null, not a throw", (t) => {
  const { brainDir, sourceDir } = dirs(t);

  assert.equal(readFingerprintTable({ sourceDir, brainDir }), null);
});

test("readFingerprintTable — a CORRUPT table is null, not a throw", (t) => {
  // The failure mode this forbids: an update dying on a data file. `healProvenance`
  // survives a null table (pinned at S7-1), so "we recognise nothing today" is a
  // complete and honest answer.
  const { brainDir, sourceDir } = dirs(t);
  writeFile(sourceDir, FINGERPRINTS_REL, "{ this is not json");

  assert.equal(readFingerprintTable({ sourceDir, brainDir }), null);
});

test("readFingerprintTable — a corrupt SOURCE table does not fall through to the brain's", (t) => {
  // Deliberate: a corrupt source table is a broken release, and quietly healing from
  // an older table would hide it behind a plausible result.
  const { brainDir, sourceDir } = dirs(t);
  writeFile(sourceDir, FINGERPRINTS_REL, "{ this is not json");
  writeFile(brainDir, FINGERPRINTS_REL, JSON.stringify(TABLE));

  assert.equal(readFingerprintTable({ sourceDir, brainDir }), null);
});

// ── healFromDisk — the whole point ──────────────────────────────────────────

test("healFromDisk — a frozen brain's untouched doctrine is RECOGNISED", (t) => {
  const { brainDir, sourceDir } = dirs(t);
  writeFile(sourceDir, FINGERPRINTS_REL, JSON.stringify(TABLE));
  writeFile(brainDir, "CLAUDE.engine.md", DOCTRINE);

  assert.deepEqual(healFromDisk({ manifest: MANIFEST, provenance: {}, sourceDir, brainDir }), {
    provenance: { "CLAUDE.engine.md": fp(DOCTRINE) },
    baseRefs: { "CLAUDE.engine.md": "v3.6.0" },
    healed: [{ rel: "CLAUDE.engine.md", since: "v3.6.0", locale: "fr" }],
  });
});

test("healFromDisk — a file the OWNER edited matches nothing and is never healed", (t) => {
  // The asymmetric risk this module is built against: a wrong row makes an edited file
  // read as untouched, and the next update clobbers the edit.
  const { brainDir, sourceDir } = dirs(t);
  writeFile(sourceDir, FINGERPRINTS_REL, JSON.stringify(TABLE));
  writeFile(brainDir, "CLAUDE.engine.md", EDITED);

  assert.deepEqual(healFromDisk({ manifest: MANIFEST, provenance: {}, sourceDir, brainDir }), {
    provenance: {},
    baseRefs: {},
    healed: [],
  });
});

test("healFromDisk — a RECORDED provenance is the truth, and survives untouched", (t) => {
  const { brainDir, sourceDir } = dirs(t);
  writeFile(sourceDir, FINGERPRINTS_REL, JSON.stringify(TABLE));
  writeFile(brainDir, "CLAUDE.engine.md", DOCTRINE);

  const recorded = { "CLAUDE.engine.md": "sha256:something-the-brain-recorded" };
  assert.deepEqual(healFromDisk({ manifest: MANIFEST, provenance: recorded, sourceDir, brainDir }), {
    provenance: recorded,
    baseRefs: {},
    healed: [],
  });
});

test("healFromDisk — NO table at all heals nothing, and does not throw", (t) => {
  const { brainDir, sourceDir } = dirs(t);
  writeFile(brainDir, "CLAUDE.engine.md", DOCTRINE);

  assert.deepEqual(healFromDisk({ manifest: MANIFEST, provenance: {}, sourceDir, brainDir }), {
    provenance: {},
    baseRefs: {},
    healed: [],
  });
});

test("healFromDisk — a merge file the brain does not HOLD is passed over, not invented", (t) => {
  const { brainDir, sourceDir } = dirs(t);
  writeFile(sourceDir, FINGERPRINTS_REL, JSON.stringify(TABLE));
  // brainDir holds neither merge file — nothing on disk to recognise.

  assert.deepEqual(healFromDisk({ manifest: MANIFEST, provenance: {}, sourceDir, brainDir }), {
    provenance: {},
    baseRefs: {},
    healed: [],
  });
});

test("healFromDisk — a RETIRED file is never healed, however well the table knows its bytes", (t) => {
  const { brainDir, sourceDir } = dirs(t);
  writeFile(sourceDir, FINGERPRINTS_REL, JSON.stringify(TABLE));
  writeFile(brainDir, "CLAUDE.engine.md", DOCTRINE);

  const retired = { ...MANIFEST, retired: ["CLAUDE.engine.md"] };
  assert.deepEqual(healFromDisk({ manifest: retired, provenance: {}, sourceDir, brainDir }), {
    provenance: {},
    baseRefs: {},
    healed: [],
  });
});
