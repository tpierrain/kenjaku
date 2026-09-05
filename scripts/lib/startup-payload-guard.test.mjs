import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─────────────────────────────────────────────────────────────────────────────
// The durable half of F5. Every SessionStart hook's `hookSpecificOutput
// .additionalContext` is echoed to a CLI owner VERBATIM, prefixed
// `SessionStart:startup says:`, before they have typed a word (field-verified
// 2026-07-28, Claude Code v2.1.220). The field log named three emitters; the audit
// found four, and a fifth then arrived and escaped it (see `EMITS` below). So the
// leak does not scale with our care — it scales with the number of hooks we add,
// and the next one will be written by someone who never read this story.
//
// Each emitter bounds its own payload, in its own test, because only that test
// knows what the block is for (housekeeping gets less room than a RESTART REQUIRED
// warning). What no such test can do is notice a FIFTH emitter appearing. That is
// this file's whole job: find them, and refuse one that arrives without a bound.
// Rung 1 of the determinism ladder (ADR 0009) — a pure scan over the sources.
// ─────────────────────────────────────────────────────────────────────────────

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), "..");

// The marker every payload-bounding test carries. A convention, deliberately: the
// alternative is parsing template literals out of the sources, which breaks the day
// an emitter builds its text somewhere other than the `additionalContext:` line —
// and a guard that silently stops matching is worse than no guard.
const BOUND_MARKER = "volume IS the defect (F5)";

// …which is exactly what this guard then did to itself. It matched the literal
// `additionalContext:`, so `status-hook-output.mjs` — which ASSIGNS the key
// (`hookSpecificOutput.additionalContext = …`) because the key must be ABSENT
// rather than empty when there is no version — was invisible to it: a fifth
// emitter shipped, the pinned list stayed at four, and every test here went green.
// The scan is still purely textual (no parse); it just no longer assumes the
// object-literal shape.
const EMITS = /additionalContext\s*[:=]/;

function emitters() {
  return [SCRIPTS, join(SCRIPTS, "lib")].flatMap((dir) =>
    readdirSync(dir)
      .filter((name) => name.endsWith(".mjs") && !name.endsWith(".test.mjs"))
      .map((name) => ({ name, path: join(dir, name), test: join(dir, name.replace(/\.mjs$/, ".test.mjs")) }))
      .filter(({ path }) => EMITS.test(readFileSync(path, "utf8"))),
  );
}

test("the F5 audit knows every additionalContext emitter — the field log named three, there are nine", () => {
  // Pin the list. A new hook lands here first, which is the moment to ask whether the
  // owner should be reading its prose at all. The sixth (F20) is the first that is NOT a
  // startup hook: it rides `UserPromptSubmit`, i.e. EVERY prompt rather than one session
  // start — so the question this guard asks gets harder as the channel widens, not easier.
  // The seventh (the AI-summary notice) widens it again: `PostToolUse` on the READ path,
  // the most-walked path there is. It answers the question by being silent unless a
  // note-taker's signature is in the payload — but it still bounds what it says.
  // The eighth (S4-4, engine divergence) is the first to be caught by this guard while
  // still being WRITTEN: its draft listed five files on five lines (~990 chars) on the
  // reasoning that additionalContext only ever speaks to the agent. It does not, and
  // that is this file's story told once more — so the shipped surface is one sentence.
  // The ninth (the duo-mode authors notice) was caught the same way, in the same state:
  // its draft named every author of the brain and explained the whole rule (~900 chars),
  // on a channel that opens before the owner has typed. Shipped, it names three people
  // and counts the rest, and says in one clause what to call instead of composing a path.
  assert.deepEqual(
    emitters().map(({ name }) => name).sort(),
    [
      "actions-log-seed.mjs",
      "ai-summary-guard.mjs",
      "brain-author.mjs",
      "engine-divergence-nudge.mjs",
      "prompt-restart-nudge.mjs",
      "session-self-heal.mjs",
      "status-hook-output.mjs",
      "universe-reminder.mjs",
      "wiki-health-nudge.mjs",
    ],
  );
});

test("every hook that writes into the channel the owner reads bounds what it writes", () => {
  const unbounded = emitters()
    .filter(({ test: sibling }) => !existsSync(sibling) || !readFileSync(sibling, "utf8").includes(BOUND_MARKER))
    .map(({ name }) => name);

  assert.deepEqual(
    unbounded,
    [],
    `these emitters echo to the owner with no length bound — add a test asserting "${BOUND_MARKER}"`,
  );
});

test("the scan reads real sources, so an empty result cannot pass for a clean one", () => {
  // Without this, a scan that matched nothing would make both tests above pass
  // vacuously forever — the quietest way there is to lose a guard.
  const found = emitters();

  assert.equal(found.length, 9);
  assert.ok(
    found.every(({ path }) => readFileSync(path, "utf8").includes("hookEventName")),
    "an emitter was matched that does not build a hook output at all",
  );
});
