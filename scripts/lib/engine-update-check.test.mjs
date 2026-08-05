import { test } from "node:test";
import assert from "node:assert/strict";

import { checkUpstream, releasesAhead } from "./engine-update-check.mjs";

// A scripted git seam, same convention as engine-fetch's tests: args[] → {out, ok},
// recording every argv so a test asserts the command AND the effect.
function fakeGit({ ok = true, out = "" } = {}) {
  const calls = [];
  return { git: (args) => (calls.push(args), { out, ok }), calls };
}

// What `git ls-remote --tags --refs` really prints: one "<sha>\trefs/tags/<name>"
// per line. Built from the tag list so a test never hand-spells the format twice.
function lsRemoteOutput(tags) {
  return tags.map((t, i) => `${String(i).repeat(40)}\trefs/tags/${t}`).join("\n") + "\n";
}

// ═══════════════════════════════════════════════════════════════════════════
// engine-update-check — what is upstream, answered BEFORE the consent prompt
// (F3). Read-only and fail-soft: every layer degrades into the one below it,
// and an answer we cannot get says so instead of rendering as a reassuring
// blank ("no update available" and "I could not find out" are opposites).
// ═══════════════════════════════════════════════════════════════════════════

test("releasesAhead — the releases strictly newer than the installed one, oldest first", () => {
  assert.deepEqual(
    releasesAhead({ installed: "v4.5.0", tags: ["v4.7.0", "v4.4.0", "v4.6.0", "v4.5.0"] }),
    ["v4.6.0", "v4.7.0"],
  );
});

test("releasesAhead — nothing newer, no tags, or a brain pinned to a branch → an empty list", () => {
  // Three ways to be handed nothing to install. NONE of them may be read as "up to
  // date" by the caller: a branch pin is an UNKNOWN distance, and that is decided in
  // `checkUpstream`, not here.
  assert.deepEqual(releasesAhead({ installed: "v4.7.0", tags: ["v4.6.0", "v4.7.0"] }), []);
  assert.deepEqual(releasesAhead({ installed: "v4.7.0", tags: [] }), []);
  assert.deepEqual(releasesAhead({ installed: "main", tags: ["v4.8.0"] }), []);
  assert.deepEqual(releasesAhead({ installed: null, tags: ["v4.8.0"] }), []);
  assert.deepEqual(releasesAhead({ installed: "v4.7.0", tags: undefined }), []);
});

test("releasesAhead — a pre-release upstream is not something to install", () => {
  // Same rule as `pickLatestSemverTag`: there is no release channel, only stable
  // tags advance a brain. Counting one would announce a release nobody can get.
  assert.deepEqual(
    releasesAhead({ installed: "v4.7.0", tags: ["v4.8.0-rc.1", "v4.8.0", "junk"] }),
    ["v4.8.0"],
  );
});

test("checkUpstream — an update exists: it names the target and every release in the jump", async () => {
  const { git, calls } = fakeGit({ out: lsRemoteOutput(["v4.5.0", "v4.6.0", "v4.7.0"]) });

  const report = await checkUpstream({
    repo: "https://example.test/kenjaku.git",
    installedRef: "v4.5.0",
    git,
  });

  assert.deepEqual(report, {
    state: "available",
    installed: "v4.5.0",
    target: "v4.7.0",
    ahead: 2,
    releases: [
      { version: "v4.6.0", title: null, whatYouGet: null },
      { version: "v4.7.0", title: null, whatYouGet: null },
    ],
    reason: null,
  });
  assert.deepEqual(
    calls,
    [["ls-remote", "--tags", "--refs", "https://example.test/kenjaku.git"]],
    "one read-only round-trip, and it is the one update-engine already makes",
  );
});

test("checkUpstream — nothing newer upstream: 'up to date' is SAID, not implied by a blank", async () => {
  const { git } = fakeGit({ out: lsRemoteOutput(["v4.6.0", "v4.7.0"]) });

  const report = await checkUpstream({
    repo: "https://example.test/kenjaku.git",
    installedRef: "v4.7.0",
    git,
  });

  assert.deepEqual(report, {
    state: "up-to-date",
    installed: "v4.7.0",
    target: "v4.7.0",
    ahead: 0,
    releases: [],
    reason: null,
  });
});

test("checkUpstream — the four ways of NOT knowing each say which one it is", async () => {
  const noRepo = await checkUpstream({ repo: null, installedRef: "v4.7.0", git: fakeGit().git });
  assert.deepEqual(noRepo, {
    state: "unknown",
    installed: "v4.7.0",
    target: null,
    ahead: null,
    releases: [],
    reason: "this brain records no source to check — engine-manifest.json has no source.repo",
  });

  const silent = await checkUpstream({
    repo: "https://example.test/kenjaku.git",
    installedRef: "v4.7.0",
    git: fakeGit({ ok: false, out: "fatal: could not read from remote" }).git,
  });
  assert.equal(silent.state, "unknown");
  assert.equal(silent.target, null);
  assert.equal(silent.ahead, null);
  assert.equal(
    silent.reason,
    "the source did not answer — no network, or the address moved (engine-manifest.json → source.repo)",
  );

  const noReleases = await checkUpstream({
    repo: "https://example.test/kenjaku.git",
    installedRef: "v4.7.0",
    git: fakeGit({ out: lsRemoteOutput(["nightly"]) }).git,
  });
  assert.equal(noReleases.state, "unknown");
  assert.equal(noReleases.target, null);
  assert.equal(noReleases.reason, "the source answered, but publishes no release tag to compare against");

  // A brain pinned to a branch: the target IS known, the DISTANCE is not — so it is
  // reported, and the state stays "unknown" rather than borrowing "up to date".
  const branchPinned = await checkUpstream({
    repo: "https://example.test/kenjaku.git",
    installedRef: "main",
    git: fakeGit({ out: lsRemoteOutput(["v4.6.0", "v4.7.0"]) }).git,
  });
  assert.deepEqual(branchPinned, {
    state: "unknown",
    installed: "main",
    target: "v4.7.0",
    ahead: null,
    releases: [],
    reason: 'this brain is pinned to "main", not to a release, so how far behind it runs cannot be counted',
  });
});
