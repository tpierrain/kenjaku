import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  localeOwnedPaths,
  selectEngineFilesToCopy,
  resolveLocaleSource,
  findDeliveryCopies,
} from "./engine-copy-select.mjs";
import { stripComments } from "./source-scan.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ── resolveLocaleSource: WHICH source file to deliver to a brain of a given locale ──
// The twin of localeOwnedPaths: that one EXCLUDES locale-owned paths from the blind
// copy; this one RESOLVES a rel path to the source the brain's locale should get
// (Increment 2.5, trap T2 — refreshing a FR brain from the root would re-anglicize it).
test("resolveLocaleSource — the default-locale brain reads the ROOT file", () => {
  assert.equal(
    resolveLocaleSource({
      rel: ".claude/skills/coach/SKILL.md",
      locale: "en",
      sourceFiles: [".claude/skills/coach/SKILL.md", "templates/fr/.claude/skills/coach/SKILL.md"],
    }),
    ".claude/skills/coach/SKILL.md",
  );
});

test("resolveLocaleSource — a FR brain reads its OWN localized source, not the root one", () => {
  assert.equal(
    resolveLocaleSource({
      rel: ".claude/skills/coach/SKILL.md",
      locale: "fr",
      sourceFiles: [".claude/skills/coach/SKILL.md", "templates/fr/.claude/skills/coach/SKILL.md"],
    }),
    "templates/fr/.claude/skills/coach/SKILL.md",
  );
});

test("resolveLocaleSource — no source in the brain's locale → the ROOT file, never another locale's", () => {
  // `switch` and `local-mirror` ship EN-only today. Falling back to the root is the
  // safe answer: it is exactly what the FR brain received at install, so refreshing
  // from it is a same-language update — never a regression, and never a Spanish skill.
  assert.equal(
    resolveLocaleSource({
      rel: ".claude/skills/switch/SKILL.md",
      locale: "fr",
      sourceFiles: [
        ".claude/skills/switch/SKILL.md",
        "templates/es/.claude/skills/switch/SKILL.md", // another locale → must NOT be picked
        "templates/fr/.claude/skills/coach/SKILL.md", // FR exists, but for another skill
      ],
    }),
    ".claude/skills/switch/SKILL.md",
  );
});

// ── localeOwnedPaths: which rel paths a locale OWNS (from templates/<locale>/<rel>) ──
test("localeOwnedPaths — derives the owned rel from templates/<locale>/<rel>", () => {
  const owned = localeOwnedPaths([
    "templates/fr/scripts/lib/demo-locale.mjs",
    "templates/fr/CLAUDE.md.template",
    "templates/en/scripts/lib/demo-locale.mjs",
    "scripts/lib/demo-locale.mjs", // a ROOT file is not locale-owned
    "rag/src/index.ts",
  ]);
  assert.ok(owned.has("scripts/lib/demo-locale.mjs"), "demo-locale.mjs is owned by a locale");
  assert.ok(owned.has("CLAUDE.md.template"), "the constitution template is locale-owned");
  assert.equal(owned.has("rag/src/index.ts"), false, "a plain engine file is not locale-owned");
});

// ── F1: the dev-only files under scripts/lib/** must never be copied to a brain ──
test("selectEngineFilesToCopy — F1: drops dev-only (eval-*, mcp-search) even when the glob is scripts/lib/**", () => {
  const sourceFiles = [
    "rag/src/index.ts",
    "scripts/lib/engine-fetch.mjs", // a real engine lib → copied
    "scripts/lib/eval-set.mjs", // dev-only → NOT copied
    "scripts/lib/eval-run.test.mjs", // dev-only → NOT copied
    "scripts/lib/mcp-search.mjs", // dev-only → NOT copied
  ];
  const copyGlobs = ["rag/src/**", "scripts/lib/**"];

  const selected = selectEngineFilesToCopy({ sourceFiles, copyGlobs });

  assert.ok(selected.includes("rag/src/index.ts"));
  assert.ok(selected.includes("scripts/lib/engine-fetch.mjs"));
  assert.equal(selected.includes("scripts/lib/eval-set.mjs"), false, "eval-* must not leak into a brain");
  assert.equal(selected.includes("scripts/lib/eval-run.test.mjs"), false);
  assert.equal(selected.includes("scripts/lib/mcp-search.mjs"), false, "mcp-search must not leak into a brain");
});

