import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runSetUniverseProfile, realProfileDeps } from "./set-universe-profile.mjs";

// The deterministic surface behind the profile questions (ADR 0009): the skill
// gathers answers conversationally, this CLI is what actually writes the note, so
// the wording of what happened is never left to the model to improvise.

function deps(overrides = {}) {
  const calls = { logged: [], errored: [], written: [], spawned: [] };
  const files = new Map(Object.entries(overrides.files ?? {}));
  const base = {
    cwd: () => "/brain",
    today: () => "2026-07-27",
    activeUniverse: () => "acme",
    readInput: () => JSON.stringify({ displayName: "Acme Corp", kind: "employer" }),
    io: {
      existsSync: (p) => files.has(p),
      readFileSync: (p) => files.get(p),
      writeFileSync: (p, data) => (calls.written.push({ path: p, data }), files.set(p, data)),
      mkdirSync: () => {},
    },
    spawnSync: (...args) => (calls.spawned.push(args), { status: 0 }),
    platform: "darwin",
    log: (m) => calls.logged.push(m),
    error: (m) => calls.errored.push(m),
  };
  return { args: { ...base, ...overrides, files: undefined }, calls, files };
}

test("runSetUniverseProfile reindexes so the profile is searchable, and says it is", () => {
  // A profile the index has not seen is a page the brain cannot answer FROM,
  // which is most of the point of storing it as a note.
  const { args, calls } = deps();

  const code = runSetUniverseProfile([], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.spawned, [
    ["npm", ["run", "--silent", "reindex"], { cwd: "/brain/rag", stdio: "inherit", shell: false }],
  ]);
  assert.deepEqual(calls.logged, [
    "✓ Profile written: vault/acme/universe.md",
    "✓ RAG re-indexed — the profile is searchable.",
  ]);
});

test("runSetUniverseProfile reindexes from a POSIX cwd, even on a backslashed root", () => {
  // Windows hands cwd() back as C:\brain. join() then emits a mixed-separator
  // path that fs tolerates and every string comparison does not — the exact
  // break that made 22 tests red on the Windows CI jobs and nowhere else.
  const { args, calls } = deps({ cwd: () => "C:\\brain" });

  runSetUniverseProfile([], args);

  assert.equal(calls.spawned[0][2].cwd, "C:/brain/rag");
});

test("runSetUniverseProfile reports a failed reindex instead of claiming success", () => {
  const { args, calls } = deps({ spawnSync: () => ({ status: 1 }) });

  const code = runSetUniverseProfile([], args);

  assert.equal(code, 1);
  assert.match(calls.errored[0], /re-index failed/);
  assert.match(calls.errored[0], /cd rag && npm run reindex/);
});

test("runSetUniverseProfile refuses an existing profile and points at the page to edit", () => {
  // Refusing is only half the job: the owner must be told where the page they
  // already have lives, or a refusal reads as a dead end.
  const { args, calls } = deps({
    files: { "/brain/vault/acme/universe.md": "the owner's own page" },
  });

  const code = runSetUniverseProfile(["--no-reindex"], args);

  assert.equal(code, 1);
  assert.deepEqual(calls.written, []);
  assert.equal(calls.errored.length, 1);
  assert.match(calls.errored[0], /vault\/acme\/universe\.md already exists/);
  assert.match(calls.errored[0], /edit/i);
});

test("runSetUniverseProfile honours an explicit universe over the active one", () => {
  // The backfill flow fills in a universe you are NOT standing in, so an explicit
  // slug must win — otherwise the answers land on the wrong sphere's page.
  const { args, files } = deps({
    readInput: () => JSON.stringify({ universe: "blue", displayName: "Blue Team" }),
  });

  const code = runSetUniverseProfile(["--no-reindex"], args);

  assert.equal(code, 0);
  assert.ok(files.has("/brain/vault/blue/universe.md"));
  assert.ok(!files.has("/brain/vault/acme/universe.md"));
});

