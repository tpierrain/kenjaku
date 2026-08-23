import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { runRefresh, realRefreshDeps } from "./refresh-note.mjs";

const PAGE = `---
type: topic
created: 2026-06-02
updated: 2026-07-19
tags: [crise]
---

# Crise Kandor

Earlier body.
`;

// Records what the CLI would do to disk, so the wiring is testable without one.
function deps({ files = { "/brain/vault/topics/crise.md": PAGE } } = {}) {
  const written = [];
  const out = [];
  const errs = [];
  return {
    written,
    out,
    errs,
    cwd: () => "/brain",
    today: () => "2026-07-28",
    readInput: () => JSON.stringify({ path: "topics/crise.md", section: "## 2026-07-28 — x\n\nnew\n" }),
    exists: (p) => p in files,
    readFile: (p) => files[p],
    writeFile: (p, content) => written.push([p, content]),
    log: (m) => out.push(m),
    error: (m) => errs.push(m),
  };
}

test("refreshing a living page bumps `updated:` in place and appends the section", () => {
  const d = deps();

  assert.equal(runRefresh([], d), 0);

  assert.equal(d.written.length, 1);
  const [path, content] = d.written[0];
  assert.equal(path, "/brain/vault/topics/crise.md");
  assert.equal(content.split("---")[1].match(/^updated:/gm).length, 1);
  assert.match(content, /updated: 2026-07-28/);
  assert.match(content, /## 2026-07-28 — x/);
  assert.match(d.out[0], /topics\/crise\.md/);
});

test("a page that does not exist is refused — refreshing never CREATES", () => {
  // Creation has its own deterministic door (file-back-note.mjs). Silently creating
  // here would bypass the taxonomy that door enforces.
  const d = deps({ files: {} });
  assert.equal(runRefresh([], d), 1);
  assert.equal(d.written.length, 0);
  // Asserted WHOLE, not `/does not exist|file-back/`: an OR lets either half of the
  // message disappear while the test stays green, and the second half is the only
  // thing that tells the owner where to go instead.
  assert.deepEqual(d.errs, [
    "✗ vault/topics/crise.md does not exist — refreshing never creates. " +
      "File a new page with scripts/file-back-note.mjs instead.",
  ]);
});

test("a page whose frontmatter is already damaged is named, and left alone", () => {
  const damaged = "---\ntype: topic\nupdated: 2026-07-19\nupdated: 2026-07-19\n---\n\n# C\n";
  const d = deps({ files: { "/brain/vault/topics/crise.md": damaged } });

  assert.equal(runRefresh([], d), 1);
  assert.equal(d.written.length, 0, "a damaged page is never written to");
  assert.match(d.errs[0], /duplicate/i);
  assert.match(d.errs[0], /updated/);
});

test("a path escaping the vault is refused", () => {
  const d = deps();
  d.readInput = () => JSON.stringify({ path: "../../.ssh/config", section: "## s\n" });
  assert.equal(runRefresh([], d), 1);
  assert.equal(d.written.length, 0);
  assert.deepEqual(d.errs, [
    '✗ "../../.ssh/config" is outside the vault — a refresh only ever touches vault/.',
  ]);
});

test("on a WINDOWS brain the path is normalised, not flattened", () => {
  // `cwd()` there hands back `C:\brain`, and every comparison in this script is made in
  // POSIX form. Replacing the backslash with nothing instead of `/` yields `C:brainvault`
  // — a path that exists nowhere, so a refresh on Windows would report "does not exist"
  // for a note sitting right there. The CI matrix runs Windows (CONVENTIONS §9).
  const d = deps({ files: { "C:/brain/vault/topics/crise.md": PAGE } });
  d.cwd = () => "C:\\brain";

  assert.equal(runRefresh([], d), 0, d.errs[0]);
  assert.equal(d.written.length, 1);
  assert.equal(d.written[0][0], "C:/brain/vault/topics/crise.md");
});

test("a SIBLING of the vault is refused too — the separator is the whole guard", () => {
  // `../secrets/x.md` does not climb far enough to look like an escape: it resolves
  // to /brain/secrets/x.md, which still starts with the string "/brain/vault" minus
  // its trailing slash... and any neighbour named vault-something starts with it
  // outright. Without the separator, a refresh reaches straight out of the vault it
  // is supposed to be confined to.
  for (const escape of ["../vault-secrets/x.md", "../vaultkeys.md"]) {
    const d = deps();
    d.readInput = () => JSON.stringify({ path: escape, section: "## s\n" });

    assert.equal(runRefresh([], d), 1, `${escape} must be refused`);
    assert.equal(d.written.length, 0, `${escape} must not be written`);
    assert.deepEqual(d.errs, [
      `✗ "${escape}" is outside the vault — a refresh only ever touches vault/.`,
    ]);
  }
});

test("a BACKSLASH escape is refused too — the guard normalises before it compares", () => {
  // Found by review, and reproduced against a real brain before being fixed here.
  // `join("/brain/vault", "..\\outside.md")` leaves the backslash literal on POSIX;
  // `toPosix` then turns it into "/brain/vault/../outside.md", which starts with
  // "/brain/vault/" and sailed through the containment check — while `fs` resolved
  // it to the escaped target. Read AND write: the spec arrives on stdin from an LLM
  // invocation, and this release widened what it carries (a free-form basis).
  //
  // Run as a real process on purpose: the injected `exists`/`readFile` fakes key on
  // literal strings, so they cannot tell a path `fs` would resolve elsewhere from
  // one it would not — the fake would report the escape as "does not exist" and the
  // test would pass on the wrong reason.
  const brain = mkdtempSync(join(tmpdir(), "refresh-escape-"));
  mkdirSync(join(brain, "vault", "topics"), { recursive: true });
  writeFileSync(join(brain, "vault", "topics", "crise.md"), PAGE);
  const outside = join(brain, "outside.md");
  writeFileSync(outside, PAGE);

  const escaped = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./refresh-note.mjs", import.meta.url))],
    {
      cwd: brain,
      input: JSON.stringify({ path: "..\\outside.md", section: "## Escaped\n\nx" }),
      encoding: "utf8",
    },
  );

  assert.equal(escaped.status, 1, escaped.stdout);
  assert.match(escaped.stderr, /is outside the vault — a refresh only ever touches vault\//);
  assert.equal(readFileSync(outside, "utf8"), PAGE, "the file outside the vault must be untouched");
});

test("valid JSON that is not a refresh spec is refused, not crashed on", () => {
  // `null`, `"x"` and `[]` all PARSE, so they sail past the try/catch around
  // JSON.parse and reach `spec.path` — where `null` threw a TypeError and printed a
  // node stack trace at an owner, breaking the skill's stated contract ("Exit 1 =
  // refused, and it says why"). Three shapes, because one would not distinguish "is
  // an object" from "is not null".
  for (const payload of ["null", '"x"', "[]"]) {
    const d = deps();
    d.readInput = () => payload;

    assert.doesNotThrow(() => runRefresh([], d), `payload ${payload} must not throw`);
    assert.equal(runRefresh([], d), 1, `payload ${payload} must be refused`);
    assert.equal(d.written.length, 0);
    assert.match(d.errs[0], /path/i, `payload ${payload} must say what is missing`);
  }
});

test("invalid JSON on stdin is refused, loudly", () => {
  const d = deps();
  d.readInput = () => "{ not json";
  assert.equal(runRefresh([], d), 1);
  assert.equal(d.written.length, 0);
  assert.match(d.errs[0], /JSON/i);
});

test("runRefresh — forwards a confidence promotion to the writer, so it is not a freehand edit", () => {
  // The rule that a marked card is re-verified needs a gesture that RECORDS the
  // outcome. Without this the only way to promote a card is hand-editing its
  // frontmatter — the exact move that put two `updated:` keys on one page.
  const d = deps({
    files: {
      "/brain/vault/people/jeremy-hinard.md": `---
type: person
created: 2026-06-02
updated: 2026-07-19
tags: [candor]
confidence: probable
---

# Jérémy Hinard

> **Confidence** — 🟡 derived or probable · the surname comes from the Candor org note.

Front-end at Candor.
`,
    },
  });
  d.readInput = () =>
    JSON.stringify({
      path: "people/jeremy-hinard.md",
      confidence: { level: "observed", basis: "he introduced himself in #candor, 2026-08-03." },
    });
  assert.equal(runRefresh([], d), 0);
  assert.deepEqual(d.errs, []);
  const [, content] = d.written[0];
  assert.match(content, /\nconfidence: observed\n/, "the field is promoted");
  assert.match(
    content,
    /^> \*\*Confidence\*\* — ✅ observed · he introduced himself in #candor, 2026-08-03\.$/m,
    "and the visible block with it, or the page contradicts itself",
  );
});

// ── The real wiring, run the way the brain runs it ─────────────────────────
// Every test above injects its own deps, so `realRefreshDeps` and the
// entrypoint guard were observed by nothing: this script could read no stdin,
// write nowhere and log nothing with the suite still green. One real child
// process against a throwaway brain closes it — and it is the only test here
// that proves a refresh REWRITES the page on disk rather than describing it.

test("refresh-note, as a real process — rewrites the page and bumps updated:", () => {
  const brain = mkdtempSync(join(tmpdir(), "refresh-e2e-"));
  mkdirSync(join(brain, "vault", "topics"), { recursive: true });
  const page = join(brain, "vault", "topics", "crise.md");
  writeFileSync(page, PAGE);
  const run = (input) =>
    spawnSync(process.execPath, [fileURLToPath(new URL("./refresh-note.mjs", import.meta.url))], {
      cwd: brain,
      input,
      encoding: "utf8",
    });

  const today = new Date().toISOString().slice(0, 10);
  const ok = run(JSON.stringify({ path: "topics/crise.md", section: "## New\n\nAdded." }));
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(ok.stdout.trim(), `✓ Refreshed: vault/topics/crise.md (updated: ${today})`);
  const after = readFileSync(page, "utf8");
  assert.match(after, new RegExp(`\\nupdated: ${today}\\n`), "the date is stamped, not described");
  assert.match(after, /\n## New\n\nAdded\.\n$/);
  assert.match(after, /created: 2026-06-02/, "creation date untouched");

  // And it never creates: a page that is not there is a refusal, not a write.
  const missing = run(JSON.stringify({ path: "topics/nope.md", section: "x" }));
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /does not exist — refreshing never creates/);
  assert.equal(existsSync(join(brain, "vault", "topics", "nope.md")), false);
});

test("the CLI, run as a process with EMPTY stdin — a usage error, not a write", () => {
  // The one HARMLESS real invocation this CLI has: no argv parsing happens at all,
  // so the only door in is stdin, and empty stdin fails JSON.parse before the vault
  // is even looked at — exit 1, an error line, and (by construction) nothing written.
  // `input: ""` closes stdin immediately, so this can never block waiting for EOF.
  const run = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./refresh-note.mjs", import.meta.url))],
    { input: "", encoding: "utf8" },
  );

  assert.equal(run.status, 1, run.stdout);
  assert.match(run.stderr, /Invalid JSON spec on stdin/);
});

