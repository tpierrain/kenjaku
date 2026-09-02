// ─────────────────────────────────────────────────────────────────────────────
// remote-sync.test.mjs — one tick of the live sync between machines (plan #84,
// step 2). The fake git is keyed on the WHOLE command and every case pins the
// exact call sequence (CONVENTIONS §5ter): a tick that fetches when it should
// have stayed silent, or rebases a dirty tree, is a defect these tests must see.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_INTERVAL_MS, TRACE_IGNORE_COMMENT, TRACE_REL, mergeTrace, runTick, upstreamParts } from "./remote-sync.mjs";

const NOW = new Date("2026-09-08T09:00:00.000Z");

// Unknown commands THROW: a tick that runs something this script did not expect is
// exactly what the sequence assertions exist to catch, and a silent {ok:false} would
// let it pass as "the network was down".
function fakeGit(answers) {
  const calls = [];
  const git = (args) => {
    const key = args.join(" ");
    calls.push(key);
    if (!(key in answers)) throw new Error(`unscripted git call: ${key}`);
    const a = answers[key];
    return typeof a === "string" ? { out: a, ok: true } : a;
  };
  return { git, calls };
}

const IN_PROGRESS_PROBES = {
  "rev-parse -q --verify MERGE_HEAD": { out: "", ok: false },
  "rev-parse -q --verify REBASE_HEAD": { out: "", ok: false },
  "rev-parse -q --verify CHERRY_PICK_HEAD": { out: "", ok: false },
};

// A healthy brain, one commit behind its remote.
function behindAnswers(overrides = {}) {
  return {
    remote: "origin\n",
    "rev-parse --abbrev-ref --symbolic-full-name @{u}": "origin/main\n",
    "status --porcelain": "",
    ...IN_PROGRESS_PROBES,
    "rev-parse @{u}": "aaaa111\n",
    "ls-remote --heads origin main": "bbbb222\trefs/heads/main\n",
    "fetch origin": "",
    "rebase @{u}": "Successfully rebased and updated refs/heads/main.\n",
    "diff --name-only ORIG_HEAD HEAD": "vault/daily/2026-09-08.md\nvault/people/notaire.md\n",
    "log --format=%an ORIG_HEAD..@{u}": "Claire\nClaire\n",
    "config --get user.name": "Paul\n",
    ...overrides,
  };
}

function harness(answers, extra = {}) {
  const { git, calls } = fakeGit(answers);
  const writes = [];
  const pushes = [];
  const notices = [];
  const gate = { acquired: 0, released: 0, acquire: () => (gate.acquired++, true), release: () => gate.released++ };
  const deps = {
    git,
    gate,
    indexLockPresent: () => false,
    readTrace: () => null,
    writeTrace: (t) => writes.push(t),
    checkNote: () => ({ ok: true }),
    push: () => pushes.push("push"),
    notify: (n) => notices.push(n),
    now: () => NOW,
    ...extra,
  };
  return { deps, calls, writes, pushes, notices, gate };
}

test("constants: the trace lives at the brain root (POC 0.1: only root files fire a watcher), interval 90 s", () => {
  assert.equal(TRACE_REL, "remote-arrivals.json");
  assert.equal(DEFAULT_INTERVAL_MS, 90_000);
});

test("upstreamParts splits 'origin/main' into the remote and the branch, and refuses anything else", () => {
  assert.deepEqual(upstreamParts("origin/main\n"), { remote: "origin", branch: "main" });
  assert.deepEqual(upstreamParts("origin/feature/x"), { remote: "origin", branch: "feature/x" });
  assert.equal(upstreamParts("main"), null);
  assert.equal(upstreamParts(""), null);
  assert.equal(upstreamParts("/main"), null, "a slash in front names no remote");
  assert.equal(upstreamParts("origin/"), null, "…and a slash at the end names no branch");
  assert.equal(upstreamParts(undefined), null, "git answered nothing at all");
});

