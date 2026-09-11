import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { runUnwrap, listMarkdownFiles } from "./unwrap-markdown.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "unwrap-markdown.mjs");

// ═══════════════════════════════════════════════════════════════════════════
// unwrap-markdown (the CLI) — the thin glue over the pure rewriter. Binary exit
// code (0 nothing to do / 1 --check found something / 2 usage error). All side
// effects come through an injected `deps` port, and the entry point itself is
// covered by RUNNING it as a process (CONVENTIONS §5bis): a module's exports can
// all be green while the file does nothing, because no import-based test ever
// executes the composition root.
// ═══════════════════════════════════════════════════════════════════════════

// An in-memory filesystem keyed the way production keys it (`join`), never with a
// hard-coded POSIX literal — a POSIX-keyed fake silently misses subdirectories on
// Windows (CONVENTIONS §9).
function fakeDeps(files = {}, dirs = []) {
  const logs = [];
  const errors = [];
  const written = {};
  const deps = {
    isDirectory: (p) => dirs.includes(p),
    readDir: (p) => {
      const prefix = p + sep;
      const names = new Set();
      for (const path of [...Object.keys(files), ...dirs]) {
        if (!path.startsWith(prefix)) continue;
        names.add(path.slice(prefix.length).split(sep)[0]);
      }
      return [...names];
    },
    readFile: (p) => files[p],
    writeFile: (p, text) => {
      written[p] = text;
    },
    log: (line) => logs.push(line),
    error: (line) => errors.push(line),
  };
  return { deps, logs, errors, written };
}

test("runUnwrap — with no target it prints the usage line on stderr and exits 2", () => {
  const { deps, logs, errors } = fakeDeps();
  assert.equal(runUnwrap([], deps), 2);
  assert.deepEqual(logs, [], "a usage error prints nothing on stdout");
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^usage: node scripts\/unwrap-markdown\.mjs \[--check\] <file\|dir>/);
});

test("runUnwrap — `--check` alone is still no target: the flag is not a path", () => {
  const { deps, errors } = fakeDeps();
  assert.equal(runUnwrap(["--check"], deps), 2);
  assert.equal(errors.length, 1);
});

test("runUnwrap — a wrapped file is rewritten, named on stdout, and counted", () => {
  const note = join("vault", "a.md");
  const { deps, logs, written } = fakeDeps({ [note]: "a cut\nline" });
  assert.equal(runUnwrap([note], deps), 0);
  assert.deepEqual(written, { [note]: "a cut line" });
  assert.deepEqual(logs, ["unwrapped: vault/a.md", "1 file(s) rewritten"]);
});

test("runUnwrap — an already-clean file is not rewritten at all, and the count says zero", () => {
  const note = join("vault", "a.md");
  const { deps, logs, written } = fakeDeps({ [note]: "one single line" });
  assert.equal(runUnwrap([note], deps), 0);
  assert.deepEqual(written, {}, "an untouched file must not be rewritten — that alone would dirty every git status");
  assert.deepEqual(logs, ["0 file(s) rewritten"]);
});

test("runUnwrap — `--check` reports what WOULD change, writes nothing, and exits 1 so it can gate", () => {
  const note = join("vault", "a.md");
  const { deps, logs, written } = fakeDeps({ [note]: "a cut\nline" });
  assert.equal(runUnwrap(["--check", note], deps), 1);
  assert.deepEqual(written, {}, "--check must never touch the disk");
  assert.deepEqual(logs, ["would unwrap: vault/a.md", "1 file(s) would change"]);
});

test("runUnwrap — `--check` on a clean tree exits 0, so it only fails when there is something to fail on", () => {
  const note = join("vault", "a.md");
  const { deps, logs } = fakeDeps({ [note]: "already one line" });
  assert.equal(runUnwrap(["--check", note], deps), 0);
  assert.deepEqual(logs, ["0 file(s) would change"]);
});

