import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { tmpdir } from "node:os";

import { MERGE_TMP_PREFIX, buildMergeFileInvocation, mergeWithGit } from "./engine-merge-git.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-merge-git — the ONE impure half of S2's merge (plan S2a-2).
//
// `engine-merge.mjs` decides; this spawns. Everything here runs against REAL
// git, on real files, because a double proving a subprocess contract proves
// nothing: what this module is for is precisely that the three sides reach
// `git merge-file` in the right roles and come back readable.
//
// The choice being tested, recorded in the plan: a brain IS a git repository
// (the installer runs `git init`, the auto-commit hook runs git every session),
// so this adds no dependency — and a hand-rolled diff3 would have been the
// highest-risk code of the chantier, since a subtle bug destroys an owner's work.
// ═══════════════════════════════════════════════════════════════════════════

const BASE = "# Skill\n\nintro paragraph\n\nbody paragraph\n";
const OURS = "# Skill\n\nintro paragraph, and the owner added this\n\nbody paragraph\n";
const THEIRS = "# Skill\n\nintro paragraph\n\nbody paragraph\n\n## A section the engine added\n\nnew\n";

// The request as a VALUE (CONVENTIONS.md §5ter), asserted whole. This is the
// strongest form of the roles assertion: the ours/theirs inversion is a three-way
// merge's silent catastrophe (swapped, git returns a plausible file in which the
// engine wins every region the owner touched), and here the order is visible in
// one object rather than inferred from marker lines. The labels ride in the SAME
// order as the paths, which is the pairing git has no way to check for us.
test("the git request is a value: three sides and three labels, paired and in order", () => {
  assert.deepEqual(
    buildMergeFileInvocation({
      paths: { ours: "/tmp/x/ours", base: "/tmp/x/base", theirs: "/tmp/x/theirs" },
      labels: { theirs: "engine v9.9.9" },
      gitBin: "/usr/bin/git",
    }),
    {
      command: "/usr/bin/git",
      args: [
        "merge-file",
        "-p",
        "--diff3",
        "-L",
        "your version",
        "-L",
        "engine base",
        "-L",
        "engine v9.9.9",
        "/tmp/x/ours",
        "/tmp/x/base",
        "/tmp/x/theirs",
      ],
      options: { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    },
  );
});

// The case this whole chantier exists for: the owner edited one region, the engine
// another. Today it costs the owner the update (preserve = abandon); here both land.
test("a clean three-way merge keeps the owner's edit AND takes the engine's update", () => {
  const { clean, merged } = mergeWithGit({ base: BASE, ours: OURS, theirs: THEIRS });
  assert.equal(clean, true);
  assert.equal(merged, "# Skill\n\nintro paragraph, and the owner added this\n\nbody paragraph\n\n## A section the engine added\n\nnew\n");
});

// The only case that costs a human anything. What matters is not merely `clean:
// false` — it is that the marked-up text still carries BOTH sides, or the owner has
// nothing to resolve from.
test("a conflict comes back marked, with both sides and the base still readable", () => {
  const ours = "# Skill\n\nthe owner's own sentence\n";
  const theirs = "# Skill\n\nthe engine's new sentence\n";
  const { clean, merged } = mergeWithGit({ base: "# Skill\n\nthe original sentence\n", ours, theirs });
  assert.equal(clean, false);
  for (const fragment of ["the owner's own sentence", "the engine's new sentence", "the original sentence"]) {
    assert.ok(merged.includes(fragment), `the marked merge must still carry: ${fragment}`);
  }
});

// The ours/theirs inversion is a three-way merge's silent catastrophe: swapped, git
// still returns a plausible file — in which the engine wins every region the owner
// touched. The labels are what make the roles VISIBLE in the file the owner opens,
// so they are asserted verbatim, and in order: their side first.
test("the labels name the three sides, in the owner-first order", () => {
  const { merged } = mergeWithGit({
    base: "one\n",
    ours: "OURS\n",
    theirs: "THEIRS\n",
    labels: { ours: "your version", base: "engine base", theirs: "engine v9.9.9" },
  });
  const marks = merged.split("\n").filter((line) => /^[<|=>]{7}/.test(line));
  assert.deepEqual(marks, ["<<<<<<< your version", "||||||| engine base", "=======", ">>>>>>> engine v9.9.9"]);
});

// The same, without labels: a caller that supplies none must still get a file whose
// markers say something, never git's temp-file paths (which name nothing an owner
// could recognise, and leak this machine's tmpdir into their skill).
test("without labels, the markers still name the sides and never leak a temp path", () => {
  const { merged } = mergeWithGit({ base: "one\n", ours: "OURS\n", theirs: "THEIRS\n" });
  const marks = merged.split("\n").filter((line) => /^[<|>]{7}/.test(line));
  assert.deepEqual(marks, ["<<<<<<< your version", "||||||| engine base", ">>>>>>> engine update"]);
  assert.ok(!merged.includes(tmpdir()), "a marker must never carry this machine's temp path");
});

// Line endings are not authorship, and here they are not a conflict either: a
// Windows brain whose installed file was rewritten LF→CRLF would otherwise see
// EVERY line as changed on both sides, so every merge would be a total conflict and
// the whole fleet would be handed sidecars for whitespace.
test("a CRLF side merges cleanly against LF ones, instead of conflicting on every line", () => {
  const { clean, merged } = mergeWithGit({
    base: BASE,
    ours: OURS.split("\n").join("\r\n"),
    theirs: THEIRS,
  });
  assert.equal(clean, true);
  assert.ok(merged.includes("intro paragraph, and the owner added this"), "the owner's edit must survive");
  assert.ok(merged.includes("## A section the engine added"), "the engine's update must land");
  assert.ok(!merged.includes("\r"), "the merge is delivered in the line endings the engine ships");
});

// An update writes into a brain, so leaving three copies of the owner's files in the
// system temp directory at every merge is a privacy leak, not untidiness.
test("nothing is left behind in the temp directory, on the clean path and the conflict one", () => {
  // The prefix has to name something: a blank one would make the sweep below match
  // every entry in the temp directory and pass on an implementation that merges
  // nothing at all.
  assert.match(MERGE_TMP_PREFIX, /^kenjaku-/);
  const leftovers = () => readdirSync(tmpdir()).filter((entry) => entry.startsWith(MERGE_TMP_PREFIX));
  const before = leftovers();
  assert.equal(mergeWithGit({ base: BASE, ours: OURS, theirs: THEIRS }).clean, true);
  assert.equal(mergeWithGit({ base: "one\n", ours: "OURS\n", theirs: "THEIRS\n" }).clean, false);
  assert.deepEqual(leftovers(), before);
});

// A git that cannot run is a TECHNICAL failure, and it must never come back looking
// like a conflict: a false conflict tells the owner they have work to do and, worse,
// stops the base from advancing — so the file would silently leave the update regime.
// The caller catches this and preserves; what this seam owes is to not lie.
test("a git that cannot run throws, instead of passing itself off as a conflict", () => {
  assert.throws(
    () => mergeWithGit({ base: "one\n", ours: "OURS\n", theirs: "THEIRS\n", gitBin: "kenjaku-no-such-git" }),
    /kenjaku-no-such-git/,
  );
});
