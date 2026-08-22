import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLsFilesZ, filterCopyable, parseLsFilesEolZ, deliversAsLf } from "./tracked-files.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// W2 — the installer delivers WHAT THE OBJECT STORE HOLDS, not what the
// checkout happens to hold (plan § W2 of v5-unfreezes-the-existing-fleet).
//
// `installer.mjs` copies the launcher's tracked files from its WORKING TREE,
// byte-verbatim. Git for Windows defaults `core.autocrlf` to true, so a launcher
// cloned there has a CRLF working tree and the brain is CRLF from install day —
// and the installer digests the bytes it wrote, so the brain's recorded shas are
// CRLF too, matching no row of a table folded from LF blobs.
//
// The fix is not a flag (the installer clones nothing): it is to ask git which
// files it stores as LF, and normalise exactly those. Measured on this repo the
// day it was written: 840 files `i/lf`, 30 `i/-text` (binary), 2 `i/none`, and
// **no tracked file carries an `eol=` attribute** — `.gitattributes`' `*.cmd` /
// `*.sh` rules exist for the launchers a BRAIN generates, not for these.
// ═══════════════════════════════════════════════════════════════════════════

// One real record, captured from `git ls-files --eol -z` rather than imagined:
// three space-padded fields, then a single TAB, then the path, then NUL.
const REC = (i, w, attr, path) => `i/${i}    w/${w}    attr/${attr}${" ".repeat(17)}\t${path}`;

test("parseLsFilesEolZ — reads the index form, the worktree form and the attribute, keyed by path", () => {
  assert.deepEqual(parseLsFilesEolZ(`${REC("lf", "crlf", "", "README.md")}\0`), {
    "README.md": { index: "i/lf", worktree: "w/crlf", attr: "" },
  });
});

test("parseLsFilesEolZ — several records, and the trailing NUL yields no phantom entry", () => {
  const out = [REC("lf", "lf", "", "a.mjs"), REC("-text", "-text", "", "img/b.png")].join("\0") + "\0";

  assert.deepEqual(parseLsFilesEolZ(out), {
    "a.mjs": { index: "i/lf", worktree: "w/lf", attr: "" },
    "img/b.png": { index: "i/-text", worktree: "w/-text", attr: "" },
  });
});

test("parseLsFilesEolZ — an attribute VALUE may contain spaces, and is kept whole", () => {
  // `attr/text eol=crlf` is two words in one field. Splitting the record on
  // whitespace would read the attribute as `text` and lose the half that matters.
  assert.deepEqual(parseLsFilesEolZ(`${REC("lf", "crlf", "text eol=crlf", "launch.cmd")}\0`), {
    "launch.cmd": { index: "i/lf", worktree: "w/crlf", attr: "text eol=crlf" },
  });
});

test("parseLsFilesEolZ — a path containing a SPACE survives, because the separator is a TAB", () => {
  // Why `-z` and a tab split rather than whitespace tokens: the vault ships notes
  // with spaces in their names, and a copy that skips them is a silently incomplete
  // brain.
  assert.deepEqual(parseLsFilesEolZ(`${REC("lf", "lf", "", "vault/my note.md")}\0`), {
    "vault/my note.md": { index: "i/lf", worktree: "w/lf", attr: "" },
  });
});

test("parseLsFilesEolZ — no output, or a malformed record with no tab, yields nothing rather than a crash", () => {
  assert.deepEqual(parseLsFilesEolZ(""), {});
  assert.deepEqual(parseLsFilesEolZ("\0"), {});
  assert.deepEqual(parseLsFilesEolZ("i/lf w/lf attr/ no-tab-here\0"), {});
});

test("deliversAsLf — a text file git stores as LF is normalised on delivery", () => {
  assert.equal(deliversAsLf({ index: "i/lf", worktree: "w/crlf", attr: "" }), true);
  assert.equal(deliversAsLf({ index: "i/lf", worktree: "w/lf", attr: "" }), true);
});

test("deliversAsLf — a BINARY is copied verbatim, whatever the worktree says", () => {
  // 🛑 The one that would corrupt a shipped artefact rather than merely annoy: 29 PNG
  // boards travel into every brain so its README renders, and `normalizeEol` over a
  // PNG rewrites its bytes.
  assert.equal(deliversAsLf({ index: "i/-text", worktree: "w/-text", attr: "" }), false);
});

