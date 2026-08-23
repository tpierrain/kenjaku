import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sessionWikiHealth } from "./session-wiki-health.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// sessionWikiHealth is the Track-F SessionStart core: it reads the vault (injected),
// runs the deterministic lint + consolidation scans, and emits the chat nudge ONLY
// when there is something actionable (dangling links or consolidation candidates).
// Fail-open: it never throws, so it can never disturb session start.

// A capture note under a capture zone, citing a target that has no page yet — a
// new-page consolidation candidate that makes the nudge fire.
const captureCitingMissingPage = {
  path: "meetings/2026-07-10.md",
  frontmatter: { type: "meeting", created: "2026-07-10", updated: "2026-07-10", tags: ["m"] },
  body: "Met with [[Acme Corp]] about the roadmap.",
};

function seams(overrides = {}) {
  const calls = { emitted: [] };
  const base = {
    vaultDir: "/brain/vault",
    readNotes: () => [captureCitingMissingPage],
    emit: (msg) => calls.emitted.push(msg),
  };
  return { args: { ...base, ...overrides }, calls };
}

test("sessionWikiHealth — empty vault → emits nothing (quiet)", () => {
  const { args, calls } = seams({ readNotes: () => [] });
  sessionWikiHealth(args);
  assert.deepEqual(calls.emitted, []);
});

test("sessionWikiHealth — a capture citing a page-less entity → emits the consolidation nudge", () => {
  const { args, calls } = seams();
  sessionWikiHealth(args);
  assert.equal(calls.emitted.length, 1);
  // A count, not a command: this line is the systemMessage the CLI prints clean to
  // the owner (F5). `/consolidate` is named by the wrapper, which speaks to the agent.
  assert.equal(calls.emitted[0], "1 consolidation candidates and 1 dangling links");
});

test("sessionWikiHealth — reads FROM the given vaultDir", () => {
  const seen = [];
  const { args } = seams({ readNotes: (dir) => (seen.push(dir), []) });
  sessionWikiHealth(args);
  assert.deepEqual(seen, ["/brain/vault"]);
});

test("sessionWikiHealth — fail-open: a throwing readNotes never propagates, emits nothing", () => {
  const { args, calls } = seams({
    readNotes: () => {
      throw new Error("vault unreadable");
    },
  });
  sessionWikiHealth(args); // must NOT throw
  assert.deepEqual(calls.emitted, []);
});

test("settings.json.template wires session-wiki-health as a SessionStart hook, AFTER session-self-heal", () => {
  const settings = JSON.parse(
    readFileSync(join(REPO_ROOT, ".claude", "settings.json.template"), "utf8"),
  );
  const commands = settings.hooks.SessionStart.flatMap((entry) => entry.hooks.map((h) => h.command));
  const wikiIdx = commands.findIndex((c) => c.includes("session-wiki-health.mjs"));
  const selfHealIdx = commands.findIndex((c) => c.includes("session-self-heal.mjs"));
  assert.ok(wikiIdx >= 0, "session-wiki-health.mjs must be wired on SessionStart");
  assert.ok(selfHealIdx >= 0, "session-self-heal.mjs must stay wired on SessionStart");
  assert.ok(selfHealIdx < wikiIdx, "wiki-health must run after self-heal (the restart nudge keeps priority)");
});

// ─────────────────────────────────────────────────────────────────────────────
// THE ENTRY-POINT SEAM, RUN AS A PROCESS — and specifically through a SYMLINKED
// brain path, which is the shape the hand-rolled guard silently skips.
//
// `resolve(process.argv[1]) === fileURLToPath(import.meta.url)` compares the path
// AS TYPED against the path Node REALPATH-RESOLVED to load the module. They differ
// the moment any component of the brain's path is a symlink — an aliased volume, a
// synced folder, macOS's own /tmp → /private/tmp — and the guarded body then never
// runs. No output, no error, no exit code: the hook is simply dead.
//
// `installer.mjs` builds the brain path with resolve() and never realpathSync, so
// whatever the owner typed is what lands in the hook command. This pole therefore
// runs the REAL hook, as a REAL process, through both spellings of the same file.
// ─────────────────────────────────────────────────────────────────────────────
test("the hook speaks through a SYMLINKED brain path, exactly as through the real one", async (t) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-wiki-symlink-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const brain = join(root, "brain");
  mkdirSync(join(brain, "vault", "meetings"), { recursive: true });
  cpSync(join(REPO_ROOT, "scripts"), join(brain, "scripts"), { recursive: true });
  // The same capture-citing-a-page-less-entity the unit poles above use, on disk.
  writeFileSync(
    join(brain, "vault", "meetings", "2026-07-10.md"),
    `---\ntype: meeting\ncreated: 2026-07-10\nupdated: 2026-07-10\ntags: [m]\n---\n\nMet with [[Acme Corp]] about the roadmap.\n`,
  );
  const alias = join(root, "aliased-brain");
  symlinkSync(brain, alias);

  const run = (base) =>
    new Promise((resolvePromise) => {
      const child = spawn(process.execPath, [join(base, "scripts", "session-wiki-health.mjs")], {
        stdio: ["pipe", "pipe", "pipe"],
      });
      child.stdin.end("{}");
      let out = "";
      child.stdout.on("data", (c) => (out += c));
      child.on("close", () => resolvePromise(out));
    });

  // THE PREMISE FIRST: without this, a hook that is mute everywhere would pass the
  // symlink assertion below for the wrong reason — the FR pole's exact mistake.
  const real = await run(brain);
  assert.match(real, /consolidation candidates/, "premise: through its real path the hook DOES speak");

  const aliased = await run(alias);
  assert.equal(aliased, real, "a symlinked brain path must not change one byte of what the hook says");
});