test("the ignore line is pinned to its exact words: the migration writes it, and a rewording would orphan it", () => {
  assert.equal(
    TRACE_IGNORE_COMMENT,
    "# What the live sync between machines just pulled in, kept for the next message to announce" +
      " (this machine's own business — never commit it).",
  );
});

test("no remote → nothing at all: no network, no lock, no trace", () => {
  const h = harness({ remote: "" });
  assert.equal(runTick(h.deps), "no-remote");
  assert.deepEqual(h.calls, ["remote"]);
  assert.equal(h.gate.acquired, 0);
  assert.deepEqual(h.writes, []);
});

test("a remote but no upstream branch → nothing", () => {
  const h = harness({ remote: "origin\n", "rev-parse --abbrev-ref --symbolic-full-name @{u}": { out: "", ok: false } });
  assert.equal(runTick(h.deps), "no-upstream");
  assert.deepEqual(h.calls, ["remote", "rev-parse --abbrev-ref --symbolic-full-name @{u}"]);
});

test("a dirty tree is DEFERRED: the persistence path commits first, the tick never commits a half-written note", () => {
  const h = harness(behindAnswers({ "status --porcelain": " M vault/daily/2026-09-08.md\n" }));
  assert.equal(runTick(h.deps), "deferred-dirty");
  assert.deepEqual(h.calls, ["remote", "rev-parse --abbrev-ref --symbolic-full-name @{u}", "status --porcelain"]);
  assert.equal(h.gate.acquired, 0, "no lock taken for a deferral");
});

test("an unmerged tree (a guided merge in progress) → deferred, hands off", () => {
  const h = harness(behindAnswers({ "status --porcelain": "UU vault/daily/2026-09-08.md\n" }));
  assert.equal(runTick(h.deps), "deferred-in-progress");
  assert.deepEqual(h.calls, ["remote", "rev-parse --abbrev-ref --symbolic-full-name @{u}", "status --porcelain"]);
});

test("a paused rebase with everything staged reads clean, so REBASE_HEAD is probed too → deferred", () => {
  const h = harness(behindAnswers({ "rev-parse -q --verify REBASE_HEAD": "deadbeef\n" }));
  assert.equal(runTick(h.deps), "deferred-in-progress");
  assert.deepEqual(h.calls, [
    "remote",
    "rev-parse --abbrev-ref --symbolic-full-name @{u}",
    "status --porcelain",
    "rev-parse -q --verify MERGE_HEAD",
    "rev-parse -q --verify REBASE_HEAD",
  ]);
});

test("git is busy (.git/index.lock present) → deferred, no lock, no network", () => {
  const h = harness(behindAnswers(), { indexLockPresent: () => true });
  assert.equal(runTick(h.deps), "deferred-index-lock");
  assert.equal(h.calls.at(-1), "rev-parse -q --verify CHERRY_PICK_HEAD");
  assert.equal(h.gate.acquired, 0);
});

test("another window ticked a moment ago (gate refused) → yield silently, before any network call", () => {
  const h = harness(behindAnswers(), { gate: { acquire: () => false, release: () => assert.fail("nothing to release") } });
  assert.equal(runTick(h.deps), "gated");
  assert.ok(!h.calls.some((c) => c.startsWith("ls-remote")), "the probe must not run");
});

test("probe equal to the known upstream → up to date: SILENCE, no fetch, no trace, no push, lock released", () => {
  const h = harness(behindAnswers({ "ls-remote --heads origin main": "aaaa111\trefs/heads/main\n" }));
  assert.equal(runTick(h.deps), "up-to-date");
  assert.deepEqual(h.calls.slice(-2), ["rev-parse @{u}", "ls-remote --heads origin main"]);
  assert.deepEqual(h.writes, [], "a 'nothing new' must never write a trace (alarm fatigue)");
  assert.deepEqual(h.pushes, []);
  assert.equal(h.gate.released, 1);
});

test("the probe fails (offline) → silence, lock released, next tick will retry", () => {
  const h = harness(behindAnswers({ "ls-remote --heads origin main": { out: "fatal: Could not read from remote repository.\n", ok: false } }));
  assert.equal(runTick(h.deps), "probe-failed");
  assert.ok(!h.calls.includes("fetch origin"));
  assert.deepEqual(h.writes, []);
  assert.equal(h.gate.released, 1);
});

