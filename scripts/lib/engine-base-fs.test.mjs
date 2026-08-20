import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

import {
  readBaseTree,
  writeBaseEntries,
  readInstalledMergeFiles,
  syncBaseTree,
  recordSourceProvenanceAndBase,
} from "./engine-base-fs.mjs";
import { verifyBase } from "./engine-base.mjs";
import { reseedProvenance } from "./engine-source.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-base-fs — THE FS ORCHESTRATOR around the three pure planners of
// `engine-base.mjs` (plan S1). The planners answer WHERE a base lives, WHETHER it
// is provable, WHERE the first one comes from and WHEN it moves; nothing until now
// put a single byte on disk, so no brain has ever held a `.engine-base/` tree.
//
// This is the thin I/O that does, and the two places it is wired from: the install
// (seed the tree from the brain itself) and the update (advance what was delivered,
// then seed whatever the migration still owes).
//
// House pattern for an fs-touching lib module: real `node:fs` against a temp dir,
// no fake filesystem — a double that ignores its arguments certifies nothing, and
// this module's whole job IS its arguments reaching the disk.
// ═══════════════════════════════════════════════════════════════════════════

// The digest as `engine-source` records it, written HERE rather than imported, so a
// production change to the fingerprint shows up as a red test instead of moving both
// sides of the comparison at once.
const fp = (content) => "sha256:" + createHash("sha256").update(content).digest("hex");

function writeFile(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

const read = (root, rel) => readFileSync(join(root, rel), "utf8");

// Four `merge` families (the constitution, the allowlist, a skill subtree, an engine
// script) + one `replace` path, so "only merge files get a base" is discriminating.
const MANIFEST = {
  regimes: {
    replace: ["scripts/lib/**"],
    merge: ["CLAUDE.md", ".claude/settings.json", ".claude/skills/coach/**", "scripts/auto-commit.mjs"],
    local: [".engine-base/**"],
  },
};

function brain(t, files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sbg-base-fs-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [rel, content] of Object.entries(files)) writeFile(dir, rel, content);
  return dir;
}

// ── readBaseTree — the tree as `verifyBase` needs to be told about it ──────────

test("readBaseTree — reads `.engine-base/<rel>` for each candidate, and reports a missing one as null (verifyBase's `absent`)", (t) => {
  const dir = brain(t, {
    ".engine-base/CLAUDE.md": "# the base constitution\n",
    ".engine-base/.claude/skills/coach/SKILL.md": "coach, as delivered\n",
  });

  const tree = readBaseTree({
    brainDir: dir,
    rels: [".claude/skills/coach/SKILL.md", "scripts/auto-commit.mjs", "CLAUDE.md"],
  });

  assert.deepEqual(tree, {
    "CLAUDE.md": "# the base constitution\n",
    ".claude/skills/coach/SKILL.md": "coach, as delivered\n",
    "scripts/auto-commit.mjs": null,
  });
});

test("readBaseTree — hands back the bytes AS THEY ARE, CRLF included (normalizing is verifyBase's job, not the reader's)", (t) => {
  const dir = brain(t, { ".engine-base/CLAUDE.md": "line\r\nand another\r\n" });

  assert.deepEqual(readBaseTree({ brainDir: dir, rels: ["CLAUDE.md"] }), {
    "CLAUDE.md": "line\r\nand another\r\n",
  });
});

// ── writeBaseEntries — the only writer of the tree ────────────────────────────

test("writeBaseEntries — creates the missing parent directories and returns every base path it wrote", (t) => {
  const dir = brain(t);

  const written = writeBaseEntries({
    brainDir: dir,
    entries: [
      { baseRel: ".engine-base/.claude/skills/coach/SKILL.md", content: "coach v1\n" },
      { baseRel: ".engine-base/CLAUDE.md", content: "constitution v1\n" },
    ],
  });

  assert.deepEqual(written, [".engine-base/.claude/skills/coach/SKILL.md", ".engine-base/CLAUDE.md"]);
  assert.equal(read(dir, ".engine-base/.claude/skills/coach/SKILL.md"), "coach v1\n");
  assert.equal(read(dir, ".engine-base/CLAUDE.md"), "constitution v1\n");
});

test("writeBaseEntries — an existing base entry is OVERWRITTEN whole (an advance replaces the ancestor, it does not append to it)", (t) => {
  const dir = brain(t, { ".engine-base/CLAUDE.md": "constitution v1, a much longer previous base\n" });

  writeBaseEntries({ brainDir: dir, entries: [{ baseRel: ".engine-base/CLAUDE.md", content: "v2\n" }] });

  assert.equal(read(dir, ".engine-base/CLAUDE.md"), "v2\n");
});

