// ═══════════════════════════════════════════════════════════════════════════
// release-fixture-adoption.test.mjs — S10-QA: THE OWNER'S SENTENCE, EXECUTABLE.
//
// The criterion he set for v5, in his words: **a file you personalized becomes a
// QUESTION with three offers, instead of a blind spot.** Every S10 slice was proved
// on a fixture written by hand. This suite proves the whole chain on a brain rebuilt
// from a REAL published tag, with a file edited BEFORE the release — the only thing
// none of them could show, because a hand-written fixture is a fixture written by
// someone who already knows the answer.
//
// 🎯 WHAT IT ASSERTS THAT NOTHING ELSE DOES, in one line each:
//   • Pole F — the personalization survives an update AND leaves an offer on disk,
//     named in the report. Preserved-and-silent is the defect; preserved-and-asked is
//     the release.
//   • Pole G — the offer can be ANSWERED, and answering ends the question. This is
//     the half no unit test can reach: it spans the update, the sidecar, the seam and
//     the nudge, four modules that each believe the others behave.
//   • Pole H — and it comes back when the ENGINE MOVES. "Answered" is scoped to a
//     release, never to eternity: a brain that goes quiet forever about a file it is
//     holding back is the blind spot again, wearing the answer file as a coat.
//
// It sits beside `release-fixture-doctrine.test.mjs` (S7's acceptance test) and
// reuses its fixture builder for the same reason that one gives: the QA must read
// REAL released content, never a tree this suite invented.
// ═══════════════════════════════════════════════════════════════════════════
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import { brainAtRelease, readBrain, readRepo, updateFrom } from "../../maintainers/qa/release-fixtures/brain-at-release.mjs";
import { adoptCandidate } from "./engine-adopt.mjs";
import { UNKNOWN_REF, readAnswers, unansweredRels } from "./engine-answers.mjs";
import { engineDivergenceNudge } from "./engine-divergence-nudge.mjs";
import { readEngineDivergence } from "./engine-base-fs.mjs";
import { installRef } from "./engine-version.mjs";

const TAG = "v3.6.0";

// 🧭 THREE REAL FILES, BECAUSE THE FIXTURE TAUGHT US THERE ARE TWO PATHS — and the first
// draft of this suite got it wrong, which is the whole argument for running QA on a real
// tree. A file whose provenance the installer RECORDED reaches the merge path (S7-5 can
// fetch its ancestor from the tag that sha names), so an edit becomes a CONFLICT. A file
// nobody ever recorded cannot be merged at all, so an edit becomes a PRESERVE. Both end
// with a `.new` beside the file, and the two sidecars are NOT the same kind of thing.
const REL = ".claude/skills/prepare-1-1/SKILL.md"; // provenance recorded → conflict
const SKILL = "prepare-1-1";
const DOCTRINE = "CLAUDE.engine.md"; // no provenance at this tag → preserve
// 🧭 AND A THIRD, because the standing report and the update's report are not the same
// surface. `CLAUDE.engine.md` is a `merge` family only v4+ DECLARES, and a brain keeps
// its install-day regime list forever (see the plan's arbitration box) — so a v3.6.0
// brain hears about its doctrine during the update and never from the session nudge.
// The nudge's own poles therefore run on a file v3.6.0 already knew: an ordinary skill
// the owner edited, with nothing recorded about it.
const OWN = ".claude/skills/import/SKILL.md"; // in v3.6.0's merge regime, no provenance

// What a real personalization looks like. NOT a placeholder string: the bytes have to be
// unprovable by S7's fingerprint table (nobody ever published these), which is exactly
// what leaves the engine unable to act on its own and makes the conversation necessary.
const OWNER_SKILL = `# prepare-1-1

I rewrote the whole opening of this one: I want the last three 1-1s pulled in
before anything else, and I never want the tool to suggest an agenda item I did
not raise myself.
`;

const OWNER_DOCTRINE = `# My engine doctrine

I rewrote this entirely, months before this release existed.
`;

const OWNER_IMPORT = `# import

I only ever want the last month imported, and never the archived channels.
`;

// The brain as its owner left it: installed at a real tag, then edited by hand, long
// before the release that is about to reach it.
const personalizedBrain = () =>
  brainAtRelease(TAG, { edits: { [REL]: OWNER_SKILL, [DOCTRINE]: OWNER_DOCTRINE, [OWN]: OWNER_IMPORT } });

const manifestOf = (brainDir) => JSON.parse(readBrain(brainDir, "engine-manifest.json"));

