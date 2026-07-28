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
  assert.match(d.errs[0], /does not exist|file-back/i);
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
  assert.match(d.errs[0], /vault/i);
});

test("invalid JSON on stdin is refused, loudly", () => {
  const d = deps();
  d.readInput = () => "{ not json";
  assert.equal(runRefresh([], d), 1);
  assert.equal(d.written.length, 0);
  assert.match(d.errs[0], /JSON/i);
});
