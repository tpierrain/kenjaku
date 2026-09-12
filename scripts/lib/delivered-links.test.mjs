import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

import { parseLsFilesZ, filterCopyable } from "./tracked-files.mjs";
import {
  installedRel,
  markdownLinkTargets,
  resolveDeliveredLink,
  deadDeliveredLinks,
} from "./delivered-links.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// The field failure these tests exist for (#78): `README.md` is copied into every
// brain and links a dozen times into `maintainers/`, which no brain receives — so an
// owner following one of those links from inside their own brain lands nowhere. The
// probe that found it reported ~24 candidates and could not say which were real,
// because `engine-skills/<name>/SKILL.md` is installed at `.claude/skills/<name>/`:
// its relative links are right in a brain and wrong in this repo.
//
// So the discriminating test is not "does this path exist here". It is "does it
// exist THERE" — and the two cases below that matter most are the pair that a
// repo-relative checker gets exactly backwards.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("a staged skill is judged from .claude/skills/, which is where its owner reads it", () => {
  // The whole point of the module. `engine-skills/` is a staging path the installer
  // copies into the sacred skills directory, so a link that walks up one level lands
  // beside its sibling skill in a brain and nowhere at all in this tree.
  assert.equal(installedRel("engine-skills/local-mirror/SKILL.md"), ".claude/skills/local-mirror/SKILL.md");
  assert.equal(installedRel("engine-skills/mcp-token-expired/references/a.md"), ".claude/skills/mcp-token-expired/references/a.md");
});

test("a localized artifact is judged from the path the overlay gives it", () => {
  // `templates/<locale>/**` is overlaid onto the brain at the relative path below the
  // locale, so `templates/fr/CLAUDE.md` IS the brain's `CLAUDE.md`.
  assert.equal(installedRel("templates/fr/CLAUDE.md"), "CLAUDE.md");
  assert.equal(installedRel("templates/fr/.claude/skills/switch/SKILL.md"), ".claude/skills/switch/SKILL.md");
});

test("everything else keeps the path it already has", () => {
  assert.equal(installedRel("README.md"), "README.md");
  assert.equal(installedRel("docs/duo-mode.md"), "docs/duo-mode.md");
  assert.equal(installedRel(".claude/skills/switch/SKILL.md"), ".claude/skills/switch/SKILL.md");
});

test("the rewrite matches a whole path SEGMENT, never a prefix of a longer name", () => {
  // 🪤 A `startsWith("engine-skills")` would swallow `engine-skillset/` and
  // `engine-skills-notes.md`, silently relocating files the installer never moves —
  // and a wrongly relocated file makes its links resolve against a directory that
  // does not exist, which reads as a dead link nobody can explain.
  assert.equal(installedRel("engine-skillset/a/SKILL.md"), "engine-skillset/a/SKILL.md");
  assert.equal(installedRel("engine-skills-notes.md"), "engine-skills-notes.md");
  assert.equal(installedRel("templates-old/fr/CLAUDE.md"), "templates-old/fr/CLAUDE.md");
});

test("the staging root itself, with nothing under it, is left alone", () => {
  // There is no installed location for a directory the installer never creates a
  // destination for, and inventing `.claude/skills` out of a bare `engine-skills`
  // would be a claim about a file that does not exist.
  assert.equal(installedRel("engine-skills"), "engine-skills");
  assert.equal(installedRel("templates/fr"), "templates/fr");
});

test("link targets are read out of the prose, anchors stripped and externals dropped", () => {
  const md = [
    "See [the setup](SETUP.md) and [a section](docs/duo-mode.md#why).",
    "An [external](https://example.test/x) one, an [address](mailto:a@b.test),",
    "a [bare anchor](#local), and an image ![board](docs/img/board.png).",
    'A [titled link](README.md "The readme") counts once.',
  ].join("\n");

  assert.deepEqual(markdownLinkTargets(md), [
    "SETUP.md",
    "docs/duo-mode.md",
    "docs/img/board.png",
    "README.md",
  ]);
});