test("deliversAsLf — an explicit `eol=crlf` attribute is DELIBERATE and is never normalised", () => {
  // Nothing in the launcher carries this today. It is asserted anyway because the day
  // one does, the failure is a Windows user's launcher: cmd.exe re-seeks a batch file
  // by byte offset, and an LF-only one resumes mid-token (field report 2026-08-07,
  // shipped and fixed at v4.8.1). A rule that has to be re-derived is a rule that will
  // be forgotten at exactly that moment.
  assert.equal(deliversAsLf({ index: "i/lf", worktree: "w/crlf", attr: "text eol=crlf" }), false);
  assert.equal(deliversAsLf({ index: "i/lf", worktree: "w/lf", attr: "eol=crlf" }), false);
  assert.equal(deliversAsLf({ index: "i/lf", worktree: "w/lf", attr: "text eol=lf" }), true, "lf is not crlf");
});

test("deliversAsLf — anything git does NOT store as LF is left exactly as it is", () => {
  // `i/crlf` means the object store really holds CRLF, and `i/mixed` that it holds
  // both: normalising either would change the content the launcher committed, which is
  // the opposite of "deliver what the object store holds".
  assert.equal(deliversAsLf({ index: "i/crlf", worktree: "w/crlf", attr: "" }), false);
  assert.equal(deliversAsLf({ index: "i/mixed", worktree: "w/mixed", attr: "" }), false);
  assert.equal(deliversAsLf({ index: "i/none", worktree: "w/none", attr: "" }), false);
});

test("deliversAsLf — a file git said NOTHING about is copied verbatim, never guessed at", () => {
  // The whole `git ls-files --eol` call is best effort: if it fails, the map is empty
  // and every file falls through to the byte-verbatim copy the installer has always
  // done. An installer must not refuse to build a brain over a line-ending nicety.
  assert.equal(deliversAsLf(undefined), false);
  assert.equal(deliversAsLf(null), false);
});

test("parseLsFilesZ — splits on NUL and ignores the trailing empty entry", () => {
  assert.deepEqual(parseLsFilesZ("a\0b/c\0"), ["a", "b/c"]);
});

test("parseLsFilesZ — empty output → []", () => {
  assert.deepEqual(parseLsFilesZ(""), []);
});

test("filterCopyable — excludes DEVELOPING.md (launcher-only file)", () => {
  assert.deepEqual(
    filterCopyable(["README.md", "DEVELOPING.md", "rag/src/index.ts"]),
    ["README.md", "rag/src/index.ts"],
  );
});

test("filterCopyable — excludes EN-QUOI-C-EST-DIFFERENT.md (launcher positioning sheet)", () => {
  assert.deepEqual(
    filterCopyable([
      "README.md",
      "EN-QUOI-C-EST-DIFFERENT.md",
      "rag/src/index.ts",
    ]),
    ["README.md", "rag/src/index.ts"],
  );
});

test("filterCopyable — excludes the whole maintainers/ folder (generator's dev context)", () => {
  assert.deepEqual(
    filterCopyable([
      "README.md",
      "maintainers/README.md",
      "maintainers/decisions/0001-launcher-vs-brain.md",
      "rag/src/index.ts",
    ]),
    ["README.md", "rag/src/index.ts"],
  );
});

test("filterCopyable — excludes the rag/scripts/ measurement tooling (dev-only: tune EMBED_BATCH, default = confidential vault)", () => {
  assert.deepEqual(
    filterCopyable([
      "rag/src/index.ts", // RAG engine: copied
      "rag/scripts/measure-batch.mts",
    ]),
    ["rag/src/index.ts"],
  );
});

test("filterCopyable — excludes templates/ (locale sources are overlaid, not bulk-copied)", () => {
  assert.deepEqual(
    filterCopyable([
      "README.md",
      "templates/en/CLAUDE.md.template",
      "templates/fr/vault/README.md",
      "rag/src/index.ts",
    ]),
    ["README.md", "rag/src/index.ts"],
  );
});

test("filterCopyable — KEEPS the update-engine core + its libs (a brain must self-carry its updater)", () => {
  // The engine must travel into every brain WITH its own machinery, or a brain
  // installed by this launcher can never be cleanly upgraded (plan Step 4, the
  // self-carry invariant). A future DEV_ONLY_PREFIX must never strand these.
  const engine = [
    "scripts/update-engine.mjs",
    "scripts/lib/engine-fetch.mjs",
    "scripts/lib/engine-apply-plan.mjs",
    "scripts/lib/engine-source.mjs",
    "scripts/lib/reindex-trigger.mjs",
    "scripts/lib/glob-match.mjs",
    "scripts/lib/fs-walk.mjs",
  ];
  assert.deepEqual(filterCopyable(engine), engine);
});