test("behind → fetch, rebase, trace of what arrived (files + authors), push, banner for another author's notes", () => {
  const h = harness(behindAnswers());
  assert.equal(runTick(h.deps), "arrived");
  assert.deepEqual(h.calls, [
    "remote",
    "rev-parse --abbrev-ref --symbolic-full-name @{u}",
    "status --porcelain",
    "rev-parse -q --verify MERGE_HEAD",
    "rev-parse -q --verify REBASE_HEAD",
    "rev-parse -q --verify CHERRY_PICK_HEAD",
    "rev-parse @{u}",
    "ls-remote --heads origin main",
    "fetch origin",
    "rebase @{u}",
    "diff --name-only ORIG_HEAD HEAD",
    "log --format=%an ORIG_HEAD..@{u}",
    "config --get user.name",
  ]);
  assert.deepEqual(h.writes, [
    {
      arrivedAt: NOW.toISOString(),
      files: ["vault/daily/2026-09-08.md", "vault/people/notaire.md"],
      authors: ["Claire"],
      blocked: null,
      announcedAt: null,
    },
  ]);
  assert.deepEqual(h.pushes, ["push"], "the other side receives at its next tick only if we push");
  assert.deepEqual(h.notices, [{ files: ["vault/daily/2026-09-08.md", "vault/people/notaire.md"], authors: ["Claire"] }]);
  assert.equal(h.gate.released, 1);
});

// The rebase REPLAYS my unpushed commits, so they land in `ORIG_HEAD..HEAD` with brand-new
// SHAs and would be announced as things that "arrived" — from myself, to myself. What
// arrived is what the OTHER side pushed, and that range is `ORIG_HEAD..@{u}`: the upstream
// ref does not move during a rebase, so it names the incoming commits and nothing else.
// Found while driving the entry point on a real repo (step 2.4): the local author showed up
// in the trace of a union merge.
test("my own unpushed commits, replayed by the rebase, are NOT arrivals: only the other side's authors", () => {
  const h = harness(
    behindAnswers({
      "log --format=%an ORIG_HEAD..HEAD": "Paul\nClaire\n",
      "log --format=%an ORIG_HEAD..@{u}": "Claire\n",
    }),
  );
  assert.equal(runTick(h.deps), "arrived");
  assert.deepEqual(h.writes[0].authors, ["Claire"], "the local author is not an arrival");
  assert.deepEqual(h.notices, [{ files: ["vault/daily/2026-09-08.md", "vault/people/notaire.md"], authors: ["Claire"] }]);
});

test("notes from MYSELF (my other machine) arrive silently: trace and push, but no banner", () => {
  const h = harness(behindAnswers({ "log --format=%an ORIG_HEAD..@{u}": "Paul\n" }));
  assert.equal(runTick(h.deps), "arrived");
  assert.deepEqual(h.notices, []);
  assert.equal(h.writes[0].authors[0], "Paul");
});

test("a merged note whose header no longer parses → the rebase is undone (reset to ORIG_HEAD), blocked trace, no push", () => {
  const h = harness(
    behindAnswers({ "reset --hard ORIG_HEAD": "" }),
    { checkNote: (rel) => (rel === "vault/daily/2026-09-08.md" ? { ok: false, reason: "damaged front-matter key \"updated\"" } : { ok: true }) },
  );
  assert.equal(runTick(h.deps), "blocked");
  assert.equal(h.calls.at(-1), "reset --hard ORIG_HEAD");
  assert.ok(!h.calls.includes("config --get user.name"), "no banner path for a blocked tick");
  assert.deepEqual(h.writes, [
    {
      arrivedAt: null,
      files: [],
      authors: [],
      blocked: { files: ["vault/daily/2026-09-08.md"], reason: "damaged front-matter key \"updated\"" },
      announcedAt: null,
    },
  ]);
  assert.deepEqual(h.pushes, []);
  assert.deepEqual(h.notices, []);
  assert.equal(h.gate.released, 1);
});