// ── readInstalledMergeFiles — the union's disk half ───────────────────────────

test("readInstalledMergeFiles — returns the brain's `merge` files with their exact bytes, and nothing else it holds", (t) => {
  const dir = brain(t, {
    "CLAUDE.md": "# mine\n",
    "scripts/auto-commit.mjs": "// auto-commit\n",
    "scripts/lib/engine-fetch.mjs": "// replace regime, not merge\n",
    "vault/a-note.md": "# Mollecuisse\n",
    ".engine-base/CLAUDE.md": "# the base itself, never a candidate\n",
  });

  assert.deepEqual(readInstalledMergeFiles({ brainDir: dir, manifest: MANIFEST }), {
    "CLAUDE.md": "# mine\n",
    "scripts/auto-commit.mjs": "// auto-commit\n",
  });
});

// ── syncBaseTree — the install shape: seed from the brain itself ──────────────

test("syncBaseTree — with nothing delivered, a brain seeds its whole tree from itself (the migration), and says exactly what it seeded", (t) => {
  const installed = {
    "CLAUDE.md": "# constitution as installed\n",
    ".claude/skills/coach/SKILL.md": "coach, as installed\n",
  };
  const dir = brain(t, { ...installed, "scripts/lib/engine-fetch.mjs": "// replace regime\n" });
  const provenance = {
    "CLAUDE.md": fp(installed["CLAUDE.md"]),
    ".claude/skills/coach/SKILL.md": fp(installed[".claude/skills/coach/SKILL.md"]),
  };

  const report = syncBaseTree({ brainDir: dir, manifest: MANIFEST, provenance });

  assert.deepEqual(report, {
    advanced: [],
    seeded: [".claude/skills/coach/SKILL.md", "CLAUDE.md"],
    deferred: [],
  });
  assert.equal(read(dir, ".engine-base/CLAUDE.md"), installed["CLAUDE.md"]);
  assert.equal(read(dir, ".engine-base/.claude/skills/coach/SKILL.md"), installed[".claude/skills/coach/SKILL.md"]);
  assert.equal(existsSync(join(dir, ".engine-base/scripts/lib/engine-fetch.mjs")), false, "a `replace` file has no base");
});

// ── syncBaseTree — the update shape: advance to what was DELIVERED ────────────

test("syncBaseTree — a delivered `merge` file's base becomes the DELIVERED bytes, never what happens to sit on disk", (t) => {
  // The installed file already moved on (an owner edit landing between the delivery and
  // this pass): the base must still describe what the engine handed over.
  const dir = brain(t, { "CLAUDE.md": "# edited since the delivery\n" });
  const delivered = "# constitution v2, as delivered\n";

  const report = syncBaseTree({
    brainDir: dir,
    manifest: MANIFEST,
    provenance: { "CLAUDE.md": fp(delivered) },
    deliveredFileMap: { "CLAUDE.md": delivered, "scripts/lib/engine-fetch.mjs": "// replace regime\n" },
  });

  assert.deepEqual(report, { advanced: ["CLAUDE.md"], seeded: [], deferred: [] });
  assert.equal(read(dir, ".engine-base/CLAUDE.md"), delivered);
  assert.equal(
    existsSync(join(dir, ".engine-base/scripts/lib/engine-fetch.mjs")),
    false,
    "a delivered `replace` file gets no base — the regime gates the tree as it gates provenance",
  );
});

test("syncBaseTree — a base that is present AND provable is left strictly alone, even beside an installed file that has drifted", (t) => {
  const ancestor = "# constitution as the engine delivered it\n";
  const dir = brain(t, {
    "CLAUDE.md": "# the owner rewrote this weeks ago\n",
    ".engine-base/CLAUDE.md": ancestor,
  });

  const report = syncBaseTree({
    brainDir: dir,
    manifest: MANIFEST,
    provenance: { "CLAUDE.md": fp(ancestor) },
  });

  assert.deepEqual(report, { advanced: [], seeded: [], deferred: [] });
  assert.equal(
    read(dir, ".engine-base/CLAUDE.md"),
    ancestor,
    "re-seeding a correct ancestor from an edited file is the one way this migration could destroy what it protects",
  );
});

