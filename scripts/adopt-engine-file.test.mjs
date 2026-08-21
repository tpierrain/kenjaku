import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { ADOPTION_BLOCKED_LINE } from "./lib/engine-commit.mjs";
import { runAdoptEngineFile, USAGE } from "./adopt-engine-file.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "adopt-engine-file.mjs");

// ═══════════════════════════════════════════════════════════════════════════
// S10-6a — the COMMAND behind the three offers.
//
// S10-5 built the seam as a function, and a skill cannot call a function: it can
// only run a command. This file is that command, and it is the reason the prose of
// S10-6 may promise "I'll take care of it" instead of describing a capability.
//
// 🚨 The exit codes carry the ONE distinction the conversation turns on:
//   0 — the answer was applied.
//   1 — REFUSED, and the brain is exactly as it was. Claude must relay the reason
//       and NOT retry: every reason here needs a human (git identity, a merge in
//       progress, an offer already taken).
//   2 — the CALLER got it wrong (bad arguments). Never shown to the owner as-is.
// A single "it failed" code would collapse 1 and 2, and the difference is whether
// the person watching has anything to do about it.
// ═══════════════════════════════════════════════════════════════════════════

const REL = ".claude/skills/coach/SKILL.md";
const COMBINED = "# Coach\nmy own words, plus the engine's newer ones\n";

function harness({ adopt } = {}) {
  const calls = { adopt: [], log: [], error: [] };
  const deps = {
    brainDir: "/brain",
    adopt: (args) => (calls.adopt.push(args), adopt ? adopt(args) : { adopted: true }),
    log: (m) => calls.log.push(m),
    error: (m) => calls.error.push(m),
  };
  return { deps, calls };
}

const said = (calls) => [...calls.log, ...calls.error].join("\n");
const escaped = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── the caller got it wrong: exit 2, and NOTHING is attempted ────────────────
// Each of these must leave `adopt` uncalled. A usage error that has already run a
// safety commit and rewritten a file is not a usage error any more.

test("no arguments at all — the BARE usage, exit 2, nothing attempted", () => {
  const { deps, calls } = harness();
  assert.equal(runAdoptEngineFile([], deps), 2);
  assert.deepEqual(calls.adopt, []);
  // 🛑 Exactly the usage, and nothing else. Falling through to the unknown-decision
  // branch also exits 2, which is why the code alone cannot tell these apart — but it
  // greets someone who typed nothing with `I do not know the answer "undefined"`.
  assert.equal(said(calls), USAGE);
});

test("a file but no decision — the BARE usage too, exit 2, nothing attempted", () => {
  const { deps, calls } = harness();
  assert.equal(runAdoptEngineFile([REL], deps), 2);
  assert.deepEqual(calls.adopt, []);
  assert.equal(said(calls), USAGE);
});

test("an unknown decision is NAMED back, and never guessed at", () => {
  // The seam throws on an unknown decision. A thrown stack trace reaching the
  // owner's screen is the failure mode this asserts away: it must come back as a
  // sentence carrying the word that was not understood.
  const { deps, calls } = harness();
  assert.equal(runAdoptEngineFile([REL, "take-all"], deps), 2);
  assert.deepEqual(calls.adopt, []);
  assert.match(said(calls), /take-all/);
});

test("combine with no --from is refused BEFORE anything is touched", () => {
  // 🛑 The dangerous near-miss: without its bytes, "combine" is one silent
  // fallback away from becoming "take the new one" — the offer the owner chose
  // over that one on purpose.
  const { deps, calls } = harness();
  assert.equal(runAdoptEngineFile([REL, "combine"], deps), 2);
  assert.deepEqual(calls.adopt, []);
  assert.match(said(calls), /--from/);
});

test("combine whose --from cannot be read is refused, and says which path", () => {
  const { deps, calls } = harness();
  assert.equal(runAdoptEngineFile([REL, "combine", "--from", "/nope/absent.md"], deps), 2);
  assert.deepEqual(calls.adopt, []);
  assert.match(said(calls), /\/nope\/absent\.md/);
});

test("a stray argument is NOT silently promoted to being the combination", () => {
  // 🛑 Without the `-1` guard, `rest[at + 1]` reads `rest[0]` — so this stray word
  // becomes "the combination", and the owner is told a file they never named could
  // not be read. Both spellings exit 2; only one of them is actionable.
  const { deps, calls } = harness();

  assert.equal(runAdoptEngineFile([REL, "combine", "oops.md"], deps), 2);

  assert.deepEqual(calls.adopt, []);
  assert.match(said(calls), /--from/);
  assert.doesNotMatch(said(calls), /oops\.md/, "it was never named as a path, so it must not be quoted back as one");
});

