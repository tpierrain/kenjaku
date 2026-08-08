import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ═══════════════════════════════════════════════════════════════════════════
// The `/sync` skill's standing rule for the active-universe pointer (ADR 0034).
//
// The pointer is a SINGLE value that travels between the owner's machines, so a
// conflict on it cannot be resolved by "keep both", and improvising re-scopes every
// search for the rest of the session. The rule — the machine you are sitting at
// wins — therefore lives in the skill, and these tests hold BOTH halves of it: that
// the skill still teaches it, and that git still implements it the way the skill says.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKILL = readFileSync(join(REPO_ROOT, ".claude", "skills", "sync", "SKILL.md"), "utf8");

test("the sync skill resolves a pointer conflict with --theirs — the machine the owner is sitting at", () => {
  assert.match(SKILL, /\.vault-rag\/active-universe/, "the rule must name the file it governs");
  assert.match(
    SKILL,
    /git checkout --theirs -- \.vault-rag\/active-universe/,
    "the resolution command is the rule; prose alone gets improvised",
  );
  assert.match(SKILL, /machine you are sitting at wins/i);
});

test("the sync skill reads the active universe on BOTH sides of the rebase — otherwise it cannot announce a change", () => {
  const reads = SKILL.match(/set-active-universe\.mjs current/g) ?? [];

  assert.equal(reads.length, 2, "one read before the rebase, one after — a single read compares to nothing");
  assert.match(SKILL, /followed you from your other computer/i, "the announcement is the point of the comparison");
});

// The claim the skill makes about git is counter-intuitive enough that a future
// reader WILL be tempted to "fix" it to --ours. So prove it against real git: on a
// rebase, --ours is the branch you are replaying ONTO (the other machine, via origin)
// and --theirs is your own commit being replayed.
test("git itself agrees: on a rebase, --theirs is THIS machine's value and --ours is the one that arrived", (t) => {
  const repo = mkdtempSync(join(tmpdir(), "sbg-sync-rule-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const pointer = join(repo, "active-universe");
  git("init", "--quiet", "--initial-branch=main");
  // What this test measures is WHICH SIDE of a rebase wins, and nothing else. On a
  // Windows machine — the CI runners included — `core.autocrlf` defaults to true, so
  // git rewrites the checked-out pointer to CRLF and the assertion below reads
  // `acme\r\n`: a red that says nothing about --theirs. Pinned here rather than
  // absorbed by a looser assertion, because the exact bytes ARE the claim.
  // (The pointer itself is unaffected in the field: every reader trims it, and a test
  // pins that — this is the test's own confound, not the product's.)
  git("config", "core.autocrlf", "false");
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test");
  writeFileSync(pointer, "default\n");
  git("add", "-A");
  git("commit", "--quiet", "-m", "shared history");
  // This machine switched to acme…
  git("checkout", "--quiet", "-b", "here");
  writeFileSync(pointer, "acme\n");
  git("commit", "--quiet", "-am", "switch here");
  // …while the other machine switched to blue-team and pushed first.
  git("checkout", "--quiet", "main");
  writeFileSync(pointer, "blue-team\n");
  git("commit", "--quiet", "-am", "switch elsewhere");
  git("checkout", "--quiet", "here");
  assert.throws(() => git("rebase", "main"), /./, "the setup must actually conflict, or this test proves nothing");

  git("checkout", "--theirs", "--", "active-universe");
  assert.equal(readFileSync(pointer, "utf8"), "acme\n", "--theirs must keep the machine the owner sits at");

  git("checkout", "--ours", "--", "active-universe");
  assert.equal(readFileSync(pointer, "utf8"), "blue-team\n", "--ours would hand the session to the other machine");
});