test("a link inside a fenced code block is an EXAMPLE, and examples are not links", () => {
  // Measured need, not caution: the delivered README shows shell and Markdown
  // snippets, and a checker that reads them reports dead links against paths nobody
  // ever clicks — which is the class of false positive #78 is about.
  const md = [
    "Real: [one](SETUP.md)",
    "```markdown",
    "[an example](maintainers/whatever.md)",
    "```",
    "Also real: [two](README.md)",
    "And inline `[not a link](maintainers/x.md)` stays out.",
  ].join("\n");

  assert.deepEqual(markdownLinkTargets(md), ["SETUP.md", "README.md"]);
});

test("an unterminated fence swallows the rest of the file rather than guessing", () => {
  // A fence that is never closed means the author is mid-example; reading its
  // contents as links is the guess that produces noise.
  const md = ["Real: [one](SETUP.md)", "```", "[example](maintainers/x.md)"].join("\n");
  assert.deepEqual(markdownLinkTargets(md), ["SETUP.md"]);
});

test("what opens and closes a fence follows Markdown, not a loose guess", () => {
  // Each pole here is a survivor of the first mutation run (74.29 %), and each one is
  // a line this repo's own delivered prose actually contains.
  const cases = [
    // An indented fence is a fence — Markdown allows up to three leading spaces.
    { md: "   ```\n[x](maintainers/a.md)\n   ```\n[real](SETUP.md)", expect: ["SETUP.md"] },
    // A fence marker must OPEN the line. Mid-sentence backticks are prose.
    { md: "Type ``` to open a block. [real](SETUP.md)", expect: ["SETUP.md"] },
    // A line that starts with inline code is not a fence: one backtick is not three.
    { md: "`node x` then [real](SETUP.md)", expect: ["SETUP.md"] },
    // 🪤 And a line starting with a single tilde is a HOME PATH, not a fence.
    { md: "~/Documents holds it. [real](SETUP.md)", expect: ["SETUP.md"] },
    // A backtick fence is not closed by a tilde one, so the link between stays hidden.
    { md: "```\n[hidden](maintainers/a.md)\n~~~\n[also hidden](maintainers/b.md)", expect: [] },
    // A four-backtick fence is not closed by three (that is how you show a fence
    // inside a fence, and the delivered README does exactly that).
    { md: "````\n```\n[hidden](maintainers/a.md)\n```\n````\n[real](SETUP.md)", expect: ["SETUP.md"] },
  ];

  assert.deepEqual(
    cases.map((c) => markdownLinkTargets(c.md)),
    cases.map((c) => c.expect),
  );
});

test("lines are kept SEPARATE, so a label and a parenthesis on two lines are not a link", () => {
  // `](` must be adjacent for Markdown to see a link. Joining the lines without the
  // newline would invent one out of two innocent lines.
  assert.deepEqual(markdownLinkTargets("[a label]\n(maintainers/x.md)"), []);
});

test("a link label may itself contain brackets", () => {
  assert.deepEqual(markdownLinkTargets("[see [the note]](SETUP.md)"), ["SETUP.md"]);
});

test("the angle-bracket form is unwrapped, which is how a target with a space is written", () => {
  // Six survivors sat on this one line because nothing exercised the form at all.
  assert.deepEqual(markdownLinkTargets("[a](<docs/a note.md>)"), ["docs/a note.md"]);
  // Unwrapping belongs to the EXTRACTOR alone: the resolver is handed a path, and a
  // path with a space in it is an ordinary path.
  assert.equal(resolveDeliveredLink("README.md", "docs/a note.md"), "docs/a note.md");
  // A stray angle on one side only is part of the path, not a wrapper to strip.
  assert.deepEqual(markdownLinkTargets("[a](<docs/a.md)"), ["<docs/a.md"]);
  assert.deepEqual(markdownLinkTargets("[a](docs/a.md>)"), ["docs/a.md>"]);
});

