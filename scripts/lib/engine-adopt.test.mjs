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
  write(
    "engine-manifest.json",
    JSON.stringify({
      regimes: { merge: [REL] },
      provenance: { [REL]: "sha256:whatever-the-engine-last-delivered" },
      baseRefs: { [REL]: "v4.7.0" },
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
