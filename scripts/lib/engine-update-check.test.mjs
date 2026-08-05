import { test } from "node:test";
import assert from "node:assert/strict";

import {
  checkUpstream,
  defaultFetchReleases,
  extractWhatYouGet,
  formatUpdateCheck,
  githubReleasesApiUrl,
  releasesAhead,
} from "./engine-update-check.mjs";

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

test("githubReleasesApiUrl — the public releases endpoint, from either git remote spelling", () => {
  const expected = "https://api.github.com/repos/tpierrain/kenjaku/releases?per_page=100";
  assert.equal(githubReleasesApiUrl("git@github.com:tpierrain/kenjaku.git"), expected);
  assert.equal(githubReleasesApiUrl("https://github.com/tpierrain/kenjaku.git"), expected);
  assert.equal(githubReleasesApiUrl("https://github.com/tpierrain/kenjaku"), expected);
  assert.equal(githubReleasesApiUrl("ssh://git@github.com/tpierrain/kenjaku.git"), expected);
});

test("githubReleasesApiUrl — anything that is not GitHub has no endpoint, and says so", () => {
  // A fork on another host, a company GitLab, a plain folder: layer A still works,
  // and inventing an endpoint for them would turn a degradation into a wrong answer.
  assert.equal(githubReleasesApiUrl("https://gitlab.com/someone/kenjaku.git"), null);
  assert.equal(githubReleasesApiUrl("/Users/someone/Dev/kenjaku"), null);
  assert.equal(githubReleasesApiUrl(""), null);
  assert.equal(githubReleasesApiUrl(null), null);
});

// The real shape of a Kenjaku release note (§11): a lead, the `### What you get`
// bullets written for a non-developer, then sections nobody consents on.
const RELEASE_BODY = [
  "**Your brain stops answering as if it were up to date when it isn't.** When newer",
  "code has landed but the conversation still runs the old one, it says so.",
  "",
  "### What you get",
  "",
  "- 🛑 **It tells you when it is running yesterday's engine.**",
  "- ⏳ **\"A few notes pending\" now says what kind of pending.**",
  "",
  "### What you have to do",
  "",
  "Ask for **`/update-engine`** once, then restart your session if it says so.",
  "",
  "---",
  "",
  "### Under the hood",
  "",
  "- Both defects are the same one, on two clocks.",
].join("\n");

test("extractWhatYouGet — hands back the human prose verbatim, and stops at the next section", () => {
  assert.equal(
    extractWhatYouGet(RELEASE_BODY),
    [
      "- 🛑 **It tells you when it is running yesterday's engine.**",
      '- ⏳ **"A few notes pending" now says what kind of pending.**',
    ].join("\n"),
    "quoted, never summarised (ADR 0009) — this text was already written for humans",
  );
});

test("extractWhatYouGet — a note without that section yields null, so layer C degrades into B", () => {
  assert.equal(extractWhatYouGet("### Under the hood\n\n- a mechanism nobody consents on"), null);
  assert.equal(extractWhatYouGet("### What you get\n\n\n### What you have to do\n\nrun it"), null);
  assert.equal(extractWhatYouGet(""), null);
  assert.equal(extractWhatYouGet(null), null);
});

test("checkUpstream — each release carries its own title and its own prose, when they exist", async () => {
  const { git } = fakeGit({ out: lsRemoteOutput(["v4.5.0", "v4.6.0", "v4.7.0"]) });
  const asked = [];

  const report = await checkUpstream({
    repo: "git@github.com:tpierrain/kenjaku.git",
    installedRef: "v4.5.0",
    git,
    fetchReleases: async (url) => {
      asked.push(url);
      return [
        { tag_name: "v4.7.0", name: "v4.7.0 — The One Where It Knows", body: RELEASE_BODY },
        // v4.6.0 published a note with no `What you get` section → layer C degrades
        // into layer B for THAT release only, not for the whole answer.
        { tag_name: "v4.6.0", name: "v4.6.0 — The Vault's Identity", body: "### Under the hood\n\n- stuff" },
        { tag_name: "v4.5.0", name: "v4.5.0 — Silence Stops Passing", body: RELEASE_BODY },
      ];
    },
  });

  assert.deepEqual(asked, ["https://api.github.com/repos/tpierrain/kenjaku/releases?per_page=100"]);
  assert.deepEqual(report.releases, [
    { version: "v4.6.0", title: "v4.6.0 — The Vault's Identity", whatYouGet: null },
    {
      version: "v4.7.0",
      title: "v4.7.0 — The One Where It Knows",
      whatYouGet: [
        "- 🛑 **It tells you when it is running yesterday's engine.**",
        '- ⏳ **"A few notes pending" now says what kind of pending.**',
      ].join("\n"),
    },
  ], "the release the brain already runs is not part of the jump and is not described");
  assert.equal(report.state, "available");
  assert.equal(report.ahead, 2);
});

