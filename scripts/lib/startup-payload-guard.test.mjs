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
// found four. So the leak does not scale with our care — it scales with the number
// of hooks we add, and the next one will be written by someone who never read this
// story.
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

function emitters() {
  return [SCRIPTS, join(SCRIPTS, "lib")].flatMap((dir) =>
    readdirSync(dir)
      .filter((name) => name.endsWith(".mjs") && !name.endsWith(".test.mjs"))
      .map((name) => ({ name, path: join(dir, name), test: join(dir, name.replace(/\.mjs$/, ".test.mjs")) }))
      .filter(({ path }) => readFileSync(path, "utf8").includes("additionalContext:")),
  );
}

test("the F5 audit knows every additionalContext emitter — the field log named three, there are four", () => {
  // Pin the list. A new startup hook lands here first, which is the moment to ask
  // whether the owner should be reading its prose at all.
  assert.deepEqual(
    emitters().map(({ name }) => name).sort(),
    ["actions-log-seed.mjs", "session-self-heal.mjs", "universe-reminder.mjs", "wiki-health-nudge.mjs"],
  );
});

test("every startup hook that writes into the channel the owner reads bounds what it writes", () => {
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

  assert.equal(found.length, 4);
  assert.ok(
    found.every(({ path }) => readFileSync(path, "utf8").includes("hookEventName")),
    "an emitter was matched that does not build a hook output at all",
  );
});