// ── the answer is applied: exit 0 ────────────────────────────────────────────

test("take the new one — the seam is called with exactly the owner's answer", () => {
  const { deps, calls } = harness();

  assert.equal(runAdoptEngineFile([REL, "take-theirs"], deps), 0);

  assert.deepEqual(calls.adopt, [{ brainDir: "/brain", rel: REL, decision: "take-theirs", combined: undefined }]);
  assert.match(said(calls), new RegExp(escaped(REL)));
  // The only offer that destroys something. Its sentence must carry the reassurance
  // S10-4 exists to make true, or the safety commit is a fact nobody is told about.
  assert.match(said(calls), /saved in this brain's history/i);
});

test("keep mine — applied, and the sentence says their version is what stands", () => {
  const { deps, calls } = harness();

  assert.equal(runAdoptEngineFile([REL, "keep-mine"], deps), 0);

  assert.equal(calls.adopt[0].decision, "keep-mine");
  assert.equal(calls.adopt[0].combined, undefined);
  // The sentence IS the deliverable of this branch. It must name the file, say the
  // owner's text stands, and answer the question they would ask next — *will you
  // pester me about this again?*
  assert.match(said(calls), new RegExp(escaped(REL)));
  assert.match(said(calls), /exactly as you wrote it/i);
  assert.match(said(calls), /not raise it again until its next release/i);
});

test("combine — the BYTES of --from are what reach the seam, not the path", (t) => {
  // The path is Claude's scratch file; what must be adopted is its content. Passing
  // the path through would make the seam read a file it has no business knowing about.
  const dir = mkdtempSync(join(tmpdir(), "sbg-adopt-cli-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const from = join(dir, "combined.md");
  writeFileSync(from, COMBINED);
  const { deps, calls } = harness();

  assert.equal(runAdoptEngineFile([REL, "combine", "--from", from], deps), 0);

  assert.equal(calls.adopt[0].decision, "combine");
  assert.equal(calls.adopt[0].combined, COMBINED);
  // 🛑 The sentence has to say what became the ANCESTOR, because that is the one
  // consequence the owner cannot see on disk and the one that decides whether this
  // file is raised again at every release forever.
  assert.match(said(calls), /ancestor/i);
  assert.match(said(calls), /merges from there instead of asking again/i);
});

// ── the brain refused: exit 1, and the reason is the owner's to act on ───────

test("a git veto comes back as exit 1, in the words the owner can act on", () => {
  const { deps, calls } = harness({ adopt: () => ({ adopted: false, blocked: "refused" }) });

  assert.equal(runAdoptEngineFile([REL, "take-theirs"], deps), 1);

  assert.equal(said(calls), ADOPTION_BLOCKED_LINE.refused(REL));
});

test("a merge in progress comes back as exit 1, with its own reason", () => {
  // Two blocked outcomes, two different things for the person to do. One shared
  // "it did not work" would tell them nothing.
  const { deps, calls } = harness({ adopt: () => ({ adopted: false, blocked: "conflicted" }) });

  assert.equal(runAdoptEngineFile([REL, "keep-mine"], deps), 1);

  assert.equal(said(calls), ADOPTION_BLOCKED_LINE.conflicted(REL));
});

test("no offer left to take is exit 1 and says so plainly — not a crash, not a success", () => {
  // Ordinary life: the offer was already taken, or this brain never had one. The
  // owner asked about a real file, so the answer is a sentence, not a stack trace.
  const { deps, calls } = harness({ adopt: () => ({ adopted: false, blocked: "no-candidate" }) });

  assert.equal(runAdoptEngineFile([REL, "take-theirs"], deps), 1);

  assert.match(said(calls), /no newer version/i);
  assert.match(said(calls), new RegExp(escaped(REL)));
  // Both innocent explanations, said out loud. "Nothing to adopt" with no reason
  // reads as a malfunction, and this is the one blocked outcome that is not one.
  assert.match(said(calls), /already made/i);
  assert.match(said(calls), /never received an engine version/i);
});

test("a MARKED merge gets its own sentence, and is never called 'nothing to adopt'", () => {
  // 🛑 The near-miss: the reason map only knew three keys, and an unknown one fell
  // through to the no-candidate sentence — which would tell the owner there is no newer
  // version waiting, while a marked-up merge sits right there needing a walkthrough.
  // Wrong, confidently, in the one place they cannot check.
  const { deps, calls } = harness({ adopt: () => ({ adopted: false, blocked: "marked-candidate" }) });

  assert.equal(runAdoptEngineFile([REL, "take-theirs"], deps), 1);

  assert.doesNotMatch(said(calls), /no newer version/i);
  assert.match(said(calls), /same lines|clash|both versions/i, "it must say WHY, in plain words");
  // 🎯 And WHAT is waiting, which is the half the owner acts on: a marked-up merge of
  // both, not a version to install. Left unasserted, a mutant emptied this clause and the
  // sentence still said "the same lines changed" — a true half-sentence that stops right
  // before the only fact the reader needs.
  assert.match(said(calls), /marked-up merge of both/i, "it must say what is actually sitting there");
  assert.match(said(calls), /install as-is/i, "and that installing it is not on the table");
  assert.match(said(calls), /combine/i, "and point at the offer that does work here");
});

test("every blocked outcome says the brain was left ALONE — that is the reassurance", () => {
  for (const blocked of ["refused", "conflicted", "no-candidate", "marked-candidate"]) {
    const { deps, calls } = harness({ adopt: () => ({ adopted: false, blocked }) });
    runAdoptEngineFile([REL, "take-theirs"], deps);
    assert.match(said(calls), /left|stands|unchanged/i, `"${blocked}" must reassure, not just refuse`);
  }
});

// ── the entry point, RUN AS A PROCESS ────────────────────────────────────────
// The seam rule: an entry point tested only through its imported functions is an
// entry point nobody has ever started.

test("started as a real process with no arguments: exit 2, and the usage on stderr", () => {
  const run = spawnSync(process.execPath, [CLI], { encoding: "utf8" });

  assert.equal(run.status, 2);
  assert.match(run.stderr, /adopt-engine-file/);
  assert.equal(run.stdout, "", "a usage error belongs on stderr");
});

// 🚨 THE ONE TEST THAT PROVES THE COMMAND IS PLUGGED IN. Everything above injects
// `adopt`, so all of it would still pass if `realDeps` handed the seam an empty
// object, or dropped the git runner, or logged nothing. A fake can never show the
// real wiring — and the wiring is the entire content of this slice.
//
// 🧭 The brain is a COPY of `scripts/`, not a bare temp dir, and that is not
// ceremony: the command resolves the brain it acts on from where the SCRIPT lives,
// not from the working directory. Spawning the launcher's own copy against a temp
// folder would silently act on the launcher — which is exactly what this test
// caught the first time it ran. A real brain carries its own `scripts/`, so the
// fixture does too.
test("run for real against a real brain: the file changes, and the answer is recorded", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "sbg-adopt-e2e-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  git("init", "--quiet");
  // A CI runner has no global git identity → configure one locally or `commit` fails.
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test");
  cpSync(dirname(CLI), join(dir, "scripts"), { recursive: true });
  mkdirSync(join(dir, dirname(REL)), { recursive: true });
  writeFileSync(join(dir, REL), "# Coach\nmy own words\n");
  writeFileSync(join(dir, `${REL}.new`), "# Coach\nthe engine's newer words\n");
  writeFileSync(
    join(dir, "engine-manifest.json"),
    JSON.stringify({ regimes: { merge: [REL] }, provenance: { [REL]: "sha256:old" }, source: { ref: "v5.0.0" } }),
  );
  git("add", "-A");
  git("commit", "--quiet", "-m", "initial");

  const run = spawnSync(process.execPath, [join(dir, "scripts", "adopt-engine-file.mjs"), REL, "take-theirs"], {
    cwd: dir,
    encoding: "utf8",
  });

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Done:/, "the real log goes to stdout, or the owner sees nothing");
  assert.equal(readFileSync(join(dir, REL), "utf8"), "# Coach\nthe engine's newer words\n");
  assert.equal(existsSync(join(dir, `${REL}.new`)), false, "the offer was taken, so it is no longer open");
  assert.equal(
    JSON.parse(readFileSync(join(dir, ".engine-answers.json"), "utf8"))[REL].at,
    "v5.0.0",
    "and it is recorded against the version it was answered at, or the next release cannot re-open it",
  );
});

test("the usage EXPLAINS all three offers — naming them is not telling anyone what they do", () => {
  // Naming the three words is satisfied by the invocation line alone, which is how
  // three emptied explanation lines can hide behind a passing test. What a caller
  // actually needs is the consequence of each offer.
  assert.match(USAGE, /take-theirs\s+the engine's newer version replaces yours/);
  assert.match(USAGE, /your current one is saved first/);
  assert.match(USAGE, /keep-mine\s+your version stands/);
  assert.match(USAGE, /combine\s+adopt the combination written in --from/);
  assert.match(USAGE, /keeping the engine's version as the ancestor/);
});
