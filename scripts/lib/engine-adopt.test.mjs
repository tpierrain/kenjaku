import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

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

  assert.deepEqual(result, { adopted: true, unreadable: [] });
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

    assert.deepEqual(result, { adopted: true, unreadable: [] });
    assert.equal(read(dir, REL), candidate, "the engine's version arrived, markers-in-prose and all");
  });
}

// ── T5 (third review pass): A BYSTANDER THE FILESYSTEM REFUSED USED TO UNDO THE
//    WHOLE PROMISE ──────────────────────────────────────────────────────────
//
// Reproduced as a PROCESS through the real CLI before a line was written, on a brain
// with one gitignored merge file at mode 000 (the shape `.claude/settings.json` is in on
// every machine). `adopt-engine-file.mjs … take-theirs` exited **1** with an EACCES stack
// trace — and `update-engine/SKILL.md` documents exit 1 to the agent as *"**nothing was
// touched** … do not run it again"*.
//
// What the brain actually looked like at that moment: the owner's file **overwritten**,
// their sidecar — the open offer — **destroyed**, the manifest **rewritten**, and the
// answer **not recorded**, so the nudge would go on offering a file already adopted while
// the agent told them nothing had happened. It contradicted this module's own contract
// verbatim: *"a caller that only checks `adopted` can never be halfway"*.
test("adoptCandidate — an unreadable BYSTANDER cannot undo an adoption that already happened", (t) => {
  if (process.platform === "win32" || process.getuid?.() === 0) {
    t.skip("needs POSIX permissions and a non-root user to be meaningful");
    return;
  }
  const dir = brain(t);
  // Not the file being answered about: the OTHER merge file, which this adoption has no
  // business reading and which the base seeding walks anyway.
  chmodSync(join(dir, OTHER), 0o000);

  let result;
  try {
    result = adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: cleanGit });
  } finally {
    // Restored before the assertions: `brain()`'s cleanup would otherwise die on a file
    // it cannot stat, and the test would fail in its after-hook with the answer green.
    chmodSync(join(dir, OTHER), 0o644);
  }

  // The whole adoption, and `adopted: true` is what the CLI relays and the skill reads.
  // The bystander is NAMED beside it rather than dropped: a caller reading a list has no
  // way to tell a file that was set aside from one that was never there.
  assert.deepEqual(result, { adopted: true, unreadable: [OTHER] });
  assert.equal(read(dir, REL), CANDIDATE);
  assert.equal(existsSync(join(dir, `${REL}.new`)), false, "the offer was answered, so it must be gone");
  assert.notEqual(manifestOf(dir).provenance[REL], "sha256:whatever-the-engine-last-delivered");
  // 🛑 The half whose absence made the old failure permanent: without the answer, the
  // session nudge re-offers a file that was adopted, forever.
  assert.equal(readAnswers({ brainDir: dir })[REL]?.decision, "take-theirs");
});

test("adoptCandidate — and the bystander gets NO ancestor invented from bytes nobody read", (t) => {
  if (process.platform === "win32" || process.getuid?.() === 0) {
    t.skip("needs POSIX permissions and a non-root user to be meaningful");
    return;
  }
  const dir = brain(t);
  chmodSync(join(dir, OTHER), 0o000);
  try {
    adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: cleanGit });
  } finally {
    chmodSync(join(dir, OTHER), 0o644);
  }

  // Surviving the throw must not become "seed whatever". A base recorded for a file this
  // process never read would be a fiction, and the merge that later trusts it is how an
  // update clobbers an edit.
  assert.equal(existsSync(join(dir, `.engine-base/${OTHER}`)), false);
  assert.equal(read(dir, `.engine-base/${REL}`), CANDIDATE, "the ANSWERED file's ancestor still lands");
});

test("adoptCandidate — no sidecar means there is nothing to adopt, and it says so", (t) => {
  const dir = brain(t);
  rmSync(join(dir, `${REL}.new`));

  assert.deepEqual(adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: cleanGit }), {
    adopted: false,
    blocked: "no-candidate",
  });
  assert.equal(read(dir, REL), OWNER);
});

// ═══════════════════════════════════════════════════════════════════════════
// F2 / F9 (v5.0.0 code review) — THE PATH ARRIVES FROM THE CONVERSATION.
//
// `rel` is typed by an agent relaying what a human said (`update-engine/SKILL.md`
// documents `node scripts/adopt-engine-file.mjs <file> …`), and until here it was
// joined onto the brain dir and used. Two holes, both reachable with no hostility at
// all — a confused path, a skill that guessed:
//
//   • it ESCAPED the brain (`../…`), and `.claude/skills/**` is no defence: `**`
//     compiles to `.*`, which crosses `/` and matches `..` as happily as a name;
//   • inside the brain it was just as unguarded — ANY path with a `.new` beside it,
//     including `.env`, `vault/**` and `.engine-base/**`, the last being the exact
//     path the write guard denies the agent, because forging it destroys the owner's
//     edit at the next update.
//
// F9 is the same door seen from the other side: the manifest was parsed AFTER the
// file was overwritten and the sidecar deleted, so a manifest error exited 1 — which
// the skill is told means "nothing was touched" — over a brain already changed.
// One repair answers both: **ask every question before writing the first byte.**
// ═══════════════════════════════════════════════════════════════════════════

