import { test } from "node:test";
import assert from "node:assert/strict";

import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildCloneArgs,
  buildGitInvocation,
  buildLsRemoteArgs,
  defaultGit,
  fetchSource,
  GIT_MAX_BUFFER,
  readTargetManifest,
  resolveLatestTag,
} from "./engine-fetch.mjs";

// A scripted git seam: returns {out, ok} (the auto-push convention) and records
// every argv it was handed, so a test asserts both the command and the side effect.
function fakeGit({ ok = true, out = "" } = {}) {
  const calls = [];
  const git = (args) => {
    calls.push(args);
    return { out, ok };
  };
  return { git, calls };
}

// ═══════════════════════════════════════════════════════════════════════════
// engine-fetch — resolve + fetch the pinned launcher ref (plan Step 2).
// Shallow-clones the launcher repo at the brain's recorded `source.{repo,ref}`
// into a fresh temp dir and hands that dir back — the REAL implementation of the
// Gate's `fetchSource` seam. git spawn + temp-dir creation are injected so the
// unit tests run offline and deterministically (no network, no real git).
// Cross-platform (ADR 0015): the clone argv is platform-agnostic (git is a .exe
// on Windows, no shell needed) — proven identical under posix AND win32.
// ═══════════════════════════════════════════════════════════════════════════

test("buildCloneArgs — a shallow, single-branch clone of the pinned ref into dir, with LINE ENDINGS PINNED", () => {
  // 🪟 `-c core.autocrlf=false` is W2, and it is the half that stops the defect
  // RECURRING (W1 repairs the brains that already have it). Git for Windows defaults
  // `core.autocrlf` to **true**, so without this the updater's own source tree is CRLF
  // — and every byte the update then delivers is CRLF, so the brain re-records a CRLF
  // digest that no table row can ever match. The fleet would need W1's candidate walk
  // at every update, forever, instead of converging on the LF the object store holds.
  //
  // 🛑 BEFORE the subcommand, not after: `git clone -c …` is not a thing. A flag in the
  // wrong position is not a weaker fix, it is `git: 'clone' is not a git command`.
  assert.deepEqual(
    buildCloneArgs({ repo: "https://example.test/launcher.git", ref: "v2.0.0", dir: "/tmp/src" }),
    [
      "-c",
      "core.autocrlf=false",
      "clone",
      "--depth",
      "1",
      "--branch",
      "v2.0.0",
      "--single-branch",
      "https://example.test/launcher.git",
      "/tmp/src",
    ],
  );
});

test("buildCloneArgs — the `.gitattributes` families are NOT what this pins, and must not be", () => {
  // The trap `.gitattributes`'s own comment warns about, asserted as a boundary rather
  // than trusted: `core.autocrlf` and an explicit `eol=` attribute are different
  // mechanisms, and the attribute WINS. `*.cmd text eol=crlf` therefore still produces
  // CRLF in a pinned clone — which is required, since cmd.exe re-seeks a batch file by
  // byte offset and an LF-only launcher resumes mid-token (field report 2026-08-07).
  //
  // Nothing here can assert git's behaviour; what it CAN assert is that this argv does
  // not try to legislate it — no `core.eol`, no `--config` on the attributes.
  const args = buildCloneArgs({ repo: "r", ref: "v1", dir: "/d" });

  assert.deepEqual(args.filter((a) => a === "-c"), ["-c"], "exactly one -c, so one thing is pinned");
  assert.ok(!args.some((a) => a.startsWith("core.eol")), "core.eol is git's attribute machinery — untouched");
});

test("buildLsRemoteArgs — lists the remote's tag refs only (no dereferenced ^{} dupes)", () => {
  assert.deepEqual(
    buildLsRemoteArgs("https://example.test/launcher.git"),
    ["ls-remote", "--tags", "--refs", "https://example.test/launcher.git"],
  );
});

test("fetchSource — clones the recorded {repo, ref} into a fresh temp dir and returns it", async () => {
  const { git, calls } = fakeGit();
  const dir = await fetchSource({
    repo: "https://example.test/launcher.git",
    ref: "v2.0.0",
    git,
    makeTempDir: () => "/tmp/sbg-src-XXXX",
  });

  assert.equal(dir, "/tmp/sbg-src-XXXX", "fetchSource returns the temp dir it cloned into");
  assert.deepEqual(calls, [
    buildCloneArgs({ repo: "https://example.test/launcher.git", ref: "v2.0.0", dir: "/tmp/sbg-src-XXXX" }),
  ], "git is invoked exactly once with the shallow clone argv targeting the temp dir");
});