// ── Pole F — the update leaves a QUESTION on the disk, not a silence ──────────────
test("QA v3.6.0 → HEAD — a file the owner edited comes out PRESERVED, with the engine's version beside it", async (t) => {
  const { brainDir, manifest } = personalizedBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  assert.equal(readBrain(brainDir, DOCTRINE), OWNER_DOCTRINE, "the fixture must actually carry the owner's bytes");
  assert.notEqual(readRepo(DOCTRINE), OWNER_DOCTRINE, "and the engine must ship something else, or this proves nothing");

  const report = await updateFrom(brainDir, manifest);

  // 1. What is theirs is still theirs, to the byte. Everything else here is worthless
  //    if this fails, so it is asserted first.
  assert.equal(readBrain(brainDir, DOCTRINE), OWNER_DOCTRINE, "their text is untouched");
  // 2. The engine says it held the file back, names it, and says WHY — `no-provenance`
  //    is the pre-v4 fleet's own reason: nobody ever recorded what was delivered here.
  assert.deepEqual(report.doctrinePreserved, [
    { name: DOCTRINE, reason: "no-provenance", newVersionPath: `${DOCTRINE}.new` },
  ]);
  // 3. 🚨 The line the whole release turns on: a preserved file now carries the path of
  //    the version it was held back FROM. Before S10-1 this key did not exist, and a
  //    report that only says "kept" is the blind spot this release exists to close.
  assert.equal(readBrain(brainDir, `${DOCTRINE}.new`), readRepo(DOCTRINE), "the offer is the engine's real bytes");
});

// ── Pole F2 — the OTHER path, and the defect it uncovered ─────────────────────────
//
// 🛑 THE FIRST DRAFT OF THIS SUITE ASSUMED THIS FILE WOULD BE PRESERVED TOO, and the
// real tree said otherwise: its provenance IS recorded, so S7-5 fetches the ancestor
// from the tag that sha names, and the edit reaches the MERGE path. Its `.new` is a
// three-way merge carrying `<<<<<<<` markers, not the engine's clean version — the same
// suffix, a different kind of file. Adopting it blind would paste markers into the live
// skill and record them as its ancestor.
test("QA v3.6.0 → HEAD — an edit that CLASHES yields a marked merge, and adoption refuses it", async (t) => {
  const { brainDir, manifest } = personalizedBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));

  const report = await updateFrom(brainDir, manifest);

  assert.deepEqual(
    report.conflicts.filter((c) => c.name === SKILL),
    [{ name: SKILL, newVersionPath: `${REL}.new` }],
    "a clash is reported as a clash, which has its own door in the report",
  );
  assert.equal(readBrain(brainDir, REL), OWNER_SKILL, "and their version stands meanwhile");
  const sidecar = readBrain(brainDir, `${REL}.new`);
  assert.match(sidecar, /^<<<<<<</m, "this sidecar is a MARKED merge, not a candidate");
  // The ancestor S7-5 fetched from the tag, as it stands BEFORE anyone answers. Captured
  // rather than described: what matters below is that it does not move, and an assertion
  // spelling out its bytes would be re-testing the fetch, not the refusal.
  const ancestorBefore = readBrain(brainDir, join(".engine-base", REL));
  assert.doesNotMatch(ancestorBefore, /^<<<<<<</m, "the ancestor is real content, which is why a merge was possible at all");

  const result = adoptCandidate({ brainDir, rel: REL, decision: "take-theirs", git: () => ({ out: "", ok: true }) });

  assert.deepEqual(result, { adopted: false, blocked: "marked-candidate" });
  assert.equal(readBrain(brainDir, REL), OWNER_SKILL, "🛑 not one marker reached the file the owner uses");
  assert.equal(
    readBrain(brainDir, join(".engine-base", REL)),
    ancestorBefore,
    "🛑 and the markers were never recorded as the ancestor every later merge would diff against",
  );
  assert.equal(existsSync(join(brainDir, `${REL}.new`)), true, "the offer is still open: a refusal decides nothing");
});