test("filterCopyable — KEEPS the brain-side update-engine SKILL (it must ship into every brain)", () => {
  // Step 6: the conversational driver (ADR 0016) is installed into the brain like
  // the other engine skills (manifest `merge` list) — it must survive the copy. The
  // FR variant is layered on afterwards by the locale overlay (templates/fr/**).
  const skill = ".claude/skills/update-engine/SKILL.md";
  assert.deepEqual(filterCopyable([skill, "README.md"]), [skill, "README.md"]);
});

test("filterCopyable — KEEPS the import core + CLI (the import feature must ship into every brain)", () => {
  // ADR 0019 / plan Step 6: the import core travels into every brain so a migrant
  // can re-home a previous brain. A future DEV_ONLY_PREFIX must never strand these.
  const core = ["scripts/import-brain.mjs", "scripts/lib/import-vault.mjs"];
  assert.deepEqual(filterCopyable(core), core);
});

test("filterCopyable — KEEPS the brain-side import SKILL (it must ship into every brain)", () => {
  // The conversational driver (ADR 0019) ships like the other engine skills; the FR
  // variant is layered on afterwards by the locale overlay (templates/fr/**).
  const skill = ".claude/skills/import/SKILL.md";
  assert.deepEqual(filterCopyable([skill, "README.md"]), [skill, "README.md"]);
});

test("filterCopyable — excludes install-handoff (launcher-only: the installer's end banner, no use in a brain)", () => {
  assert.deepEqual(
    filterCopyable([
      "scripts/verify-rag.mjs", // brain-side: copied
      "scripts/lib/install-handoff.mjs",
      "scripts/lib/install-handoff.test.mjs",
      "rag/src/index.ts",
    ]),
    ["scripts/verify-rag.mjs", "rag/src/index.ts"],
  );
});

test("filterCopyable — excludes node-compat (launcher-only: install-time Node preflight, no use in a brain)", () => {
  assert.deepEqual(
    filterCopyable([
      "scripts/verify-rag.mjs", // brain-side: copied
      "scripts/lib/node-compat.mjs",
      "scripts/lib/node-compat.test.mjs",
      "rag/src/index.ts",
    ]),
    ["scripts/verify-rag.mjs", "rag/src/index.ts"],
  );
});

test("filterCopyable — ships the marketing boards (docs/img/board-*) into the brain now they're compressed (~12MB total), so the brain's own README renders", () => {
  // Boards were once excluded (~87MB of README-only art). Compressed to ~12MB total
  // (1760px + pngquant), they now ship into a generated brain so its copy of the
  // launcher README renders every image instead of showing broken boards. Onboarding
  // screenshots (notion-token, desktop, obsidian) and the mascot ship too, as before.
  assert.deepEqual(
    filterCopyable([
      "README.md",
      "docs/img/board-hero.png",
      "docs/img/board-clarity.png",
      "docs/img/board-flow.svg",
      "docs/img/notion-token-01.png",
      "docs/img/kenjaku.png",
      "rag/src/index.ts",
    ]),
    [
      "README.md",
      "docs/img/board-hero.png",
      "docs/img/board-clarity.png",
      "docs/img/board-flow.svg",
      "docs/img/notion-token-01.png",
      "docs/img/kenjaku.png",
      "rag/src/index.ts",
    ],
  );
});

test("filterCopyable — excludes the eval-set tooling (dev-only: used to choose the launcher's embedder)", () => {
  assert.deepEqual(
    filterCopyable([
      "scripts/verify-rag.mjs", // stays copied (used inside the brain)
      "scripts/run-eval.mjs",
      "scripts/lib/eval-judge.mjs",
      "scripts/lib/eval-judge.test.mjs",
      "scripts/lib/eval-run.mjs",
      "scripts/lib/eval-set.mjs",
      "scripts/lib/mcp-search.mjs",
      "scripts/lib/mcp-search.test.mjs",
      "rag/src/index.ts",
    ]),
    ["scripts/verify-rag.mjs", "rag/src/index.ts"],
  );
});

test("filterCopyable — the table BUILDER stays home, the TABLE itself ships", () => {
  // 🪤 The trap this pins: a prefix of `scripts/lib/engine-fingerprint` would ALSO
  // swallow `engine-fingerprints.json` — excluding from the copy the very artefact
  // v5 exists to deliver, and leaving every brain frozen with no way to notice.
  // The builder is maintainer tooling (25 tags of git I/O); the table is data the
  // heal reads on every update.
  assert.deepEqual(
    filterCopyable([
      "scripts/lib/engine-fingerprint-table.mjs",
      "scripts/lib/engine-fingerprint-table.test.mjs",
      "scripts/lib/engine-fingerprints.json",
      "scripts/lib/engine-fingerprints.test.mjs",
    ]),
    ["scripts/lib/engine-fingerprints.json", "scripts/lib/engine-fingerprints.test.mjs"],
  );
});