test("fetchSource — a failed clone throws a clear error AND removes the orphan temp dir", async () => {
  const { git } = fakeGit({ ok: false, out: "fatal: repository not found" });
  const removed = [];

  await assert.rejects(
    () =>
      fetchSource({
        repo: "https://example.test/missing.git",
        ref: "v9.9.9",
        git,
        makeTempDir: () => "/tmp/sbg-src-DOOMED",
        removeDir: (d) => removed.push(d),
      }),
    /git clone[\s\S]*v9\.9\.9[\s\S]*repository not found/,
    "the error names the ref and relays git's stderr",
  );
  assert.deepEqual(removed, ["/tmp/sbg-src-DOOMED"], "the half-cloned temp dir must be cleaned up");
});

// …and "clear" has to mean clear TO AN OWNER, not to a maintainer. This is the one
// screen a failed update leaves behind, on a product used by non-developers: a bare
// `fatal: repository not found` names no culprit and no way out. So the message says
// WHICH address the brain tried, that the address itself is what did not answer (true
// whether the project moved or the train has no signal), and the one thing that fixes
// the moved case — which is a line in a file nobody would think to open.
test("fetchSource — a failed clone tells the owner which address failed and what they can do", async () => {
  const { git } = fakeGit({ ok: false, out: "fatal: repository not found" });

  await assert.rejects(
    () =>
      fetchSource({
        repo: "https://example.test/missing.git",
        ref: "v9.9.9",
        git,
        makeTempDir: () => "/tmp/sbg-src-DOOMED",
        removeDir: () => {},
      }),
    (e) => {
      assert.match(e.message, /https:\/\/example\.test\/missing\.git/, "the failing address must be named");
      assert.match(e.message, /did not answer/, "say the address did not answer — not that the repo is gone");
      assert.match(e.message, /source\.repo[\s\S]*engine-manifest\.json/, "point at the line that fixes a move");
      return true;
    },
  );
});

test("fetchSource — a brain with no recorded repo fails clearly without spawning git", async () => {
  const { git, calls } = fakeGit();
  let made = false;

  await assert.rejects(
    () => fetchSource({ repo: null, ref: "v2.0.0", git, makeTempDir: () => { made = true; return "/tmp/x"; } }),
    /no source repo recorded/,
    "an absent repo (launcher had no remote) yields an actionable error",
  );
  assert.deepEqual(calls, [], "git is never spawned when there is nothing to clone");
  assert.equal(made, false, "no temp dir is created for a clone that cannot happen");
});

test("resolveLatestTag — parses `git ls-remote --tags` and returns the HIGHEST semver tag", () => {
  const out = [
    "abc123\trefs/tags/v1.0.0",
    "def456\trefs/tags/v1.2.0",
    "789aaa\trefs/tags/v1.10.0",
    "000bbb\trefs/tags/v1.1.0",
  ].join("\n");
  const { git, calls } = fakeGit({ out });

  const tag = resolveLatestTag({ repo: "https://example.test/launcher.git", git });

  assert.equal(tag, "v1.10.0", "numeric ordering: v1.10.0 beats v1.2.0");
  assert.deepEqual(
    calls,
    [["ls-remote", "--tags", "--refs", "https://example.test/launcher.git"]],
    "ls-remote is run once against the recorded repo",
  );
});

test("resolveLatestTag — no recorded repo → null, git never spawned (caller falls back)", () => {
  const { git, calls } = fakeGit();
  assert.equal(resolveLatestTag({ repo: null, git }), null);
  assert.deepEqual(calls, [], "no remote → no git");
});

test("resolveLatestTag — git failure (offline / unreachable) → null (fall back to pinned ref)", () => {
  const { git } = fakeGit({ ok: false, out: "fatal: could not read from remote" });
  assert.equal(resolveLatestTag({ repo: "https://example.test/launcher.git", git }), null);
});

test("resolveLatestTag — a remote with no semver tag → null", () => {
  const out = ["abc\trefs/tags/nightly", "def\trefs/tags/latest"].join("\n");
  const { git } = fakeGit({ out });
  assert.equal(resolveLatestTag({ repo: "https://example.test/launcher.git", git }), null);
});

test("readTargetManifest — reads the fetched manifest → target version vector + index schema", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "sbg-fetched-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(
    join(dir, "engine-manifest.json"),
    JSON.stringify({
      manifestVersion: 1,
      engineVersion: { rag: "1.1.0", constitutionTemplate: "1.0.0", scripts: "1.0.0" },
      indexSchemaVersion: 2,
      regimes: { replace: ["rag/src/**"] },
    }),
  );

  const target = readTargetManifest(dir);

  assert.deepEqual(target.engineVersion, { rag: "1.1.0", constitutionTemplate: "1.0.0", scripts: "1.0.0" });
  assert.equal(target.indexSchemaVersion, 2);
  assert.deepEqual(target.regimes, { replace: ["rag/src/**"] });
});