test("the header check only looks at vault notes among the arrivals, never at engine files", () => {
  const looked = [];
  const h = harness(
    behindAnswers({ "diff --name-only ORIG_HEAD HEAD": "scripts/lib/x.mjs\nvault/topics/lease.md\nREADME.md\n" }),
    { checkNote: (rel) => (looked.push(rel), { ok: true }) },
  );
  runTick(h.deps);
  assert.deepEqual(looked, ["vault/topics/lease.md"]);
});

test("a real conflict (outside the union rule) → abort, the conflicting files named, tree left intact", () => {
  const h = harness(
    behindAnswers({
      "rebase @{u}": { out: "CONFLICT (content): Merge conflict in CLAUDE.md\n", ok: false },
      "diff --name-only --diff-filter=U": "CLAUDE.md\n",
      "rebase --abort": "",
    }),
  );
  assert.equal(runTick(h.deps), "blocked");
  assert.deepEqual(h.calls.slice(-3), ["rebase @{u}", "diff --name-only --diff-filter=U", "rebase --abort"]);
  assert.deepEqual(
    h.writes,
    [{ arrivedAt: null, files: [], authors: [], blocked: { files: ["CLAUDE.md"], reason: "conflict" }, announcedAt: null }],
    "a conflict brings NOTHING in: an arrival recorded here would be announced as landed when it was undone",
  );
  assert.deepEqual(h.pushes, []);
  assert.equal(h.gate.released, 1);
});

// ── What git actually hands back, as opposed to what one would like it to ────

test("a brain with no remote answers a blank line, not an empty string", () => {
  const h = harness({ remote: "\n" });
  assert.equal(runTick(h.deps), "no-remote");
  assert.deepEqual(h.calls, ["remote"], "and it stops right there: no upstream probe, no lock, no network");
});

// The branch exists locally but was never pushed: `ls-remote` finds nothing and says so
// with silence. Reading that as "a sha that differs from mine" would fetch and rebase
// onto a branch that is not there.
test("a probe that comes back empty is up to date, not an arrival", () => {
  const h = harness(behindAnswers({ "ls-remote --heads origin main": "" }));
  assert.equal(runTick(h.deps), "up-to-date");
  assert.ok(!h.calls.includes("fetch origin"));
  assert.deepEqual(h.writes, []);
});

test("a probe padded with whitespace still yields the sha", () => {
  const h = harness(behindAnswers({ "ls-remote --heads origin main": "\n  bbbb222\trefs/heads/main  \n" }));
  assert.equal(runTick(h.deps), "arrived");
});

// Wherever core.autocrlf is on — which is the default on Windows — every line git prints
// ends `\r\n`. Split on `\n` alone and each path keeps a trailing `\r`, so it matches no
// note on disk: the header check looks at nothing and the announcement names ghosts.
test("paths arrive without the carriage return Windows puts on them", () => {
  const looked = [];
  const h = harness(
    behindAnswers({
      "diff --name-only ORIG_HEAD HEAD": "vault/daily/2026-09-08.md\r\nvault/people/notaire.md\r\n",
      "log --format=%an ORIG_HEAD..@{u}": "Claire\r\n",
    }),
    { checkNote: (rel) => (looked.push(rel), { ok: true }) },
  );

  assert.equal(runTick(h.deps), "arrived");
  assert.deepEqual(looked, ["vault/daily/2026-09-08.md", "vault/people/notaire.md"]);
  assert.deepEqual(h.writes[0].files, ["vault/daily/2026-09-08.md", "vault/people/notaire.md"]);
  assert.deepEqual(h.writes[0].authors, ["Claire"]);
});

// A vault holds more than Markdown: an image pasted into a note, a PDF dropped beside it.
// The header check parses front-matter, and handing it a PNG would report every attachment
// as a damaged note — which undoes a pull that was perfectly fine.
test("an attachment under vault/ is not put through the header check", () => {
  const looked = [];
  const h = harness(
    behindAnswers({ "diff --name-only ORIG_HEAD HEAD": "vault/attachments/photo.png\nvault/topics/lease.md\n" }),
    { checkNote: (rel) => (looked.push(rel), { ok: true }) },
  );

  assert.equal(runTick(h.deps), "arrived");
  assert.deepEqual(looked, ["vault/topics/lease.md"]);
});

