import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

import { installStagedSkills, proveStagedSkills } from "./staged-skills.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// staged-skills — the engine delivers upgrader-bound skills at a NON-sacred staging
// path `engine-skills/<name>/` (the sacred scrub forbids delivering under
// `.claude/skills/`, ADR 0026). installStagedSkills install-if-absent's each staged
// skill into `<brainDir>/.claude/skills/<name>/`, never overwriting a present skill.
// ─────────────────────────────────────────────────────────────────────────────

function writeFile(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function freshDirs(t) {
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-staged-src-"));
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-staged-brain-"));
  t.after(() => {
    rmSync(sourceDir, { recursive: true, force: true });
    rmSync(brainDir, { recursive: true, force: true });
  });
  return { sourceDir, brainDir };
}

test("installStagedSkills — copies a staged skill the brain is MISSING into .claude/skills/, returns its name", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  const body = "---\nname: local-mirror\n---\nMirror a Notion zone into the vault.\n";
  writeFile(sourceDir, "engine-skills/local-mirror/SKILL.md", body);

  const installed = installStagedSkills({ sourceDir, brainDir });

  assert.deepEqual(installed, ["local-mirror"]);
  assert.equal(readFileSync(join(brainDir, ".claude/skills/local-mirror/SKILL.md"), "utf8"), body);
});

test("installStagedSkills — a skill the brain ALREADY has is preserved byte-identical, not reported", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/local-mirror/SKILL.md", "---\nname: local-mirror\n---\nEngine default.\n");
  const mine = "---\nname: local-mirror\n---\nMY OWN tweaks — do not overwrite.\n";
  writeFile(brainDir, ".claude/skills/local-mirror/SKILL.md", mine);

  const installed = installStagedSkills({ sourceDir, brainDir });

  assert.deepEqual(installed, [], "a present skill is not (re)installed");
  assert.equal(readFileSync(join(brainDir, ".claude/skills/local-mirror/SKILL.md"), "utf8"), mine, "the user's skill is untouched");
});

test("installStagedSkills — idempotent: a second run installs nothing", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/local-mirror/SKILL.md", "---\nname: local-mirror\n---\nMirror.\n");

  assert.deepEqual(installStagedSkills({ sourceDir, brainDir }), ["local-mirror"]);
  assert.deepEqual(installStagedSkills({ sourceDir, brainDir }), [], "re-running is a no-op");
});

test("installStagedSkills — copies the WHOLE skill subtree (nested files), not just SKILL.md", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/local-mirror/SKILL.md", "---\nname: local-mirror\n---\nMirror.\n");
  writeFile(sourceDir, "engine-skills/local-mirror/reference/notes.md", "deep ref\n");

  installStagedSkills({ sourceDir, brainDir });

  assert.ok(existsSync(join(brainDir, ".claude/skills/local-mirror/SKILL.md")));
  assert.equal(readFileSync(join(brainDir, ".claude/skills/local-mirror/reference/notes.md"), "utf8"), "deep ref\n");
});

test("installStagedSkills — installs only the MISSING staged skills, returns them sorted by directory order", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/alpha/SKILL.md", "---\nname: alpha\n---\nA.\n");
  writeFile(sourceDir, "engine-skills/beta/SKILL.md", "---\nname: beta\n---\nB.\n");
  writeFile(brainDir, ".claude/skills/alpha/SKILL.md", "---\nname: alpha\n---\nmine.\n");

  const installed = installStagedSkills({ sourceDir, brainDir });

  assert.deepEqual(installed, ["beta"], "only the missing one is installed");
  assert.ok(existsSync(join(brainDir, ".claude/skills/beta/SKILL.md")));
});

test("installStagedSkills — no engine-skills/ staging dir → returns [], creates nothing", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);

  assert.deepEqual(installStagedSkills({ sourceDir, brainDir }), []);
  assert.ok(!existsSync(join(brainDir, ".claude")), "no skills dir is created when there is nothing to stage");
});