// ADR 0015 — git is a real executable on BOTH platforms (no npm.cmd-style shell
// wrapper), so the clone needs no `process.platform` branch. Proven by running the
// same fetch with a posix AND a win32 temp-dir path: each is honored verbatim and
// the argv only ever differs in that trailing dir — never in shape or quoting.
for (const { platform, dir } of [
  { platform: "posix", dir: "/tmp/sbg-src-AAA" },
  { platform: "win32", dir: "C:\\Users\\me\\AppData\\Local\\Temp\\sbg-src-AAA" },
]) {
  test(`fetchSource [${platform}] — clones into the platform's temp dir, no shell/quoting`, async () => {
    const { git, calls } = fakeGit();
    const got = await fetchSource({
      repo: "https://example.test/launcher.git",
      ref: "v2.0.0",
      git,
      makeTempDir: () => dir,
    });
    assert.equal(got, dir, "the platform-native temp dir is returned verbatim");
    // The line-ending pin travels on BOTH platforms, and win32 is the one that needs
    // it — asserted here rather than only on `buildCloneArgs`, because what reaches
    // git is what this call passes, not what the builder returns in isolation.
    assert.deepEqual(calls[0], [
      "-c", "core.autocrlf=false",
      "clone", "--depth", "1", "--branch", "v2.0.0", "--single-branch",
      "https://example.test/launcher.git", dir,
    ]);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// defaultGit — debt 2 of the v4.8.0 mutation pass. The real runner used to be a
// single execFileSync call the unit tests never entered (21 live mutants, and a
// comment that documented its own exemption). Same fix as v4.5.0's
// buildCrosscheckInvocation: the request becomes a VALUE, asserted whole, and
// the runner shrinks to the forwarding plus the ok/failure mapping.
//
// No platform branch is asserted on purpose: git is a real executable on Windows
// too (no `.cmd` wrapper, unlike npx), so the invocation is byte-identical
// everywhere — see the module header. That absence is the design, not an omission.
// ─────────────────────────────────────────────────────────────────────────────

test("buildGitInvocation — the whole request, arguments passed through untouched", () => {
  assert.deepEqual(buildGitInvocation(["ls-remote", "--tags", "git@host:me/repo.git"]), {
    command: "git",
    args: ["ls-remote", "--tags", "git@host:me/repo.git"],
    options: { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: GIT_MAX_BUFFER },
  });
});

test("buildGitInvocation — an empty argument list is still a well-formed request", () => {
  assert.deepEqual(buildGitInvocation([]), {
    command: "git",
    args: [],
    options: { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: GIT_MAX_BUFFER },
  });
});

// F10 (v5.0.0 code review) — THE CEILING IS A NUMBER, AND SILENCE IS ITS FAILURE MODE.
//
// This seam carries `git show <ref>:<path>`, the ancestor hydration: whole FILE bytes out
// of the object store. It inherited node's 1 MB default, and `defaultGit` maps any throw
// to `{ ok: false }` — which the update path reads as "the update server could not be
// reached". So a file one byte over the line would have reported a network problem, and
// the owner's merge would have silently gone to a frozen fallback.
test("the git seam's ceiling is far above node's 1 MB default", () => {
  assert.equal(GIT_MAX_BUFFER, 64 * 1024 * 1024, "the value itself, so a slip to a smaller one is caught");
  assert.equal(buildGitInvocation(["show", "v1.0.0:CLAUDE.md"]).options.maxBuffer, GIT_MAX_BUFFER);
});

test("defaultGit — hands the BUILT invocation to the runner, whole and in order", () => {
  const calls = [];
  defaultGit(["status", "--porcelain"], (...a) => {
    calls.push(a);
    return "";
  });
  assert.deepEqual(calls, [
    ["git", ["status", "--porcelain"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: GIT_MAX_BUFFER }],
  ]);
});

test("defaultGit — a run that succeeds returns its output and ok:true", () => {
  // The return value is a fingerprint, never something the mapping could invent.
  assert.deepEqual(defaultGit(["rev-parse", "HEAD"], () => "9f3c1ab-from-the-runner\n"), {
    out: "9f3c1ab-from-the-runner\n",
    ok: true,
  });
});

test("defaultGit — a runner returning nothing maps to an EMPTY string, never undefined", () => {
  // `stdio: ignore` on stdout is a real case, and `out` is concatenated by callers.
  assert.deepEqual(defaultGit(["fetch"], () => undefined), { out: "", ok: true });
  assert.deepEqual(defaultGit(["fetch"], () => null), { out: "", ok: true });
});

test("defaultGit — a failing run maps to ok:false, stdout THEN stderr", () => {
  const boom = Object.assign(new Error("git exited 128"), {
    stdout: "partial-output",
    stderr: "fatal: repository not found",
  });
  assert.deepEqual(
    defaultGit(["clone", "nope"], () => {
      throw boom;
    }),
    { out: "partial-outputfatal: repository not found", ok: false },
  );
});

test("defaultGit — a failure carrying neither stream is an empty out, not 'undefined'", () => {
  assert.deepEqual(
    defaultGit(["clone", "nope"], () => {
      throw new Error("spawn ENOENT");
    }),
    { out: "", ok: false },
  );
});