// A brain whose merge regime is a SUBTREE glob, which is what a real manifest carries
// (`.claude/skills/coach/**`, `scripts/lib/**`) and what makes the escape reachable.
function globBrain(t, { merge = [".claude/skills/**"] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sbg-adopt-glob-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const write = (rel, content) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), content);
  };
  write(REL, OWNER);
  write(`${REL}.new`, CANDIDATE);
  write(".env", "GOOGLE_GEMINI_API_KEY=super-secret-do-not-leak\n");
  write(".env.new", "GOOGLE_GEMINI_API_KEY=stolen\n");
  write("vault/my-note.md", "# Mollecuisse\n");
  write("vault/my-note.md.new", "# not a note the engine wrote\n");
  write(".engine-base/.claude/skills/coach/SKILL.md", "the recorded ancestor\n");
  write(".engine-base/.claude/skills/coach/SKILL.md.new", "a forged ancestor\n");
  write("engine-manifest.json", JSON.stringify({ regimes: { merge, local: [".engine-base/**"] }, source: { ref: "v5.0.0" } }));
  return dir;
}

test("adoptCandidate — a path that LEAVES the brain is refused, and the file outside is untouched", (t) => {
  const dir = globBrain(t);
  // The neighbour: a real file, beside the brain, with a sidecar planted next to it —
  // everything `adoptCandidate` used to need in order to overwrite it.
  const outsideDir = mkdtempSync(join(tmpdir(), "sbg-adopt-neighbour-"));
  t.after(() => rmSync(outsideDir, { recursive: true, force: true }));
  writeFileSync(join(outsideDir, "notes.md"), "someone else's file\n");
  writeFileSync(join(outsideDir, "notes.md.new"), "the bytes that must never land\n");
  // Both temp dirs are siblings, so this is the plainest escape there is. Asserted
  // rather than assumed: a fixture whose traversal did not actually resolve onto the
  // neighbour would pass against a guard that does nothing.
  const escaping = `../${basename(outsideDir)}/notes.md`;
  assert.equal(resolve(dir, escaping), resolve(outsideDir, "notes.md"), "fixture check: the path really does leave the brain");

  const result = adoptCandidate({ brainDir: dir, rel: escaping, decision: "take-theirs", git: cleanGit });

  assert.deepEqual(result, { adopted: false, blocked: "not-adoptable" });
  assert.equal(readFileSync(join(outsideDir, "notes.md"), "utf8"), "someone else's file\n");
  assert.equal(existsSync(join(outsideDir, "notes.md.new")), true, "the neighbour's file is not the engine's to tidy either");
});

// 🛑 The one a containment test alone would let through, and the reason the spelling is
// checked at all: this path stays INSIDE the brain — `.claude/skills/../..` cancels back
// to the brain dir — while matching `.claude/skills/**`, because `**` compiles to `.*`
// and crosses `/`. The regime says yes about a string; the write would land on a file the
// regime never named.
test("adoptCandidate — a traversal that MATCHES a merge glob but lands elsewhere IN the brain is refused", (t) => {
  const dir = globBrain(t);
  const landing = ".claude/skills/../../adopted-by-accident.md";
  assert.equal(resolve(dir, landing), resolve(dir, "adopted-by-accident.md"), "fixture check: it lands outside the skills tree");
  writeFileSync(join(dir, "adopted-by-accident.md.new"), "the bytes that must never land\n");

  const result = adoptCandidate({ brainDir: dir, rel: landing, decision: "take-theirs", git: cleanGit });

  assert.deepEqual(result, { adopted: false, blocked: "not-adoptable" });
  assert.equal(existsSync(join(dir, "adopted-by-accident.md")), false, "a file no merge glob truly names must not even be created");
});

// …and the same trick aimed OUT of the brain: one more `..`, and the regime still says
// yes about the string.
test("adoptCandidate — a traversal that MATCHES a merge glob and leaves the brain is refused", (t) => {
  const dir = globBrain(t);
  const neighbour = join(dirname(dir), "adopted-by-accident.md");
  t.after(() => rmSync(neighbour, { force: true }));
  writeFileSync(`${neighbour}.new`, "the bytes that must never land\n");

  const result = adoptCandidate({
    brainDir: dir,
    rel: ".claude/skills/../../../adopted-by-accident.md",
    decision: "take-theirs",
    git: cleanGit,
  });

  assert.deepEqual(result, { adopted: false, blocked: "not-adoptable" });
  assert.equal(existsSync(neighbour), false, "a path outside the brain must not even be created");
});