test("runSetUniverseProfile writes the profile of the ACTIVE universe and names the note", () => {
  const { args, calls, files } = deps();

  const code = runSetUniverseProfile(["--no-reindex"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.logged, ["✓ Profile written: vault/acme/universe.md"]);
  assert.match(files.get("/brain/vault/acme/universe.md"), /^---\ntype: universe\n/);
  assert.match(files.get("/brain/vault/acme/universe.md"), /displayName: Acme Corp/);
});

// ── --decline: the owner said no, and must not be asked again ────────────────
// The offer is only acceptable BECAUSE refusing sticks (D2). The refusal is
// recorded by this deterministic CLI, not improvised by the session.

test("runSetUniverseProfile --decline records the refusal for the active universe, and says so", () => {
  // Declining must cost nothing: no stdin to feed, no re-index to sit through.
  const { args, calls, files } = deps({
    readInput: () => assert.fail("declining must not demand answers on stdin"),
  });

  const code = runSetUniverseProfile(["--decline"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.spawned, []);
  assert.deepEqual(calls.errored, []);
  assert.deepEqual(JSON.parse(files.get("/brain/.vault-rag/profile-nudges.json")), {
    declined: ["acme"],
  });
  assert.deepEqual(calls.logged, ["✓ Noted — I will not ask about your context again."]);
});

// ── --digest: re-read the working context after a switch ────────────────────
// The SessionStart hook injects the digest of the universe in force AT START.
// Switch mid-session and that context is stale — about the sphere you just left.

test("runSetUniverseProfile --digest prints the working context of the active universe", () => {
  const { args, calls } = deps({
    files: {
      "/brain/vault/acme/universe.md":
        "---\ntype: universe\ndisplayName: Acme Corp\nkind: employer\n---\n\n# Acme Corp\n\n## People\n\n- Zoe (CTO)\n",
    },
  });

  const code = runSetUniverseProfile(["--digest"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.logged, ["[working context]\nAcme Corp (employer).\nPeople: Zoe (CTO)."]);
  assert.deepEqual(calls.spawned, []);
});

test("runSetUniverseProfile --digest is read-only: it never writes and never reindexes", () => {
  // It runs after EVERY switch. A side effect here would fire on a move the owner
  // makes several times a day, and a re-index is the one they would feel.
  const { args, calls } = deps();

  const code = runSetUniverseProfile(["--digest"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.written, []);
  assert.deepEqual(calls.spawned, []);
  assert.deepEqual(calls.errored, []);
});

test("runSetUniverseProfile --digest OFFERS to describe the universe you just switched into", () => {
  // Landing in a sphere the brain knows nothing about is the moment to ask: you are
  // standing in it. Otherwise a universe you rarely start a session in is never
  // asked about at all — which is exactly the case of a brain that grew universes
  // before profiles existed.
  const { args, calls } = deps({
    files: { "/brain/.vault-rag/universes.json": JSON.stringify({ universes: ["acme"] }) },
  });

  const code = runSetUniverseProfile(["--digest"], args);

  assert.equal(code, 0);
  assert.equal(calls.logged.length, 1);
  assert.match(calls.logged[0], /^\[ask the owner\]\n/);
  // Past the gate, so the offer is allowed to name the thing it is describing.
  assert.match(calls.logged[0], /say `universe` plainly/);
});

test("runSetUniverseProfile --digest stays silent once that universe's offer was declined", () => {
  const { args, calls } = deps({
    files: {
      "/brain/.vault-rag/universes.json": JSON.stringify({ universes: ["acme"] }),
      "/brain/.vault-rag/profile-nudges.json": JSON.stringify({ declined: ["acme"] }),
    },
  });

  assert.equal(runSetUniverseProfile(["--digest"], args), 0);
  assert.deepEqual(calls.logged, []);
});

// ── --check-slack: a declared connector is not a verified one (14.6) ─────────
// The native connectors are single-account and do NOT follow a `/switch`, so the
// declaration on the page can be right on screen while the connector is still
// authenticated on the sphere the owner just left. Only the model can ask Slack;
// this door does the comparing, because a string comparison is not its job.

const ACME_WITH_SLACK =
  "---\ntype: universe\ndisplayName: Acme Corp\n---\n\n# Acme Corp\n\n" +
  "## Connector accounts\n\n- Slack: acme.slack.com\n";

test("runSetUniverseProfile --check-slack refuses when the connector is on another workspace", () => {
  const { args, calls } = deps({ files: { "/brain/vault/acme/universe.md": ACME_WITH_SLACK } });

  const code = runSetUniverseProfile(
    ["--check-slack", "https://globex.slack.com/archives/C0123/p1712345678"],
    args,
  );

  assert.equal(code, 1);
  assert.deepEqual(calls.logged, []);
  assert.deepEqual(calls.errored, [
    "✗ Slack is on 'globex' — this universe declares 'acme'. " +
      "Do not read or file Slack data here until the connector is reconnected to 'acme'.",
  ]);
});

test("runSetUniverseProfile --check-slack says out loud when the connector matches", () => {
  // Silence here would be the defect wearing a different hat: "I checked and it is
  // fine" and "nothing ran" must not reach the session as the same nothing.
  const { args, calls } = deps({ files: { "/brain/vault/acme/universe.md": ACME_WITH_SLACK } });

  const code = runSetUniverseProfile(["--check-slack", "acme"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.errored, []);
  assert.deepEqual(calls.logged, [
    "✓ Slack is on 'acme', which is what this universe declares (observed, not assumed).",
  ]);
});

test("runSetUniverseProfile --check-slack does not cry divergence when nothing is declared", () => {
  // A page that declares no Slack account has no claim to contradict. Reporting
  // that as a mismatch would send the owner to reconnect a connector that is fine
  // — and teach them to stop reading the check (CONVENTIONS.md §5quater).
  const { args, calls } = deps({
    files: {
      "/brain/vault/acme/universe.md":
        "---\ntype: universe\ndisplayName: Acme Corp\n---\n\n# Acme Corp\n\n## People\n\n- Zoe (CTO)\n",
    },
  });

  const code = runSetUniverseProfile(["--check-slack", "globex"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.errored, []);
  assert.deepEqual(calls.logged, [
    "? This universe declares no Slack account, so there is nothing to check against. " +
      "Slack is on 'globex'; if that is the right workspace here, add `- Slack: globex` " +
      "under `## Connector accounts` in vault/acme/universe.md.",
  ]);
});

test("runSetUniverseProfile --check-slack survives a universe with no profile page at all", () => {
  // The normal state of every brain installed before profiles existed. An
  // exception here would take down the check the moment it is most plausible.
  const { args, calls } = deps();

  const code = runSetUniverseProfile(["--check-slack", "globex.slack.com"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.errored, []);
  assert.deepEqual(calls.logged, [
    "? This universe has no profile page yet, so it declares no accounts to check against. " +
      "Slack is on 'globex'. `/switch` can describe this sphere, accounts included.",
  ]);
});

test("runSetUniverseProfile --check-slack with nothing observed says so, and never reads as a match", () => {
  // The model calls this after a Slack tool call that may have returned nothing
  // usable. "I could not find out" is its own answer, and it still exits 0: a
  // non-zero would have the skill report a failed check (14.2's call).
  const { args, calls } = deps({ files: { "/brain/vault/acme/universe.md": ACME_WITH_SLACK } });

  const code = runSetUniverseProfile(["--check-slack"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.errored, []);
  assert.deepEqual(calls.logged, [
    "? Slack: this universe declares 'acme' — I could not find out which workspace " +
      "the connector is actually on. Treat it as a claim.",
  ]);
});

// ── the answers arrive on stdin, and stdin is written by a model ─────────────

test("runSetUniverseProfile refuses answers that are not JSON, and says what was wrong", () => {
  // stdin is composed by the session, so a truncated or half-quoted payload is a
  // shape that WILL occur. Swallowed, the run would fall through into writing a
  // profile out of `undefined`; silent, the caller would be told nothing it could
  // act on. So: exit 1, and the parser's own message quoted rather than summarised.
  const { args, calls } = deps({ readInput: () => '{"displayName": "Acme Corp"' });

  const code = runSetUniverseProfile(["--no-reindex"], args);

  assert.equal(code, 1);
  assert.deepEqual(calls.written, []);
  assert.equal(calls.errored.length, 1);
  assert.match(calls.errored[0], /^✗ Invalid JSON answers on stdin: .+/);
});

test("runSetUniverseProfile reindexes through npm.cmd on Windows, npm everywhere else", () => {
  // Spawning bare `npm` on Windows finds nothing (the executable is `npm.cmd`), so
  // the profile would be written and never indexed — the page exists, the brain
  // cannot answer from it, and nothing on screen says so. The shell flag rides with
  // it: npm.cmd needs one since Node 18.20 (CVE-2024-27980) or the spawn is EINVAL.
  const windows = deps({ platform: "win32" });
  runSetUniverseProfile([], windows.args);
  assert.deepEqual(windows.calls.spawned, [
    ["npm.cmd", ["run", "--silent", "reindex"], { cwd: "/brain/rag", stdio: "inherit", shell: true }],
  ]);

  const linux = deps({ platform: "linux" });
  runSetUniverseProfile([], linux.args);
  assert.equal(linux.calls.spawned[0][0], "npm");
  assert.equal(linux.calls.spawned[0][2].shell, false);
});

test("runSetUniverseProfile --check-slack is read-only: it never writes and never reindexes", () => {
  // It runs before every Slack read, which is several times a session. A side
  // effect here would be the most frequently fired one in the whole engine.
  const { args, calls } = deps({ files: { "/brain/vault/acme/universe.md": ACME_WITH_SLACK } });

  runSetUniverseProfile(["--check-slack", "globex"], args);

  assert.deepEqual(calls.written, []);
  assert.deepEqual(calls.spawned, []);
});

// ── the REAL wiring, not the fake one ────────────────────────────────────────
// Every test above injects `deps`, which is what makes the flow readable — and it
// also means the real seams below were observed by nothing at all. They decide
// what the deployed script actually reads and writes, so they are read here
// through the real fs, exactly the way batch 2b read the real manifest.

test("realProfileDeps.io round-trips a note through the real filesystem, as TEXT", () => {
  // `readFileSync` without an encoding returns a Buffer, and a Buffer is what made
  // the pointer read throw in the field: the cores below expect a string, and a
  // Buffer only reveals itself once someone calls a string method on it.
  const dir = mkdtempSync(join(tmpdir(), "sbg-profile-io-"));
  try {
    const path = join(dir, "nested", "universe.md");
    const io = realProfileDeps.io;

    assert.equal(io.existsSync(path), false);
    io.mkdirSync(join(dir, "nested"), { recursive: true });
    io.writeFileSync(path, "# Acme Corp\n");

    assert.equal(io.existsSync(path), true);
    const read = io.readFileSync(path);
    assert.equal(typeof read, "string");
    assert.equal(read, "# Acme Corp\n");
    assert.equal(readFileSync(path, "utf-8"), "# Acme Corp\n"); // and really on disk
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("realProfileDeps.today is the DAY, in the form the note's frontmatter carries", () => {
  // A full ISO timestamp here would land `created: 2026-08-05T19:41:02.114Z` in the
  // frontmatter of every profile — a lint violation on the very page the engine
  // writes, and a date nobody can compare against the other notes' dates.
  const today = realProfileDeps.today();

  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(today, new Date().toISOString().slice(0, 10));
});

test("realProfileDeps.cwd is the process's own directory — the brain the run stands in", () => {
  assert.equal(realProfileDeps.cwd(), process.cwd());
});

test("realProfileDeps.log and .error write to the two streams, and not to the same one", () => {
  // The refusal path exits non-zero and its sentence must reach stderr: a check
  // whose complaint lands on stdout gets swallowed by a caller reading only the
  // one stream it expected, and the divergence goes quiet.
  const seen = { out: [], err: [] };
  const realLog = console.log;
  const realError = console.error;
  console.log = (...a) => seen.out.push(a.join(" "));
  console.error = (...a) => seen.err.push(a.join(" "));
  try {
    realProfileDeps.log("✓ written", "vault/acme/universe.md");
    realProfileDeps.error("✗ diverging");
  } finally {
    console.log = realLog;
    console.error = realError;
  }

  assert.deepEqual(seen.out, ["✓ written vault/acme/universe.md"]);
  assert.deepEqual(seen.err, ["✗ diverging"]);
});
