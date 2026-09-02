// ─────────────────────────────────────────────────────────────────────────────
// dated-note-path.test.mjs — the entry point that answers "where does today's
// dated note go?" so nobody composes that path by hand (plan step 4).
//
// It answers TWO things, and the second is what makes the rule work next time:
// the path, and the `author:` the note must stamp. Without the stamp, tomorrow's
// resolution reads a note that claims nobody, degrades to the shared file, and the
// mechanism quietly stops existing.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runDatedNotePath } from "./dated-note-path.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "dated-note-path.mjs");

const ME = "Thomas Pierrain";
const HER = "Claire Dubois";

function fakeDeps(overrides = {}) {
  const logs = [];
  const errors = [];
  return {
    deps: {
      notes: () => overrides.notes ?? [],
      author: () => (overrides.author === undefined ? ME : overrides.author),
      log: (l) => logs.push(l),
      error: (l) => errors.push(l),
    },
    logs,
    errors,
  };
}

const HER_DAY = [{ path: "briefings/2026-09-02.md", frontmatter: { author: HER } }];

test("a day nobody has written yields the base name, and the author to stamp on it", () => {
  const { deps, logs, errors } = fakeDeps();

  assert.equal(runDatedNotePath(["--folder", "daily", "--date", "2026-09-02"], deps), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(logs, ["path: vault/daily/2026-09-02.md", `author: ${ME}`]);
});

// 🎯 The case the step exists for, and the line that explains it — a file appearing
// under a name nobody chose is confusing unless the reason comes with it.
test("a day someone else already wrote yields a file of my own, and says why", () => {
  const { deps, logs } = fakeDeps({ notes: HER_DAY });

  assert.equal(runDatedNotePath(["--folder", "briefings", "--date", "2026-09-02"], deps), 0);
  assert.equal(logs[0], "path: vault/briefings/2026-09-02-thomas-pierrain.md");
  assert.equal(logs[1], `author: ${ME}`);
  assert.match(logs[2], new RegExp(HER));
  assert.match(logs[2], /briefings\/2026-09-02\.md/);
});

test("the author who owns the day keeps writing to it, with nothing to explain", () => {
  const { deps, logs } = fakeDeps({ notes: HER_DAY, author: HER });

  assert.equal(runDatedNotePath(["--folder", "briefings", "--date", "2026-09-02"], deps), 0);
  assert.deepEqual(logs, ["path: vault/briefings/2026-09-02.md", `author: ${HER}`]);
});

test("an explicit --author overrides what git says, so the rule is testable and forceable", () => {
  const { deps, logs } = fakeDeps({ notes: HER_DAY });

  runDatedNotePath(["--folder", "briefings", "--date", "2026-09-02", "--author", "Amina Haddad"], deps);

  assert.equal(logs[0], "path: vault/briefings/2026-09-02-amina-haddad.md");
});

// A machine whose git has no user.name cannot name a person, and inventing one is
// worse than falling back: the shared file merges visibly, an invented path does not.
test("a machine with no git author falls back to the shared file, and says so", () => {
  const { deps, logs } = fakeDeps({ notes: HER_DAY, author: null });

  assert.equal(runDatedNotePath(["--folder", "briefings", "--date", "2026-09-02"], deps), 0);
  assert.equal(logs[0], "path: vault/briefings/2026-09-02.md");
  assert.doesNotMatch(logs.join("\n"), /^author:/m, "there is no name to stamp, so none is invented");
  assert.match(logs.join("\n"), /user\.name/);
});

test("a broken question exits 2 and answers nothing on stdout", () => {
  for (const argv of [[], ["--folder", "daily"], ["--date", "2026-09-02"], ["--folder", "daily", "--date", "yesterday"]]) {
    const { deps, logs, errors } = fakeDeps();
    assert.equal(runDatedNotePath(argv, deps), 2, JSON.stringify(argv));
    assert.deepEqual(logs, []);
    assert.equal(errors.length, 1);
  }
});

// A vault that cannot be read is "I could not find out", and the safe answer is the
// shared file — today's behaviour, a visible merge, never an invented path.
test("a vault that cannot be read still answers, with the shared file", () => {
  const { deps, logs } = fakeDeps();
  deps.notes = () => {
    throw new Error("ENOENT");
  };

  assert.equal(runDatedNotePath(["--folder", "daily", "--date", "2026-09-02"], deps), 0);
  assert.equal(logs[0], "path: vault/daily/2026-09-02.md");
});

// ═══════════════════════════════════════════════════════════════════════════
// AS A PROCESS (CONVENTIONS §5bis) — argv, the real vault reader, the real git.
// ═══════════════════════════════════════════════════════════════════════════

test("run as a process from a brain folder, it reads that brain's vault", () => {
  const root = mkdtempSync(join(tmpdir(), "kenjaku-dated-note-"));
  mkdirSync(join(root, "vault", "briefings"), { recursive: true });
  writeFileSync(
    join(root, "vault", "briefings", "2026-09-02.md"),
    `---\ntype: briefing\nauthor: ${HER}\n---\n\n# Briefing\n`,
  );

  const run = spawnSync(
    process.execPath,
    [CLI, "--folder", "briefings", "--date", "2026-09-02", "--author", ME],
    { cwd: root, encoding: "utf8" },
  );

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^path: vault\/briefings\/2026-09-02-thomas-pierrain\.md$/m);
  assert.match(run.stdout, new RegExp(`^author: ${ME}$`, "m"));
});

test("as a process, a brain with no vault at all still answers the base name", () => {
  const root = mkdtempSync(join(tmpdir(), "kenjaku-dated-note-empty-"));

  const run = spawnSync(process.execPath, [CLI, "--folder", "daily", "--date", "2026-09-02", "--author", ME], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^path: vault\/daily\/2026-09-02\.md$/m);
});