// ── T10's SECOND door, which the finding did not name ────────────────────────
// T10 was reported against reconcileBrain's merge-skill install-if-absent. Running it
// here found the same defect in the staged door: a French brain received the ENGLISH
// staged skill, and kept it for good (its dir now exists → never re-installed).
// ADR 0040 rule 3 resolves at the SOURCE and writes at the rel, so `templates/fr/
// engine-skills/<name>/…` must be read and `.claude/skills/<name>/…` written.
test("installStagedSkills — a FR brain receives the FR staged skill, not the English one (T10)", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(brainDir, "scripts/lib/demo-locale.mjs", 'export const BRAIN_LOCALE = "fr";\n');
  const french = "---\nname: local-mirror\n---\nRéplique une zone Notion dans le coffre.\n";
  writeFile(sourceDir, "engine-skills/local-mirror/SKILL.md", "---\nname: local-mirror\n---\nMirror a Notion zone.\n");
  writeFile(sourceDir, "templates/fr/engine-skills/local-mirror/SKILL.md", french);

  const installed = installStagedSkills({ sourceDir, brainDir });

  assert.deepEqual(installed, ["local-mirror"]);
  assert.equal(readFileSync(join(brainDir, ".claude/skills/local-mirror/SKILL.md"), "utf8"), french);
});

test("installStagedSkills — a staged file with no FR twin still reaches a FR brain, from the root (T10)", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(brainDir, "scripts/lib/demo-locale.mjs", 'export const BRAIN_LOCALE = "fr";\n');
  const french = "---\nname: local-mirror\n---\nRéplique une zone Notion.\n";
  const untranslated = "deep ref, English only\n";
  writeFile(sourceDir, "engine-skills/local-mirror/SKILL.md", "---\nname: local-mirror\n---\nMirror.\n");
  writeFile(sourceDir, "templates/fr/engine-skills/local-mirror/SKILL.md", french);
  writeFile(sourceDir, "engine-skills/local-mirror/reference/notes.md", untranslated);

  installStagedSkills({ sourceDir, brainDir });

  assert.equal(readFileSync(join(brainDir, ".claude/skills/local-mirror/SKILL.md"), "utf8"), french);
  assert.equal(
    readFileSync(join(brainDir, ".claude/skills/local-mirror/reference/notes.md"), "utf8"),
    untranslated,
    "no twin is the product saying 'not localized', not an omission to paper over",
  );
});

test("installStagedSkills — an EN brain receives the ROOT staged skill even when a FR twin exists (T10)", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  const english = "---\nname: local-mirror\n---\nMirror a Notion zone.\n";
  writeFile(sourceDir, "engine-skills/local-mirror/SKILL.md", english);
  writeFile(sourceDir, "templates/fr/engine-skills/local-mirror/SKILL.md", "---\nname: local-mirror\n---\nRéplique.\n");

  installStagedSkills({ sourceDir, brainDir });

  assert.equal(readFileSync(join(brainDir, ".claude/skills/local-mirror/SKILL.md"), "utf8"), english);
});

test("installStagedSkills — the twin is never MISTAKEN for a staged skill of its own", (t) => {
  // `templates/fr/engine-skills/` is a SOURCE tree, not a staging dir. Read the staging
  // dir naively and a French brain grows a phantom skill; the installed names are the
  // report the owner reads, so a phantom there is a lie about what they now have.
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(brainDir, "scripts/lib/demo-locale.mjs", 'export const BRAIN_LOCALE = "fr";\n');
  writeFile(sourceDir, "engine-skills/local-mirror/SKILL.md", "---\nname: local-mirror\n---\nMirror.\n");
  writeFile(sourceDir, "templates/fr/engine-skills/local-mirror/SKILL.md", "---\nname: local-mirror\n---\nRéplique.\n");

  assert.deepEqual(installStagedSkills({ sourceDir, brainDir }), ["local-mirror"]);
});

test("installStagedSkills — a stray FILE at the staging root is not a skill, and installs nothing", (t) => {
  // A mutant deleted the directory test and every assertion stayed green: nothing had
  // ever put a plain file in `engine-skills/`. A README, a `.DS_Store` or an index would
  // be reported to the owner as a skill they now have, and copied file-by-file into a
  // directory named after it.
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/README.md", "What this staging directory is for.\n");
  writeFile(sourceDir, "engine-skills/local-mirror/SKILL.md", "---\nname: local-mirror\n---\nMirror.\n");

  const installed = installStagedSkills({ sourceDir, brainDir });

  assert.deepEqual(installed, ["local-mirror"], "only directories are skills");
  assert.ok(!existsSync(join(brainDir, ".claude/skills/README.md")), "a stray file must not be installed as a skill");
});