test("padding and a title are trimmed off the target, in either quote", () => {
  assert.deepEqual(markdownLinkTargets("[a](  SETUP.md  )"), ["SETUP.md"]);
  assert.deepEqual(markdownLinkTargets("[a](SETUP.md 'The setup')"), ["SETUP.md"]);
  assert.deepEqual(markdownLinkTargets('[a](SETUP.md  "The setup"  )'), ["SETUP.md"]);
  assert.deepEqual(markdownLinkTargets("[a](< SETUP.md >)"), ["SETUP.md"]);
});

test("a colon INSIDE a path is not a scheme", () => {
  // 🪤 The pole has to put LETTERS immediately before the colon, or an unanchored
  // scheme test passes the test by luck: `2026:` cannot start a scheme (a scheme
  // starts with a letter), so a dated name proves nothing. `notes:` can, and only the
  // `^` keeps it a path.
  assert.deepEqual(markdownLinkTargets("[a](docs/notes:1.md)"), ["docs/notes:1.md"]);
  assert.equal(resolveDeliveredLink("README.md", "docs/notes:1.md"), "docs/notes:1.md");
});

test("stripping an inline code span must not GLUE a link together", () => {
  // What the mutation run made visible: removing the span outright turns
  // `[label]` `code` `(target)` into a link nobody wrote. Inventing a link is the
  // same defect as missing one, and a checker that invents them reports files that
  // are fine.
  assert.deepEqual(markdownLinkTargets("[a label]`some code`(maintainers/x.md)"), []);
});

test("a link to a DIRECTORY keeps its trailing slash, because the delivery answers for directories too", () => {
  // The delivered README links at `maintainers/decisions/`. A checker that discarded
  // trailing-slash targets would miss the one link pointing at a whole dev-only tree.
  assert.deepEqual(markdownLinkTargets("[the ADRs](maintainers/decisions/)"), ["maintainers/decisions/"]);
  assert.equal(resolveDeliveredLink("README.md", "maintainers/decisions/"), "maintainers/decisions/");
});

test("a relative link is resolved from the file's INSTALLED directory", () => {
  // The pair that a repo-relative checker gets backwards, side by side.
  assert.equal(
    resolveDeliveredLink("engine-skills/local-mirror/SKILL.md", "../sync-sources/SKILL.md"),
    ".claude/skills/sync-sources/SKILL.md",
  );
  assert.equal(resolveDeliveredLink("docs/duo-mode.md", "../README.md"), "README.md");
  assert.equal(resolveDeliveredLink("README.md", "maintainers/decisions/0009.md"), "maintainers/decisions/0009.md");
  assert.equal(resolveDeliveredLink("README.md", "./SETUP.md"), "SETUP.md");
});

test("what is not a repo-relative link resolves to nothing at all", () => {
  const notPaths = [
    "https://example.test/x",
    "http://example.test",
    "mailto:a@b.test",
    "file:///etc/hosts",
    "#anchor",
    "/README.md", // absolute: a brain's root is not the repo's
    "",
    null,
    undefined,
  ];
  for (const target of notPaths) {
    assert.equal(resolveDeliveredLink("README.md", target), null, `${target} is not a repo path`);
  }
});

test("a link that climbs out of the delivery is returned, not hidden", () => {
  // It must reach the caller to be REPORTED. Swallowing it here would make the one
  // link that is certainly broken the only one nothing can see.
  assert.equal(resolveDeliveredLink("README.md", "../outside/x.md"), "../outside/x.md");
});

test("the dead ones are the links whose resolved target is not delivered", () => {
  const files = ["README.md", "docs/duo-mode.md"];
  const contents = {
    "README.md": "[gone](maintainers/eval-set.md) and [fine](SETUP.md)",
    "docs/duo-mode.md": "[also gone](../DEVELOPING.md) and [fine](../README.md)",
  };
  const delivered = new Set(["README.md", "SETUP.md", "docs/duo-mode.md"]);

  assert.deepEqual(
    deadDeliveredLinks({ files, read: (rel) => contents[rel], isDelivered: (p) => delivered.has(p) }),
    [
      { file: "README.md", target: "maintainers/eval-set.md", resolved: "maintainers/eval-set.md" },
      { file: "docs/duo-mode.md", target: "../DEVELOPING.md", resolved: "DEVELOPING.md" },
    ],
  );
});