// A rebase can bring back a stretch containing BOTH my own commits from the other machine
// and someone else's. One name that is not mine is reason enough to raise the banner.
test("a pull carrying my commits AND someone else's still raises the banner", () => {
  const h = harness(behindAnswers({ "log --format=%an ORIG_HEAD..@{u}": "Paul\nClaire\n" }));

  assert.equal(runTick(h.deps), "arrived");
  assert.deepEqual(h.notices, [
    { files: ["vault/daily/2026-09-08.md", "vault/people/notaire.md"], authors: ["Paul", "Claire"] },
  ]);
});

test("the fetch fails after a positive probe → nothing rebased, nothing written, lock released", () => {
  const h = harness(behindAnswers({ "fetch origin": { out: "fatal: unable to access\n", ok: false } }));
  assert.equal(runTick(h.deps), "fetch-failed");
  assert.ok(!h.calls.includes("rebase @{u}"));
  assert.deepEqual(h.writes, []);
  assert.equal(h.gate.released, 1);
});

test("the lock is released even when git throws mid-tick", () => {
  const h = harness(behindAnswers({ "fetch origin": undefined }));
  h.deps.git = (args) => {
    if (args.join(" ") === "fetch origin") throw new Error("boom");
    return fakeGit(behindAnswers()).git(args);
  };
  assert.equal(runTick(h.deps), "failed");
  assert.equal(h.gate.released, 1);
});

test("mergeTrace accumulates unannounced arrivals, dedups, and a later success clears an earlier block", () => {
  const earlier = { arrivedAt: "2026-09-08T08:00:00.000Z", files: ["vault/a.md"], authors: ["Claire"], blocked: { files: ["CLAUDE.md"], reason: "conflict" }, announcedAt: null };
  const merged = mergeTrace(earlier, { arrivedAt: NOW.toISOString(), files: ["vault/a.md", "vault/b.md"], authors: ["Paul"], blocked: null });
  assert.deepEqual(merged, {
    arrivedAt: NOW.toISOString(),
    files: ["vault/a.md", "vault/b.md"],
    authors: ["Claire", "Paul"],
    blocked: null,
    announcedAt: null,
  });
});

test("mergeTrace starts afresh once the previous trace was announced", () => {
  const announced = { arrivedAt: "2026-09-08T08:00:00.000Z", files: ["vault/a.md"], authors: ["Claire"], blocked: null, announcedAt: "2026-09-08T08:05:00.000Z" };
  const merged = mergeTrace(announced, { arrivedAt: NOW.toISOString(), files: ["vault/b.md"], authors: ["Paul"], blocked: null });
  assert.deepEqual(merged.files, ["vault/b.md"]);
  assert.deepEqual(merged.authors, ["Paul"]);
  assert.equal(merged.announcedAt, null);
});

test("mergeTrace with no previous trace and a block keeps the block and nothing else", () => {
  const merged = mergeTrace(null, { arrivedAt: null, files: [], authors: [], blocked: { files: ["x"], reason: "conflict" } });
  assert.deepEqual(merged, { arrivedAt: null, files: [], authors: [], blocked: { files: ["x"], reason: "conflict" }, announcedAt: null });
});

test("a tick that arrives on top of an unannounced earlier arrival writes the accumulated trace", () => {
  const earlier = { arrivedAt: "2026-09-08T08:00:00.000Z", files: ["vault/topics/lease.md"], authors: ["Claire"], blocked: null, announcedAt: null };
  const h = harness(behindAnswers(), { readTrace: () => earlier });
  runTick(h.deps);
  assert.deepEqual(h.writes[0].files, ["vault/topics/lease.md", "vault/daily/2026-09-08.md", "vault/people/notaire.md"]);
});