// ── F2: the locale-owned demo-locale.mjs must be KEPT (not overwritten by the root) ──
test("selectEngineFilesToCopy — F2: excludes locale-owned files so the brain keeps its installed locale", () => {
  const sourceFiles = [
    "rag/src/index.ts",
    "scripts/lib/demo-locale.mjs", // ROOT (en) → matches scripts/lib/** but is locale-owned → NOT copied
    "templates/fr/scripts/lib/demo-locale.mjs", // the fr owner (under templates/, never copied anyway)
    "templates/en/scripts/lib/demo-locale.mjs",
  ];
  const copyGlobs = ["rag/src/**", "scripts/lib/**"];

  const selected = selectEngineFilesToCopy({ sourceFiles, copyGlobs });

  assert.ok(selected.includes("rag/src/index.ts"));
  assert.equal(
    selected.includes("scripts/lib/demo-locale.mjs"),
    false,
    "demo-locale.mjs is locale-owned → update-engine must not overwrite the brain's installed locale (fr→en regression)",
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// findDeliveryCopies — the CENSUS of the doors that deliver engine bytes into a brain.
//
// T10 (third v5.0.0 review pass) was reported against ONE call site and there were
// THREE, each copying the ROOT rel into a French brain. What failed was a hand-audit of
// a rule spelled out in several places: a locale-blind copy reads exactly like a correct
// one. Same remedy as T8's — a pure scanner, and one repo-wide fail-loud test below.
// ═════════════════════════════════════════════════════════════════════════════

test("findDeliveryCopies — reports a copy call with its line and the line's own text", () => {
  const source = ["const a = 1;", "copyFileSync(src, dest);", "const b = 2;"].join("\n");

  assert.deepEqual(findDeliveryCopies(source), [{ line: 2, text: "copyFileSync(src, dest);" }]);
});

test("findDeliveryCopies — finds EVERY call, not just the first", () => {
  // The three doors T10 turned up were three separate call sites; a scanner that stops at
  // the first would have reported the file that was already fixed and missed the others.
  const source = ["copyFileSync(a, b);", "if (x) {", "  copyFileSync(c, d);", "}"].join("\n");

  assert.deepEqual(findDeliveryCopies(source), [
    { line: 1, text: "copyFileSync(a, b);" },
    { line: 3, text: "copyFileSync(c, d);" },
  ]);
});

test("findDeliveryCopies — reads code, not prose: a call named in a comment is an explanation", () => {
  // Every file this guard protects documents the rule, and the documentation names the
  // call. Flagging those would make the census unusable by the very files it aims at.
  const source = [
    "// then copyFileSync(src, dest) delivers the resolved source",
    "/* the old shape was copyFileSync(join(dir, rel), dest) */",
    "const ok = true;",
  ].join("\n");

  assert.deepEqual(findDeliveryCopies(source), []);
});

test("findDeliveryCopies — a MENTION is not a call: imports and destructured seams are neither", () => {
  // `obsidian-register.mjs` names it three times without calling it once. A census that
  // counted mentions would classify files that deliver nothing.
  const source = [
    'import { existsSync, copyFileSync } from "node:fs";',
    "const { readFileSync, copyFileSync, writeFileSync } = seams;",
    "const fn = copyFileSync;",
  ].join("\n");

  assert.deepEqual(findDeliveryCopies(source), []);
});

test("findDeliveryCopies — whatever the whitespace, including a call wrapped onto the next line", () => {
  // A formatter breaks a long call after the opening name, and `copyFileSync (x, y)` is
  // what a hand types. A census a line break defeats is a census nobody can rely on.
  const source = ["copyFileSync (a, b);", "copyFileSync(", "  join(dir, rel),", "  dest,", ");"].join("\n");

  assert.deepEqual(findDeliveryCopies(source), [
    { line: 1, text: "copyFileSync (a, b);" },
    { line: 2, text: "copyFileSync(" },
  ]);
});

test("findDeliveryCopies — a name that merely ENDS in the call's name is a different function", () => {
  // Without the word boundary, a future `safeCopyFileSync` wrapper would be reported at
  // its definition and at every call — and a census that cries about the wrong line is
  // one people widen instead of read.
  assert.deepEqual(findDeliveryCopies("safeCopyFileSync(a, b);\nmyCopyFileSync(c, d);"), []);
});

test("findDeliveryCopies — a call on the LAST line, with no trailing newline, is reported WHOLE", () => {
  // Two mutants survived the first pass here, and both flipped the same branch: with no
  // trailing newline there is no `\n` to find, and the fallback to the end of the source
  // is what stops the reported text losing its last character. A census whose evidence is
  // truncated is one people stop believing — and "no newline at end of file" is not an
  // exotic fixture, it is what a hand-written last line looks like.
  assert.deepEqual(findDeliveryCopies("const a = 1;\ncopyFileSync(src, dest);"), [
    { line: 2, text: "copyFileSync(src, dest);" },
  ]);
});

// ── The repo-wide half: the whole set of doors, pinned ───────────────────────
// Each entry is a VERDICT, not an allowance. `locale-resolved` means the file must go
// through ADR 0040 rule 3; the exemptions say, in words, why the bytes they copy are not
// an engine delivery. A new file that copies is neither, so it fails until it is judged.
const DELIVERY_DOORS = {
  "scripts/lib/reconcile-brain.mjs": "locale-resolved",
  "scripts/lib/staged-skills.mjs": "locale-resolved",
  "scripts/lib/staged-health-note.mjs": "locale-resolved",
  // Copies the OWNER's Obsidian config to a backup before rewriting it. Their file, their
  // bytes, no source tree involved.
  "scripts/lib/obsidian-register.mjs": "not-an-engine-delivery",
  // Copies the OWNER's own notes out of a previous brain. Their prose is in whatever
  // language they wrote it; resolving a locale over it would be vandalism.
  "scripts/lib/import-vault.mjs": "not-an-engine-delivery",
  // Applies `templates/<locale>/` as a whole-tree OVERLAY after the bulk copy, which is
  // rule 3 performed wholesale — and it is what writes the brain's locale marker in the
  // first place, so it cannot read one.
  "installer.mjs": "not-an-engine-delivery",
};

function repoSources() {
  return [
    "installer.mjs",
    ...["scripts", "scripts/lib"].flatMap((dir) =>
      readdirSync(join(REPO_ROOT, dir))
        .filter((name) => name.endsWith(".mjs") && !name.endsWith(".test.mjs"))
        .map((name) => `${dir}/${name}`),
    ),
  ].sort();
}

test("the scanned set is the whole engine plus the installer, not an accident of one folder", () => {
  // The anti-vacuity companion (T7): a census that quietly stops looking at anything
  // stays green forever, and the doors it is aimed at live in three different places.
  const sources = repoSources();

  assert.ok(sources.length >= 40, `only ${sources.length} sources listed`);
  for (const rel of ["installer.mjs", "scripts/lib/staged-skills.mjs", "scripts/lib/reconcile-brain.mjs"]) {
    assert.ok(sources.includes(rel), `${rel} is not being scanned — is this census still aimed right?`);
  }
});

test("every file that DELIVERS bytes into a brain has been judged on the locale rule", () => {
  const copying = repoSources().filter((rel) => findDeliveryCopies(readFileSync(join(REPO_ROOT, rel), "utf8")).length > 0);

  assert.deepEqual(
    copying.sort(),
    Object.keys(DELIVERY_DOORS).sort(),
    `The set of files that copy a file has changed. Every one of them is a door into somebody's
brain, and T10 found THREE that delivered the English bytes to a French one because the
question was never asked of them. Add the file to DELIVERY_DOORS with a verdict:
"locale-resolved" if it delivers engine content (then route it through resolveLocaleSource),
or "not-an-engine-delivery" with the reason in a comment beside it.`,
  );
});

test("every delivery door judged 'locale-resolved' actually goes through the resolver", () => {
  // The verdict is a claim about the code, and a claim nothing checks is how a door that
  // used to resolve stops resolving. This is what would have gone red on the three T10
  // sites before the fix — and what goes red the day one of them is rewritten.
  const unresolved = Object.entries(DELIVERY_DOORS)
    .filter(([, verdict]) => verdict === "locale-resolved")
    .map(([rel]) => rel)
    .filter((rel) => !stripComments(readFileSync(join(REPO_ROOT, rel), "utf8")).includes("resolveLocaleSource"));

  assert.deepEqual(unresolved, [], `declared locale-resolved but never calls resolveLocaleSource: ${unresolved.join(", ")}`);
});