test("runUnwrap — the flag is recognised after the path as well as before it", () => {
  const note = join("vault", "a.md");
  const { deps, written } = fakeDeps({ [note]: "a cut\nline" });
  assert.equal(runUnwrap([note, "--check"], deps), 1);
  assert.deepEqual(written, {});
});

test("runUnwrap — a directory is walked recursively, and every wrapped note under it is rewritten", () => {
  const root = "vault";
  const people = join(root, "people");
  const top = join(root, "top.md");
  const deep = join(people, "jane-doe.md");
  const { deps, logs, written } = fakeDeps({ [top]: "top cut\nhere", [deep]: "deep cut\nhere" }, [root, people]);
  assert.equal(runUnwrap([root], deps), 0);
  assert.deepEqual(written, { [top]: "top cut here", [deep]: "deep cut here" });
  assert.equal(logs.at(-1), "2 file(s) rewritten");
});

test("runUnwrap — several targets are all scanned, and the count is the total across them", () => {
  const a = join("one", "a.md");
  const b = join("two", "b.md");
  const { deps, logs } = fakeDeps({ [a]: "a cut\nhere", [b]: "b cut\nhere" });
  assert.equal(runUnwrap([a, b], deps), 0);
  assert.deepEqual(logs, ["unwrapped: one/a.md", "unwrapped: two/b.md", "2 file(s) rewritten"]);
});

test("listMarkdownFiles — a non-Markdown file is never read, whatever it is named", () => {
  const png = join("vault", "shot.png");
  const { deps } = fakeDeps({ [png]: "binary" });
  assert.deepEqual(listMarkdownFiles(png, deps), []);
});

test("listMarkdownFiles — dot-folders and node_modules are skipped, their neighbours are not", () => {
  const root = "vault";
  const obsidian = join(root, ".obsidian");
  const modules = join(root, "node_modules");
  const kept = join(root, "kept.md");
  const files = {
    [kept]: "x",
    [join(obsidian, "workspace.md")]: "x",
    [join(modules, "readme.md")]: "x",
  };
  const { deps } = fakeDeps(files, [root, obsidian, modules]);
  assert.deepEqual(listMarkdownFiles(root, deps), [kept]);
});

// ── The entry-point seam: run the FILE as a process (CONVENTIONS §5bis) ──────

function withTempVault(fn) {
  const root = mkdtempSync(join(tmpdir(), "kenjaku-unwrap-"));
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("the CLI, run as a process, rewrites a real hard-wrapped note and exits 0", () => {
  withTempVault((root) => {
    const nested = join(root, "people");
    mkdirSync(nested);
    const note = join(nested, "jane-doe.md");
    writeFileSync(note, ["---", "type: person", "---", "", "A paragraph an editor cut", "in the middle of itself."].join("\n"));

    const run = spawnSync(process.execPath, [CLI, root], { encoding: "utf8" });

    assert.equal(run.status, 0, run.stderr);
    assert.equal(
      readFileSync(note, "utf8"),
      ["---", "type: person", "---", "", "A paragraph an editor cut in the middle of itself."].join("\n"),
    );
    assert.match(run.stdout, /1 file\(s\) rewritten/);
  });
});

test("the CLI, run as a process with --check, leaves the file alone and exits 1", () => {
  withTempVault((root) => {
    const note = join(root, "a.md");
    const before = "a cut\nline";
    writeFileSync(note, before);

    const run = spawnSync(process.execPath, [CLI, "--check", root], { encoding: "utf8" });

    assert.equal(run.status, 1);
    assert.equal(readFileSync(note, "utf8"), before, "--check must not have touched the disk");
    assert.match(run.stdout, /would unwrap: /);
  });
});

test("the CLI, run as a process with no argument, exits 2 and says how to call it", () => {
  const run = spawnSync(process.execPath, [CLI], { encoding: "utf8" });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /usage: node scripts\/unwrap-markdown\.mjs/);
});