// ═══════════════════════════════════════════════════════════════════════════
// proveStagedSkills — THE PROOF THAT CANNOT DRIFT (#115)
//
// 🚨 THE DEFECT. `readStagedProvenance` above answers "is what is installed still what
// we delivered?" with the brain's OWN `engine-skills/` copy. That holds only while the
// staging tree and the installed skill move TOGETHER — and on the two-pass update out
// of an old engine they do not: the old parent copies `engine-skills/**` (a `replace`
// glob) before any refresh exists to advance the installed skill. From that update on
// the two disagree FOR EVER, `mergeVerdict` reads the installed file as an owner edit,
// and every later release drops a `.new` sidecar while calling a file the owner has
// never opened "customized".
//
// 🛑 THE PROOF IS MEMBERSHIP, NEVER ARITHMETIC — the rule `engine-heal.mjs` was built
// on, and it is what keeps this safe. A digest is recorded only because the installed
// bytes are RECOGNISED in the table of every version the engine published; it is never
// computed from those bytes. Slip that once and a genuinely edited skill reads as
// untouched, and the next update clobbers the edit this whole surface exists to keep.
//
// Fixtures: every sha256 below was computed OUTSIDE this codebase (`shasum -a 256`),
// so "the right bytes are recognised" cannot be true by construction.
// ═══════════════════════════════════════════════════════════════════════════

const V1 = "---\nname: lint\n---\nLint the vault.\n";
const V2 = "---\nname: lint\n---\nLint the vault.\n\nNow reports orphan notes too.\n";
const MINE = "---\nname: lint\n---\nLint the vault.\n\n## My own rules\nNo orphan meeting notes.\n";
const V1_CRLF = "---\r\nname: lint\r\n---\r\nLint the vault.\r\n";

const SHA_V1 = "sha256:26f5ac114f3987dab9d3607244620cfbaf4987a21935f4430c6259e1c2454fdf";
const SHA_V2 = "sha256:1e9020eb1870b8ff802711f9747f31fe1c4e2c879cb36dd0306de0dfd03b100e";
const SHA_MINE = "sha256:481f48c3a862a554e70bd988763f2bc74641b7bec881ce65e421f2262d89afbb";
const SHA_V1_CRLF = "sha256:d644f789139bae29ad76e9d0c6cef060f7267ce9c5fa14c3cdb974c7df40e464";

const LINT_REL = ".claude/skills/lint/SKILL.md";

const tableWith = (versions) => ({ generatedAt: "v5.5.0", files: { [LINT_REL]: versions } });

const LINT_TABLE = tableWith({
  [SHA_V1]: { since: "v5.2.0", locale: "en" },
  [SHA_V2]: { since: "v5.4.0", locale: "en" },
});

test("proveStagedSkills — a CONTAMINATED brain is recognised: installed bytes the engine really published", (t) => {
  // The exact shape #115 describes, and the one no suite could observe: the staging
  // copy has run ahead to v5.4.0 while the installed skill is still the v5.2.0 the owner
  // received. The stand-in base therefore accuses them of an edit; membership does not.
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/lint/SKILL.md", V2);
  writeFile(brainDir, "engine-skills/lint/SKILL.md", V2);
  writeFile(brainDir, LINT_REL, V1);

  assert.deepEqual(proveStagedSkills({ sourceDir, brainDir, table: LINT_TABLE }), {
    [LINT_REL]: SHA_V1,
  });
});

test("proveStagedSkills — an OWNER'S EDIT is recognised by nothing, so the stand-in still governs", (t) => {
  // The companion pole, and the one that protects owners. These bytes match no published
  // version, so no digest may be handed out — an entry here would make an edited file
  // read as untouched, and the next update would fast-forward straight over it.
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/lint/SKILL.md", V2);
  writeFile(brainDir, "engine-skills/lint/SKILL.md", V1);
  writeFile(brainDir, LINT_REL, MINE);

  assert.deepEqual(proveStagedSkills({ sourceDir, brainDir, table: LINT_TABLE }), {});
});

