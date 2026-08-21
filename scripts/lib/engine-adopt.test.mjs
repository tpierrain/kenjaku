import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { ANSWERS_REL, readAnswers } from "./engine-answers.mjs";
import { adoptCandidate, planAdoption } from "./engine-adopt.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// S10-5 — the ADOPTION SEAM: the owner's answer, applied to the disk.
//
// 🚨 THE ONE RULE EVERYTHING BELOW SERVES, and § S10-5-0 measured why it matters:
// **the disk takes what the OWNER chose; the base advances to the CANDIDATE.** For
// "take the new one" those coincide. For "combine" they do NOT — and recording the
// combination as the ancestor would make it read *untouched* at the next update,
// which is `engine-merge-apply.mjs`'s own words for row 8. A combination is in no
// fingerprint table, ever, so nothing else can rescue it later.
//
// 🛑 And the mirror trap, on the offer that writes nothing: "keep mine" must NOT
// advance the base. Recording the candidate as the ancestor of a file the owner
// REFUSED would make the next merge treat v5's text as the agreed common origin and
// fold it in silently. That is the same trap inverted, and worse than the freeze.
// ═══════════════════════════════════════════════════════════════════════════

const REL = ".claude/skills/coach/SKILL.md";
// The OTHER merge file in the brain, the one nobody is answering about. A real brain
// has 79 of these; an adoption that only ever runs against a one-file manifest cannot
// show whether it left them alone.
const OTHER = "CLAUDE.md";
const OWNER = "# Coach\nmy own words\n";
const CANDIDATE = "# Coach\nthe engine's newer words\n";
const COMBINED = "# Coach\nmy own words, plus the engine's newer ones\n";

// ── the pure rule ───────────────────────────────────────────────────────────
// `{ write, deliver }` are `mergeVerdict`'s own two words, on purpose: this IS row
// 8's rule, applied by a human instead of by `git merge-file`. Two names for one
// rule is how the two paths would drift apart.

test("planAdoption — take the new one: the disk and the base both take the candidate", () => {
  assert.deepEqual(planAdoption({ decision: "take-theirs", candidate: CANDIDATE }), {
    write: CANDIDATE,
    deliver: CANDIDATE,
  });
});

test("planAdoption — COMBINE: the disk takes the combination, the base takes the CANDIDATE", () => {
  // 🛑 The load-bearing assertion of the slice. `write !== deliver` here, and that
  // inequality is the whole design.
  assert.deepEqual(planAdoption({ decision: "combine", candidate: CANDIDATE, combined: COMBINED }), {
    write: COMBINED,
    deliver: CANDIDATE,
  });
});

test("planAdoption — keep mine: nothing is written and NOTHING is delivered", () => {
  assert.deepEqual(planAdoption({ decision: "keep-mine", candidate: CANDIDATE }), {});
});

test("planAdoption — an unknown decision is REFUSED, never guessed at", () => {
  // A decision this module does not know is a caller bug, and the cheapest wrong
  // answer would be to fall through to "keep mine": silent, plausible, and it would
  // record an answer the owner never gave.
  assert.throws(() => planAdoption({ decision: "take-all", candidate: CANDIDATE }), /take-all/);
});

test("planAdoption — combine with no combination offered is REFUSED", () => {
  // "Combine" is the one decision that carries bytes of its own. Missing them, the
  // only thing left to write would be the candidate — i.e. silently turning a
  // combination into "take the new one", on the offer the owner chose deliberately.
  assert.throws(() => planAdoption({ decision: "combine", candidate: CANDIDATE }), /combine/);
});

// ── the seam on a real brain ────────────────────────────────────────────────

function brain(t, { answers } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sbg-adopt-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const write = (rel, content) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), content);
  };
  write(REL, OWNER);
  write(`${REL}.new`, CANDIDATE);
  write(OTHER, "# CLAUDE\nsomeone else's business\n");
  write(
    "engine-manifest.json",
    JSON.stringify({
      regimes: { merge: [REL, OTHER] },
      provenance: {
        [REL]: "sha256:whatever-the-engine-last-delivered",
        [OTHER]: "sha256:untouched-by-this-answer",
      },
      baseRefs: { [REL]: "v4.7.0", [OTHER]: "v4.7.0" },
      source: { ref: "v5.0.0" },
    }),
  );
  if (answers) write(ANSWERS_REL, JSON.stringify(answers));
  return dir;
}

const read = (dir, rel) => readFileSync(join(dir, rel), "utf8");
const manifestOf = (dir) => JSON.parse(read(dir, "engine-manifest.json"));

// A git that says "clean tree", i.e. the common case: `auto-commit` already swept.
const cleanGit = () => ({ out: "", ok: true });
const vetoingGit = (args) => (args[0] === "commit" ? { out: "", ok: false } : { out: " M x\n", ok: true });