// ─────────────────────────────────────────────────────────────────────────────
// The entry-point seam — asserted by RUNNING the CLI as a process, which is the
// only thing that proves the tail actually fires. Modeled on lint-vault.test.mjs's
// canary test: the same shared tail lands on every top-level scripts/*.mjs.
// ─────────────────────────────────────────────────────────────────────────────

test("the CLI, IMPORTED rather than run — the body must not fire on import", async () => {
  // The whole point of the tail: importing the module runs nothing. Asserted from
  // a child process so an accidental process.exit() cannot take the suite with it.
  const target = new URL("./refresh-note.mjs", import.meta.url).href;
  const probe = `import("${target}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the CLI must not exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});

test("realRefreshDeps — the real ports are what they claim, field by field", () => {
  const dir = mkdtempSync(join(tmpdir(), "refresh-deps-"));
  const file = join(dir, "note.md");
  writeFileSync(file, "Réunion\n");
  assert.equal(realRefreshDeps.cwd(), process.cwd());
  assert.equal(realRefreshDeps.today(), new Date().toISOString().slice(0, 10));
  assert.match(realRefreshDeps.today(), /^\d{4}-\d{2}-\d{2}$/, "a date stamp, not an instant");
  assert.equal(realRefreshDeps.exists(file), true);
  assert.equal(realRefreshDeps.exists(join(dir, "nope.md")), false);
  // The exact string, accents and all: a loose match passes on the wrong encoding.
  assert.equal(realRefreshDeps.readFile(file), "Réunion\n");
  // Two levels missing, so a non-recursive mkdir cannot do this one.
  realRefreshDeps.writeFile(join(dir, "a", "b", "written.md"), "body\n");
  assert.equal(readFileSync(join(dir, "a", "b", "written.md"), "utf8"), "body\n");
});
