import { test } from "node:test";
import assert from "node:assert/strict";
import { runRefresh } from "./refresh-note.mjs";

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