test("adoptCandidate — take the new one: the file becomes the candidate and the sidecar is gone", (t) => {
  const dir = brain(t);

  const result = adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: cleanGit });

  assert.equal(result.adopted, true);
  assert.equal(read(dir, REL), CANDIDATE);
  assert.equal(existsSync(join(dir, `${REL}.new`)), false, "a sidecar is an open offer; the choice is made");
});

test("adoptCandidate — COMBINE: the disk holds the combination, the recorded ancestor is the candidate", (t) => {
  const dir = brain(t);

  adoptCandidate({ brainDir: dir, rel: REL, decision: "combine", combined: COMBINED, git: cleanGit });

  assert.equal(read(dir, REL), COMBINED, "the owner's combination is what they keep working in");
  assert.equal(
    read(dir, `.engine-base/${REL}`),
    CANDIDATE,
    "and the ancestor is the ENGINE's version — recording the combination would make it read untouched next time",
  );
});

test("adoptCandidate — the manifest records the candidate's digest and the running version", (t) => {
  const dir = brain(t);
  const before = manifestOf(dir).provenance[REL];

  adoptCandidate({ brainDir: dir, rel: REL, decision: "combine", combined: COMBINED, git: cleanGit });

  const after = manifestOf(dir);
  assert.notEqual(after.provenance[REL], before, "the old digest would still read as a mismatch");
  assert.equal(after.baseRefs[REL], "v5.0.0", "and 'since which version' moves with it");
});

test("adoptCandidate — answering about ONE file does not forget every OTHER file", (t) => {
  // 🛑 The scale defect, invisible on a one-file fixture: an adoption REBUILDS the
  // provenance table, and rebuilding it from nothing would wipe the 78 other engine
  // files' digests. Every one of them would then read as personalized at the next
  // update — the whole fleet raised as questions because one file was answered.
  const dir = brain(t);

  adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: cleanGit });

  const after = manifestOf(dir);
  assert.equal(after.provenance[OTHER], "sha256:untouched-by-this-answer");
  assert.equal(after.baseRefs[OTHER], "v4.7.0", "and it is still held back since the version it really came from");
});

test("adoptCandidate — the answer is recorded AT THE RUNNING VERSION", (t) => {
  const dir = brain(t);

  adoptCandidate({ brainDir: dir, rel: REL, decision: "keep-mine", git: cleanGit });

  assert.deepEqual(readAnswers({ brainDir: dir }), { [REL]: { decision: "keep-mine", at: "v5.0.0" } });
});

test("adoptCandidate — keep mine leaves the file AND the base exactly as they were", (t) => {
  const dir = brain(t);

  const result = adoptCandidate({ brainDir: dir, rel: REL, decision: "keep-mine", git: cleanGit });

  assert.equal(result.adopted, true);
  assert.equal(read(dir, REL), OWNER);
  assert.equal(
    existsSync(join(dir, `.engine-base/${REL}`)),
    false,
    "🛑 recording the candidate as the ancestor of a file they REFUSED would fold v5's text in silently next time",
  );
  assert.equal(manifestOf(dir).provenance[REL], "sha256:whatever-the-engine-last-delivered");
});

test("adoptCandidate — keep mine does not even ASK git: there is nothing to lose", (t) => {
  const dir = brain(t);
  const calls = [];

  adoptCandidate({
    brainDir: dir,
    rel: REL,
    decision: "keep-mine",
    git: (args) => (calls.push(args.join(" ")), { out: "", ok: true }),
  });

  assert.deepEqual(calls, []);
});

test("adoptCandidate — a VETOED safety commit stops everything, and records NO answer", (t) => {
  // 🛑 The sharpest assertion here. Recording the answer on a blocked adoption would
  // make the session nudge go quiet about a file that never changed — the blind spot
  // S10 exists to close, re-created by the very machinery that closes it.
  const dir = brain(t);

  const result = adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: vetoingGit });

  assert.deepEqual(result, { adopted: false, blocked: "refused" });
  assert.equal(read(dir, REL), OWNER, "their file is untouched");
  assert.equal(read(dir, `${REL}.new`), CANDIDATE, "and the offer still stands");
  assert.deepEqual(readAnswers({ brainDir: dir }), {});
  assert.equal(existsSync(join(dir, ".engine-base")), false);
});

// ── the sidecar that is NOT a candidate (found by S10-QA on the v3.6.0 tree) ──────
//
// 🛑 TWO DIFFERENT FILES WEAR THE `.new` SUFFIX, and this seam was built knowing only
// one of them. A `preserve` drops the engine's clean version there (row 3, row 7). A
// CONFLICT drops a three-way merge carrying `<<<<<<<` / `||||||| engine base` /
// `>>>>>>>` markers (row 9) — and S7-5 made conflicts common exactly where S10 looks,
// because a file edited before the release now has a fetchable ancestor and therefore
// reaches the merge path instead of being preserved.
//
// Adopting one blind would paste conflict markers into the live file AND record them
// as the file's new ANCESTOR, so every later merge would diff against a corpse.