test("a delivery with nothing broken in it reports nothing", () => {
  // The negative case, and it is the one the guard below depends on: a scanner that
  // cannot return an empty list turns every release into a false alarm.
  assert.deepEqual(
    deadDeliveredLinks({
      files: ["README.md"],
      read: () => "[fine](SETUP.md) and [also fine](docs/duo-mode.md)",
      isDelivered: () => true,
    }),
    [],
  );
});

test("a file the scanner cannot read is reported, never skipped in silence", () => {
  // A read that throws must not be the quiet way a file leaves the audit.
  const found = deadDeliveredLinks({
    files: ["README.md"],
    read: () => {
      throw new Error("EACCES");
    },
    isDelivered: () => true,
  });
  assert.deepEqual(found, [{ file: "README.md", target: null, resolved: null, unreadable: "EACCES" }]);
});

test("and something thrown that is NOT an Error is still reported, not crashed on", () => {
  // A `throw "boom"` has no `.message`, and a reporter that assumes one turns an
  // unreadable file into a crash of the whole audit.
  //
  // 🪤 A string is NOT enough to prove it: `"boom".message` is merely undefined, so
  // reading it without the optional chain works by accident. Only a thrown `null`
  // separates the two — which is why both are poled here.
  const thrown = (value) =>
    deadDeliveredLinks({
      files: ["README.md"],
      read: () => {
        throw value;
      },
      isDelivered: () => true,
    });

  assert.deepEqual(thrown("boom"), [{ file: "README.md", target: null, resolved: null, unreadable: "boom" }]);
  assert.deepEqual(thrown(null), [{ file: "README.md", target: null, resolved: null, unreadable: "null" }]);
});

test("what is not a path is never put to the delivered-set question", () => {
  // The membership test is the caller's, and it is written for paths. Handing it a
  // null because a link happened to be a `mailto:` is how a guard dies on the one
  // file that had an external link in it.
  assert.deepEqual(
    deadDeliveredLinks({
      files: ["README.md"],
      read: () => "[a](https://example.test) [b](#here) [c](mailto:x@y.test)",
      isDelivered: (p) => {
        assert.ok(typeof p === "string" && p.length > 0, `asked about a non-path: ${p}`);
        return true;
      },
    }),
    [],
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🚨 THE GUARD — measured against the REAL repository, which is the only version of
// this question anybody cares about. A fixture would prove the fixture.
// ═══════════════════════════════════════════════════════════════════════════
test("no delivered file links anywhere a brain cannot follow", () => {
  const tracked = parseLsFilesZ(
    execFileSync("git", ["-C", REPO_ROOT, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }),
  );
  const deliveredRepoPaths = filterCopyable(tracked);

  // What EXISTS in a brain: every delivered file at its installed path. `engine-skills`
  // and `templates/<locale>` files are delivered at BOTH their staging path and their
  // installed one, so both are in the set.
  const installed = new Set([...deliveredRepoPaths, ...deliveredRepoPaths.map(installedRel)]);
  // A link may point at a directory (`maintainers/decisions/`), which is delivered if
  // anything under it is.
  const isDelivered = (p) => {
    const bare = p.replace(/\/$/, "");
    return installed.has(bare) || [...installed].some((d) => d.startsWith(`${bare}/`));
  };

  const found = deadDeliveredLinks({
    files: deliveredRepoPaths.filter((p) => p.endsWith(".md")),
    read: (rel) => readFileSync(join(REPO_ROOT, rel), "utf8"),
    isDelivered,
  });

  assert.deepEqual(
    found,
    [],
    `a delivered file links where a brain cannot follow:\n${found
      .map((f) => `  ${f.file} → ${f.target} (resolves to ${f.resolved})`)
      .join("\n")}`,
  );
});