test("proveStagedSkills — the digest handed out is the KEY THAT MATCHED, never one computed from the disk", (t) => {
  // A Windows brain holds CRLF bytes nobody typed. They are recognised through the same
  // EOL normalisation `verifyBase` forgives — and what is recorded is the table's LF key,
  // the bytes the engine actually shipped. Record the CRLF digest instead and the proof
  // has become arithmetic: the very next release would find no row for it.
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/lint/SKILL.md", V2);
  writeFile(brainDir, LINT_REL, V1_CRLF);

  const proven = proveStagedSkills({ sourceDir, brainDir, table: LINT_TABLE });

  assert.deepEqual(proven, { [LINT_REL]: SHA_V1 });
  assert.notEqual(proven[LINT_REL], SHA_V1_CRLF, "the digest may never be computed from the installed bytes");
});

test("proveStagedSkills — a skill the table cannot place yields nothing, and does not throw", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/open-note/SKILL.md", V2);
  writeFile(brainDir, ".claude/skills/open-note/SKILL.md", V1);

  assert.deepEqual(proveStagedSkills({ sourceDir, brainDir, table: LINT_TABLE }), {});
});

test("proveStagedSkills — NO table at all recognises nothing: a broken release proves less, never more", (t) => {
  // `readFingerprintTable` answers `null` for both an absent and a corrupt table, and
  // fail-soft means we recognise nothing today — never that we invent a digest.
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/lint/SKILL.md", V2);
  writeFile(brainDir, LINT_REL, V1);

  assert.deepEqual(proveStagedSkills({ sourceDir, brainDir, table: null }), {});
});

test("proveStagedSkills — a staged skill the brain has NOT installed yields nothing", (t) => {
  // install-if-absent will deliver it whole this very pass. Reading a missing file must
  // be silence, not a crash that takes the update down before a single skill is written.
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/lint/SKILL.md", V2);

  assert.deepEqual(proveStagedSkills({ sourceDir, brainDir, table: LINT_TABLE }), {});
});

test("proveStagedSkills — every file of the subtree is proven on its own, not just SKILL.md", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  const refRel = ".claude/skills/lint/references/rules.md";
  writeFile(sourceDir, "engine-skills/lint/SKILL.md", V2);
  writeFile(sourceDir, "engine-skills/lint/references/rules.md", V2);
  writeFile(brainDir, LINT_REL, V1);
  writeFile(brainDir, refRel, V1);

  assert.deepEqual(
    proveStagedSkills({
      sourceDir,
      brainDir,
      table: { generatedAt: "v5.5.0", files: { [LINT_REL]: LINT_TABLE.files[LINT_REL], [refRel]: { [SHA_V1]: { since: "v5.2.0", locale: "en" } } } },
    }),
    { [LINT_REL]: SHA_V1, [refRel]: SHA_V1 },
  );
});

test("proveStagedSkills — a SELF-HEAL proves nothing: no skill is refreshed, so no base is needed", (t) => {
  // `sourceDir === brainDir` is SessionStart, where all three refresh families stand
  // down. Reading the whole installed skills tree there would be work paid at every
  // session for an answer nobody consumes.
  const { brainDir } = freshDirs(t);
  writeFile(brainDir, "engine-skills/lint/SKILL.md", V2);
  writeFile(brainDir, LINT_REL, V1);

  assert.deepEqual(proveStagedSkills({ sourceDir: brainDir, brainDir, table: LINT_TABLE }), {});
});

test("proveStagedSkills — a source with no staging dir at all proves nothing, and does not throw", (t) => {
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(brainDir, LINT_REL, V1);

  assert.deepEqual(proveStagedSkills({ sourceDir, brainDir, table: LINT_TABLE }), {});
});

test("proveStagedSkills — a stray FILE at the staging root is not a skill, and is never proven", (t) => {
  // The same pole `installStagedSkills` carries one door along: `engine-skills/README.md`
  // would map to `.claude/skills/README.md`, which is not a skill and not a rel any brain
  // installs at. Proving it would put a phantom in the base map the refresh reads.
  const { sourceDir, brainDir } = freshDirs(t);
  writeFile(sourceDir, "engine-skills/README.md", V1);
  writeFile(brainDir, ".claude/skills/README.md", V1);

  assert.deepEqual(
    proveStagedSkills({
      sourceDir,
      brainDir,
      table: { generatedAt: "v5.5.0", files: { ".claude/skills/README.md": { [SHA_V1]: { since: "v5.2.0", locale: "en" } } } },
    }),
    {},
  );
});