const MARKED = `# Coach
<<<<<<< your version
my own words
||||||| engine base
what the engine shipped last time
=======
the engine's newer words
>>>>>>> the engine's new version
`;

test("adoptCandidate — a MARKED merge is never taken blind, and the file is untouched", (t) => {
  const dir = brain(t);
  writeFileSync(join(dir, `${REL}.new`), MARKED);

  const result = adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: cleanGit });

  assert.deepEqual(result, { adopted: false, blocked: "marked-candidate" });
  assert.equal(read(dir, REL), OWNER, "their file must not gain a single marker");
  assert.equal(read(dir, `${REL}.new`), MARKED, "and the marked merge still stands, for the walkthrough");
  assert.deepEqual(readAnswers({ brainDir: dir }), {}, "nothing was decided, so nothing is remembered");
  assert.equal(existsSync(join(dir, ".engine-base")), false, "🛑 and it is NOT recorded as the ancestor");
});

test("adoptCandidate — COMBINE is refused on a marked merge too, because the ANCESTOR would be the markers", (t) => {
  // The near-miss worth its own test: `combine` writes Claude's own bytes, so the live
  // file would be fine — and the base would still take the CANDIDATE, i.e. the markers.
  const dir = brain(t);
  writeFileSync(join(dir, `${REL}.new`), MARKED);

  const result = adoptCandidate({ brainDir: dir, rel: REL, decision: "combine", combined: COMBINED, git: cleanGit });

  assert.deepEqual(result, { adopted: false, blocked: "marked-candidate" });
  assert.equal(read(dir, REL), OWNER);
  assert.equal(existsSync(join(dir, ".engine-base")), false);
});

test("adoptCandidate — KEEP MINE is still allowed on a marked merge: it neither writes nor delivers", (t) => {
  // Refusing this one would trap the owner: their answer is "leave it alone", which is
  // the one thing that is always safe, and the marked merge is exactly what they are
  // declining. Blocking it would keep re-raising a question they already settled.
  const dir = brain(t);
  writeFileSync(join(dir, `${REL}.new`), MARKED);

  const result = adoptCandidate({ brainDir: dir, rel: REL, decision: "keep-mine", git: cleanGit });

  assert.deepEqual(result, { adopted: true });
  assert.equal(read(dir, REL), OWNER);
  assert.equal(existsSync(join(dir, `${REL}.new`)), false, "the offer was declined, so it stops standing");
  assert.equal(existsSync(join(dir, ".engine-base")), false, "and a declined version is never an ancestor");
});

// 🎯 THE OTHER HALF OF THE GUARD, and the mutation score is what demanded it: refusing
// too much is a failure mode of its own. A skill that DOCUMENTS merge markers — and
// `update-engine`'s own Step 4 is heading that way — must stay adoptable, or the engine
// would freeze exactly the file that explains how conflicts look. So both markers count,
// and only at the START OF A LINE; prose that mentions one mid-sentence is prose.
const MENTIONS_MARKERS = `# What a conflict looks like

The engine writes a <<<<<<< opener into the file, and closes with:
>>>>>>> the engine's new version
`;

const MENTIONS_MARKERS_INVERTED = `# What a conflict looks like

<<<<<<< is what opens a conflict block
and the block ends with a >>>>>>> line.
`;

for (const [shape, candidate] of [
  ["only the CLOSING marker starts a line", MENTIONS_MARKERS],
  ["only the OPENING marker starts a line", MENTIONS_MARKERS_INVERTED],
]) {
  test(`adoptCandidate — a file that merely MENTIONS the markers is adoptable (${shape})`, (t) => {
    const dir = brain(t);
    writeFileSync(join(dir, `${REL}.new`), candidate);

    const result = adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: cleanGit });

    assert.deepEqual(result, { adopted: true });
    assert.equal(read(dir, REL), candidate, "the engine's version arrived, markers-in-prose and all");
  });
}

test("adoptCandidate — no sidecar means there is nothing to adopt, and it says so", (t) => {
  const dir = brain(t);
  rmSync(join(dir, `${REL}.new`));

  assert.deepEqual(adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: cleanGit }), {
    adopted: false,
    blocked: "no-candidate",
  });
  assert.equal(read(dir, REL), OWNER);
});

test("adoptCandidate — answering a SECOND file keeps the first answer", (t) => {
  const dir = brain(t, { answers: { "CLAUDE.md": { decision: "keep-mine", at: "v5.0.0" } } });

  adoptCandidate({ brainDir: dir, rel: REL, decision: "keep-mine", git: cleanGit });

  assert.deepEqual(readAnswers({ brainDir: dir }), {
    "CLAUDE.md": { decision: "keep-mine", at: "v5.0.0" },
    [REL]: { decision: "keep-mine", at: "v5.0.0" },
  });
});