test("checkUpstream — no notes to be had: the versions still answer, and nothing is invented", async () => {
  const tags = lsRemoteOutput(["v4.6.0", "v4.7.0"]);

  // Three ways the prose can be out of reach: a rate limit / offline API, a release
  // the API does not carry, and a host that has no releases endpoint at all.
  const refused = await checkUpstream({
    repo: "git@github.com:tpierrain/kenjaku.git",
    installedRef: "v4.6.0",
    git: fakeGit({ out: tags }).git,
    fetchReleases: async () => null,
  });
  assert.deepEqual(refused.releases, [{ version: "v4.7.0", title: null, whatYouGet: null }]);
  assert.equal(refused.state, "available", "a missing note never downgrades a KNOWN update to unknown");

  const partial = await checkUpstream({
    repo: "git@github.com:tpierrain/kenjaku.git",
    installedRef: "v4.6.0",
    git: fakeGit({ out: tags }).git,
    fetchReleases: async () => [{ tag_name: "v3.0.0", name: "ancient", body: RELEASE_BODY }],
  });
  assert.deepEqual(partial.releases, [{ version: "v4.7.0", title: null, whatYouGet: null }]);

  let called = 0;
  const elsewhere = await checkUpstream({
    repo: "https://gitlab.com/someone/kenjaku.git",
    installedRef: "v4.6.0",
    git: fakeGit({ out: tags }).git,
    fetchReleases: async () => (called++, []),
  });
  assert.equal(called, 0, "no endpoint means no request, not a request to a guessed address");
  assert.deepEqual(elsewhere.releases, [{ version: "v4.7.0", title: null, whatYouGet: null }]);
});

test("checkUpstream — with nothing to install, the notes are never fetched", async () => {
  let called = 0;
  const report = await checkUpstream({
    repo: "git@github.com:tpierrain/kenjaku.git",
    installedRef: "v4.7.0",
    git: fakeGit({ out: lsRemoteOutput(["v4.7.0"]) }).git,
    fetchReleases: async () => (called++, []),
  });
  assert.equal(called, 0, "the steady state stays ONE cheap git call — no HTTP on a brain that is current");
  assert.equal(report.state, "up-to-date");
});

test("defaultFetchReleases — asks GitHub for public metadata only, and hands back the list", async () => {
  const seen = [];
  const releases = await defaultFetchReleases("https://api.github.com/repos/x/y/releases", {
    fetchImpl: async (url, options) => {
      seen.push({ url, options });
      return { ok: true, json: async () => [{ tag_name: "v4.7.0" }] };
    },
  });

  assert.deepEqual(releases, [{ tag_name: "v4.7.0" }]);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "https://api.github.com/repos/x/y/releases");
  assert.deepEqual(seen[0].options.headers, {
    accept: "application/vnd.github+json",
    "user-agent": "kenjaku-update-check",
  });
  assert.ok(seen[0].options.signal instanceof AbortSignal, "the call is bounded by a timeout, not open-ended");
});

test("defaultFetchReleases — every way it can fail answers null, never a throw", async () => {
  const offline = await defaultFetchReleases("https://api.github.com/x", {
    fetchImpl: async () => { throw new Error("getaddrinfo ENOTFOUND"); },
  });
  assert.equal(offline, null, "offline: the check degrades, it does not fail the update path");

  // A REFUSED answer is not an answer, even when its body happens to parse as the
  // list we wanted: a 403 body must never be read as "this repo published nothing".
  const rateLimited = await defaultFetchReleases("https://api.github.com/x", {
    fetchImpl: async () => ({ ok: false, status: 403, json: async () => [] }),
  });
  assert.equal(rateLimited, null);

  const notAList = await defaultFetchReleases("https://api.github.com/x", {
    fetchImpl: async () => ({ ok: true, json: async () => ({ message: "Not Found" }) }),
  });
  assert.equal(notAList, null, "a private or moved repo answers an object, and an object is not releases");

  const unreadable = await defaultFetchReleases("https://api.github.com/x", {
    fetchImpl: async () => ({ ok: true, json: async () => { throw new SyntaxError("Unexpected token"); } }),
  });
  assert.equal(unreadable, null);
});

