import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
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

// ── the caller got it wrong: exit 2, and NOTHING is attempted ────────────────
// Each of these must leave `adopt` uncalled. A usage error that has already run a
// safety commit and rewritten a file is not a usage error any more.

test("no arguments at all — usage, exit 2, nothing attempted", () => {
  const { deps, calls } = harness();
  assert.equal(runAdoptEngineFile([], deps), 2);
  assert.deepEqual(calls.adopt, []);
  assert.match(said(calls), /adopt-engine-file/);
});

test("a file but no decision — usage, exit 2, nothing attempted", () => {
  const { deps, calls } = harness();
  assert.equal(runAdoptEngineFile([REL], deps), 2);
  assert.deepEqual(calls.adopt, []);
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

// ── the answer is applied: exit 0 ────────────────────────────────────────────

test("take the new one — the seam is called with exactly the owner's answer", () => {
  const { deps, calls } = harness();

  assert.equal(runAdoptEngineFile([REL, "take-theirs"], deps), 0);

  assert.deepEqual(calls.adopt, [{ brainDir: "/brain", rel: REL, decision: "take-theirs", combined: undefined }]);
  assert.match(said(calls), /coach/i);
});

test("keep mine — applied, and the sentence says their version is what stands", () => {
  const { deps, calls } = harness();

  assert.equal(runAdoptEngineFile([REL, "keep-mine"], deps), 0);

  assert.equal(calls.adopt[0].decision, "keep-mine");
  assert.equal(calls.adopt[0].combined, undefined);
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
  assert.match(said(calls), new RegExp(REL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("every blocked outcome says the brain was left ALONE — that is the reassurance", () => {
  for (const blocked of ["refused", "conflicted", "no-candidate"]) {
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

test("the usage names all three offers — it is the only place a caller can learn them", () => {
  assert.match(USAGE, /take-theirs/);
  assert.match(USAGE, /keep-mine/);
  assert.match(USAGE, /combine/);
});