// An ABSOLUTE path is its own family of confusion: `join` does not honour it, it
// re-roots it under the brain — so `/etc/passwd` quietly becomes `<brain>/etc/passwd`,
// and a caller who believed they were naming a system file is now naming a brain file.
// Refused on the spelling, before any of that matters.
test("adoptCandidate — an ABSOLUTE path is not a brain-relative one, and is refused", (t) => {
  const dir = globBrain(t);
  writeFileSync(join(dir, "absolute.md.new"), "the bytes that must never land\n");

  const result = adoptCandidate({ brainDir: dir, rel: "/absolute.md", decision: "take-theirs", git: cleanGit });

  assert.deepEqual(result, { adopted: false, blocked: "not-adoptable" });
  assert.equal(existsSync(join(dir, "absolute.md")), false);
});

// The three paths the finding names, one test each in a loop: inside the brain, with a
// sidecar sitting beside them, and in NO merge regime. `.engine-base/**` is the sharpest —
// it is `local`, and forging an ancestor destroys the owner's edit at the next update.
for (const [what, rel, untouched] of [
  ["the owner's API key", ".env", "GOOGLE_GEMINI_API_KEY=super-secret-do-not-leak\n"],
  ["a vault note", "vault/my-note.md", "# Mollecuisse\n"],
  ["a recorded ancestor", ".engine-base/.claude/skills/coach/SKILL.md", "the recorded ancestor\n"],
]) {
  test(`adoptCandidate — ${what} is not the engine's to offer, sidecar or no sidecar`, (t) => {
    const dir = globBrain(t);

    const result = adoptCandidate({ brainDir: dir, rel, decision: "take-theirs", git: cleanGit });

    assert.deepEqual(result, { adopted: false, blocked: "not-adoptable" });
    assert.equal(read(dir, rel), untouched);
    assert.equal(existsSync(join(dir, `${rel}.new`)), true, "a refusal leaves the brain EXACTLY as it was — the sidecar included");
  });
}

test("adoptCandidate — a merge file inside the brain is still adoptable (the guard refuses, it does not close the door)", (t) => {
  const dir = globBrain(t);

  const result = adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: cleanGit });

  assert.deepEqual(result, { adopted: true, unreadable: [] });
  assert.equal(read(dir, REL), CANDIDATE);
});

// F9 — the atomicity claim, stated as the skill states it: exit 1 means the brain was
// NOT changed. The manifest is the last thing an adoption needs and was the last thing
// it read; a brain whose manifest is mid-edit therefore lost the file AND the offer.
test("adoptCandidate — an unreadable manifest changes NOTHING, neither the file nor the offer", (t) => {
  const dir = brain(t);
  writeFileSync(join(dir, "engine-manifest.json"), "{ this is not json");

  // 🔁 S6 (second pass) CHANGED WHAT THIS ASSERTS, and the change is the finding. It
  // pinned the THROW — which is what F9's ordering produced, and what the CLI one door
  // over turns into a stack trace where a sentence used to stand. The invariant it was
  // really about is untouched and asserted below: nothing moved. What moved is that "I
  // cannot read the record" is now an ANSWER, named, with a sentence of its own.
  assert.deepEqual(adoptCandidate({ brainDir: dir, rel: REL, decision: "take-theirs", git: cleanGit }), {
    adopted: false,
    blocked: "unreadable-manifest",
  });

  assert.equal(read(dir, REL), OWNER, "the owner's file must survive a manifest we could not parse");
  assert.equal(read(dir, `${REL}.new`), CANDIDATE, "and so must the offer, or the choice is destroyed with it");
  assert.equal(existsSync(join(dir, ANSWERS_REL)), false, "and no answer may be recorded for a choice that never landed");
});

test("adoptCandidate — answering a SECOND file keeps the first answer", (t) => {
  const dir = brain(t, { answers: { "CLAUDE.md": { decision: "keep-mine", at: "v5.0.0" } } });

  adoptCandidate({ brainDir: dir, rel: REL, decision: "keep-mine", git: cleanGit });

  assert.deepEqual(readAnswers({ brainDir: dir }), {
    "CLAUDE.md": { decision: "keep-mine", at: "v5.0.0" },
    [REL]: { decision: "keep-mine", at: "v5.0.0" },
  });
});