test("defaultFetchReleases — a hung endpoint is abandoned, and the check moves on", async () => {
  // The endpoint answers eventually — LATE. Whoever gets there first decides: the
  // abort (→ null) or the endpoint (→ its payload). Written as a race rather than a
  // never-settling promise so a missing abort FAILS this test instead of hanging it.
  const hung = await defaultFetchReleases("https://api.github.com/x", {
    timeoutMs: 20,
    fetchImpl: (url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason));
        setTimeout(() => resolve({ ok: true, json: async () => [{ tag_name: "too-late" }] }), 300);
      }),
  });

  assert.equal(hung, null, "it gave up on its own timeout instead of waiting for the endpoint");
});

test("formatUpdateCheck — an available update leads with the target, then quotes each release", () => {
  assert.equal(
    formatUpdateCheck({
      state: "available",
      installed: "v4.5.0",
      target: "v4.7.0",
      ahead: 2,
      releases: [
        { version: "v4.6.0", title: "v4.6.0 — The Vault's Identity", whatYouGet: "- 🧭 **It reads before it writes.**" },
        { version: "v4.7.0", title: "v4.7.0 — The One Where It Knows", whatYouGet: null },
      ],
      reason: null,
    }),
    [
      "⚙️ Your brain runs v4.5.0.",
      "📦 v4.7.0 is available — 2 releases ahead.",
      "",
      "── v4.6.0 — The Vault's Identity",
      "- 🧭 **It reads before it writes.**",
      "",
      "── v4.7.0 — The One Where It Knows",
      "(this release published no summary)",
    ].join("\n"),
  );
});

test("formatUpdateCheck — one release ahead is not 'releases', and a bare version still names itself", () => {
  assert.equal(
    formatUpdateCheck({
      state: "available",
      installed: "v4.6.0",
      target: "v4.7.0",
      ahead: 1,
      releases: [{ version: "v4.7.0", title: null, whatYouGet: null }],
      reason: null,
    }),
    [
      "⚙️ Your brain runs v4.6.0.",
      "📦 v4.7.0 is available — 1 release ahead.",
      "",
      "── v4.7.0",
      "(this release published no summary)",
    ].join("\n"),
  );
});

test("formatUpdateCheck — up to date says so out loud; it is not the same answer as silence", () => {
  assert.equal(
    formatUpdateCheck({
      state: "up-to-date",
      installed: "v4.7.0",
      target: "v4.7.0",
      ahead: 0,
      releases: [],
      reason: null,
    }),
    ["⚙️ Your brain runs v4.7.0.", "✅ That is the latest release — there is nothing to install."].join("\n"),
  );
});

test("formatUpdateCheck — not knowing is stated, with which unknown it was and what it costs", () => {
  assert.equal(
    formatUpdateCheck({
      state: "unknown",
      installed: "v4.6.0",
      target: null,
      ahead: null,
      releases: [],
      reason: "the source did not answer — no network, or the address moved",
    }),
    [
      "⚙️ Your brain runs v4.6.0.",
      "❓ I could not find out what is available: the source did not answer — no network, or the address moved.",
      "   Updating is still possible, but I cannot tell you what it would install.",
    ].join("\n"),
  );
});

test("formatUpdateCheck — an unknown DISTANCE still reports the target it does know", () => {
  assert.equal(
    formatUpdateCheck({
      state: "unknown",
      installed: "main",
      target: "v4.7.0",
      ahead: null,
      releases: [],
      reason: 'this brain is pinned to "main", not to a release',
    }),
    [
      "⚙️ Your brain runs main.",
      '❓ I could not find out what is available: this brain is pinned to "main", not to a release.',
      "   The newest release upstream is v4.7.0.",
      "   Updating is still possible, but I cannot tell you what it would install.",
    ].join("\n"),
  );
});

test("formatUpdateCheck — a brain that cannot even name its own engine says that too", () => {
  assert.equal(
    formatUpdateCheck({
      state: "unknown",
      installed: null,
      target: null,
      ahead: null,
      releases: [],
      reason: "this brain records no source to check",
    }),
    [
      "⚙️ Your brain does not record which engine version it runs.",
      "❓ I could not find out what is available: this brain records no source to check.",
      "   Updating is still possible, but I cannot tell you what it would install.",
    ].join("\n"),
  );
});