test("syncBaseTree — what it cannot seed is NAMED, one reason per refusal, rather than passed over in silence", (t) => {
  const dir = brain(t, {
    "CLAUDE.md": "# the owner's own version\n",
    ".claude/settings.json": '{ "allow": ["Bash(open:*)"] }\n',
  });

  const report = syncBaseTree({
    brainDir: dir,
    manifest: MANIFEST,
    // CLAUDE.md: recorded, but the installed bytes hash elsewhere → the owner customized it.
    // settings.json: installed, never recorded → it entered no regime.
    // auto-commit.mjs: recorded, but the owner deleted the file → nothing to seed from.
    provenance: {
      "CLAUDE.md": fp("# what the engine delivered\n"),
      "scripts/auto-commit.mjs": fp("// auto-commit\n"),
    },
  });

  assert.deepEqual(report, {
    advanced: [],
    seeded: [],
    // Ordered by path, never by the directory walk that happened to find them: this
    // list is read by a human (and, from S4 on, said out loud to the owner).
    deferred: [
      { rel: ".claude/settings.json", reason: "no-provenance" },
      { rel: "CLAUDE.md", reason: "customized" },
      { rel: "scripts/auto-commit.mjs", reason: "not-installed" },
    ],
  });
  assert.equal(existsSync(join(dir, ".engine-base")), false, "nothing provable, nothing written");
});

test("syncBaseTree — a DRIFTED base is repaired from the installed file, and the tree never nests inside itself", (t) => {
  const delivered = "// auto-commit, as delivered\n";
  const dir = brain(t, {
    "scripts/auto-commit.mjs": delivered,
    ".engine-base/scripts/auto-commit.mjs": "// something else entirely\n",
  });

  const report = syncBaseTree({
    brainDir: dir,
    manifest: MANIFEST,
    provenance: { "scripts/auto-commit.mjs": fp(delivered) },
  });

  assert.deepEqual(report, { advanced: [], seeded: ["scripts/auto-commit.mjs"], deferred: [] });
  assert.equal(read(dir, ".engine-base/scripts/auto-commit.mjs"), delivered);
  assert.equal(existsSync(join(dir, ".engine-base/.engine-base")), false, "the base tree is not a candidate for a base");
});

// ── The cross-check: one fact, two writers, and they must agree ───────────────
// The tree holds the bytes and the manifest holds their digest. They are computed by
// two independent code paths (`planBaseAdvance` here, `reseedProvenance` in the
// manifest writer beside it), so a divergence would show up only later, as the
// `mismatch` that makes a three-way merge pick the wrong ancestor. Asserted here
// instead: the tree this module wrote is PROVABLE against the record its neighbour wrote.
test("syncBaseTree — the tree it writes is provable against the provenance `reseedProvenance` records for the same delivery", (t) => {
  const dir = brain(t, { "CLAUDE.md": "# old\n", "scripts/auto-commit.mjs": "// old\n" });
  const deliveredFileMap = {
    "CLAUDE.md": "# constitution v2\r\n",
    "scripts/auto-commit.mjs": "// auto-commit v2\n",
    "scripts/lib/engine-fetch.mjs": "// replace regime\n",
  };
  const provenance = reseedProvenance({ priorProvenance: {}, manifest: MANIFEST, deliveredFileMap });

  syncBaseTree({ brainDir: dir, manifest: MANIFEST, provenance, deliveredFileMap });

  const tree = readBaseTree({ brainDir: dir, rels: ["CLAUDE.md", "scripts/auto-commit.mjs"] });
  const verdicts = Object.fromEntries(
    Object.entries(tree).map(([rel, baseContent]) => [rel, verifyBase({ recorded: provenance[rel], baseContent })]),
  );
  assert.deepEqual(verdicts, {
    "CLAUDE.md": { usable: true },
    "scripts/auto-commit.mjs": { usable: true },
  });
});

// ── The install composition root ──────────────────────────────────────────────

test("recordSourceProvenanceAndBase — one call records source + provenance AND lays down the base tree, so no install can ship without one", (t) => {
  const constitution = "# the personalized constitution\n";
  const dir = brain(t, {
    "CLAUDE.md": constitution,
    "scripts/lib/engine-fetch.mjs": "// replace regime\n",
    "engine-manifest.json": JSON.stringify(MANIFEST, null, 2) + "\n",
  });

  const enriched = recordSourceProvenanceAndBase({
    brainDir: dir,
    git: { repo: "https://example.test/launcher.git", tag: "v4.9.1", branch: "main", commit: "deadbeef" },
  });

  const persisted = JSON.parse(read(dir, "engine-manifest.json"));
  assert.deepEqual(persisted.source, { repo: "https://example.test/launcher.git", ref: "v4.9.1" });
  assert.deepEqual(persisted.provenance, { "CLAUDE.md": fp(constitution) });
  assert.deepEqual(enriched.provenance, persisted.provenance, "the caller is handed the manifest that was written");
  assert.equal(read(dir, ".engine-base/CLAUDE.md"), constitution);
});