// 🚨 S6 (second pass of the v5.0.0 review) — F9's ORDERING KEPT ITS PROMISE AND LOST A
// SENTENCE.
//
// Before F9 the manifest was parsed at the END, so a brain whose `engine-manifest.json`
// was missing or mid-edit, asked about a file with no `.new` beside it, got the designed
// refusal `no-candidate` — a sentence the owner can act on. Reading it FIRST is right (it
// is what makes the write atomic, and what F2's guard needs), but it turned that refusal
// into an uncaught `JSON.parse` throw: `adopt-engine-file.mjs` calls `adopt` with no
// try/catch, so a stack trace replaced the sentence.
//
// The answer is not to move the read back. It is that "I cannot read the record" is one of
// this function's ANSWERS, like every other refusal here: a named `blocked`, a brain left
// exactly as it was, and a sentence of its own in the CLI.
test("adoptCandidate — a manifest that is not there at all is the same refusal", (t) => {
  const dir = brain(t);
  rmSync(join(dir, "engine-manifest.json"));

  assert.deepEqual(adoptCandidate({ brainDir: dir, rel: REL, decision: "keep-mine", git: cleanGit }), {
    adopted: false,
    blocked: "unreadable-manifest",
  });
  assert.equal(read(dir, REL), OWNER);
});

// 🚨 S9 (second pass of the v5.0.0 review) — `".."` IS ITS OWN CANONICAL FORM.
//
// F2's three questions are asked in order, and the second one asks whether the rel stays
// inside the brain by looking for a leading `../` or a root. The exact string `".."` has
// neither: `relative(brainDir, join(brainDir, ".."))` is `".."`, so it equals the rel it
// came from, starts with no `../`, and is not absolute. All three pass, and the only thing
// still refusing it is `selectMergeFiles`.
//
// That last line is not load-bearing by design: `advanceRegimes` imports whatever globs
// the FETCHED engine declares, and `globToRegExp("**")` compiles to `^.*$`, which matches
// `".."`. One leading-wildcard merge glob in a future manifest re-opens the very escape
// F2 was written to close — so the fixture here declares exactly that glob, rather than
// relying on today's manifest to keep the guard looking correct.
test("adoptCandidate — the bare `..` is refused by the CONTAINMENT question, not by the regime", (t) => {
  const dir = brain(t);
  writeFileSync(
    join(dir, "engine-manifest.json"),
    JSON.stringify({ regimes: { merge: ["**"] }, provenance: {}, baseRefs: {}, source: { ref: "v5.0.0" } }),
  );

  assert.deepEqual(adoptCandidate({ brainDir: dir, rel: "..", decision: "take-theirs", git: cleanGit }), {
    adopted: false,
    blocked: "not-adoptable",
  });
});

// 🚨 S10 (second pass) — THE GUARD IS LEXICAL, AND A SYMLINK IS NOT.
//
// `relative()` and `join()` never touch the filesystem, so a rel can be canonical,
// lexically inside the brain, and matched by a merge glob, while the directory it names is
// a symlink pointing somewhere else entirely. `writeFileSync` follows it, and the adoption
// lands outside the brain — the one thing this module's own contract says it will not do.
//
// It matters HERE and not on the update path, and the difference is the input: `rel`
// arrives from the CONVERSATION (an agent types it), which is the whole reason F2 exists.
// Engine writes elsewhere take their rels from the manifest. The day that stops being
// true, this check belongs lower.
test("adoptCandidate — a merge path that is a SYMLINK out of the brain is refused, and the target survives", (t) => {
  if (process.platform === "win32") {
    t.skip("creating a symlink needs privileges on Windows; the guard itself is platform-agnostic");
    return;
  }
  const dir = brain(t);
  const outside = mkdtempSync(join(tmpdir(), "sbg-adopt-outside-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const SHARED = ".claude/skills/shared/SKILL.md";
  writeFileSync(join(outside, "SKILL.md"), "# a file that is NOT in this brain\n");
  writeFileSync(join(outside, "SKILL.md.new"), "# the engine's newer words\n");
  symlinkSync(outside, join(dir, ".claude", "skills", "shared"), "dir");
  writeFileSync(
    join(dir, "engine-manifest.json"),
    JSON.stringify({
      regimes: { merge: [".claude/skills/**"] },
      provenance: {},
      baseRefs: {},
      source: { ref: "v5.0.0" },
    }),
  );

  assert.deepEqual(adoptCandidate({ brainDir: dir, rel: SHARED, decision: "take-theirs", git: cleanGit }), {
    adopted: false,
    blocked: "not-adoptable",
  });
  assert.equal(
    readFileSync(join(outside, "SKILL.md"), "utf8"),
    "# a file that is NOT in this brain\n",
    "the file outside the brain must be exactly as it was",
  );
});