// ── Pole G — the offer can be ANSWERED, and answering ends the question ───────────
//
// 🛑 THE SPAN IS THE POINT. Four modules have to agree here — the update writes the
// sidecar, the seam reads it, the manifest records the new ancestor, the nudge
// subtracts what was answered — and each of them is unit-tested against its own idea
// of the other three. This is the only place they meet on a real brain.
test("QA v3.6.0 → HEAD — answering 'take the new one' applies it, and the brain stops asking", async (t) => {
  const { brainDir, manifest } = personalizedBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  await updateFrom(brainDir, manifest);
  // 🛑 `null`, and that is the FINDING, not a fixture quirk: the v3.6.0 manifest carries
  // no `source` at all, which is what the pre-v4 fleet looks like. It is the reason
  // `UNKNOWN_REF` exists — see `engine-answers.mjs`. Asserted rather than worked around,
  // because a later fixture that happens to carry a ref would silently stop testing this.
  const ref = installRef(manifestOf(brainDir));
  assert.equal(ref, null, "this cohort cannot name its engine version, and the answer must survive anyway");

  // Before answering, the brain is holding the file back AND says so unprompted.
  const before = readEngineDivergence({ brainDir });
  assert.ok(
    before.some((d) => d.rel === OWN),
    "the file must be raised before it is answered, or this test proves silence, not an answer",
  );
  assert.ok(engineDivergenceNudge({ divergence: before, ref, answers: {} }), "and it must be SAID, not merely derivable");

  // The owner answers. A clean tree: `auto-commit` has already swept, the common case,
  // and the safety commit's own refusals are S10-4's subject, not this suite's.
  const result = adoptCandidate({ brainDir, rel: OWN, decision: "take-theirs", git: () => ({ out: "", ok: true }) });

  assert.deepEqual(result, { adopted: true });
  assert.equal(readBrain(brainDir, OWN), readRepo(OWN), "the engine's version is now theirs, byte for byte");
  assert.equal(existsSync(join(brainDir, `${OWN}.new`)), false, "the offer was taken, so it is no longer open");
  assert.deepEqual(readAnswers({ brainDir })[OWN], { decision: "take-theirs", at: UNKNOWN_REF });
  // And the file stops being held back at all — the ancestor advanced, so this is no
  // longer a divergence to subtract, it is a file the engine can prove.
  assert.equal(
    readEngineDivergence({ brainDir }).some((d) => d.rel === OWN),
    false,
    "🎯 nothing silently left behind: the file the owner personalized is now one the engine owns again",
  );
});

test("QA v3.6.0 → HEAD — answering 'keep mine' also ends the question, WITHOUT touching their file", async (t) => {
  const { brainDir, manifest } = personalizedBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  await updateFrom(brainDir, manifest);
  const ref = installRef(manifestOf(brainDir));

  adoptCandidate({ brainDir, rel: OWN, decision: "keep-mine", git: () => ({ out: "", ok: true }) });

  assert.equal(readBrain(brainDir, OWN), OWNER_IMPORT, "their paragraph, still exactly theirs");
  // Deliberately still divergent: "keep mine" does NOT advance the ancestor, because
  // recording the engine's version as the ancestor of a file they REFUSED would fold
  // v5's text in silently at the next merge. So the file stays held back...
  const divergence = readEngineDivergence({ brainDir });
  assert.ok(
    divergence.some((d) => d.rel === OWN),
    "the engine is still holding it back, and must not pretend otherwise",
  );
  // ...and the SILENCE comes from the answer, not from a forgotten divergence. That
  // distinction is the whole design: the fact is preserved, only the question is closed.
  //
  // 🧭 Asserted on the SUBTRACTION, not on the nudge going quiet — this brain is holding
  // several files back (its constitution and its allowlist among them), so answering one
  // still leaves the nudge rightly speaking. An assertion that demanded total silence
  // here would have been testing the fixture's file count, and would go red the day the
  // manifest gains an entry.
  const rels = divergence.map((d) => d.rel);
  assert.ok(rels.length > 1, "this brain holds several files back, which is what makes the subtraction the real claim");
  assert.ok(unansweredRels({ rels, answers: {}, ref }).includes(OWN), "unanswered before");
  assert.equal(
    unansweredRels({ rels, answers: readAnswers({ brainDir }), ref }).includes(OWN),
    false,
    "answered at this version, so the brain does not ask about THIS file again",
  );
});

// ── Pole H — and the question comes back when the ENGINE MOVES ────────────────────
test("QA v3.6.0 → HEAD — an answer is scoped to a RELEASE, never to eternity", async (t) => {
  // 🚨 The failure mode this exists to forbid: a brain that, having been answered once,
  // goes quiet forever about a file it is still holding back. That is the original blind
  // spot with the answers file worn as a coat — and it is the shape a "dismissed" flag
  // with no version would have taken.
  const { brainDir, manifest } = personalizedBrain();
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  await updateFrom(brainDir, manifest);
  const ref = installRef(manifestOf(brainDir));
  adoptCandidate({ brainDir, rel: OWN, decision: "keep-mine", git: () => ({ out: "", ok: true }) });
  const rels = readEngineDivergence({ brainDir }).map((d) => d.rel);
  const answers = readAnswers({ brainDir });
  assert.equal(unansweredRels({ rels, answers, ref }).includes(OWN), false, "settled at the version it was answered at");

  // The engine ships a new release, and this brain now knows its name. For a brain that
  // could not name its version before, LEARNING one is itself the engine moving.
  const reopened = unansweredRels({ rels, answers, ref: "v5.1.0" });

  assert.ok(reopened.includes(OWN), "the engine moved, so the offer is worth making again");
  // And it is actually SAID, not merely derivable — the nudge is the surface that speaks
  // unbidden, and an offer nobody voices is the blind spot this release closes.
  const divergence = readEngineDivergence({ brainDir });
  assert.ok(engineDivergenceNudge({ divergence, ref: "v5.1.0", answers }), "and the brain says so on its own");
});
