import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { OFFER_STATE_REL } from "./lib/update-offer.mjs";
import { UPSTREAM_CACHE_REL } from "./lib/upstream-cache.mjs";
import { USAGE, runUpdateOfferAnswer } from "./update-offer-answer.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, "update-offer-answer.mjs");
const NOW = Date.parse("2026-09-12T09:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════════════
// #100 — the COMMAND that remembers what the owner answered.
//
// The offer is built by a hook and asked by Claude, and neither of them can write
// the answer down: the hook has already exited when the question is asked, and a
// conversation cannot call a function — it can only run a command. This is that
// command, and it is the same shape as `adopt-engine-file.mjs` for the same
// reason.
//
// 🛑 IT IS AN IMPROVEMENT ON THE FLOOR, NEVER A LOAD-BEARING PART. The hook stamps
// "ask again tomorrow" the moment it speaks, so every way this command can fail —
// never run, refused by the host, a read-only disk — costs at most one question a
// day. That is what makes it safe for it to be a command an owner may decline to
// run.
// ═══════════════════════════════════════════════════════════════════════════

const AVAILABLE = { state: "available", installed: "v5.2.0", target: "v5.3.0", ahead: 1 };

function harness({ verdict = AVAILABLE, state = null } = {}) {
  const out = { logged: [], errored: [], written: null };
  return {
    out,
    deps: {
      brainDir: "/nowhere",
      readVerdict: () => verdict,
      readState: () => state,
      writeState: (next) => {
        out.written = next;
        return next;
      },
      now: () => NOW,
      log: (line) => out.logged.push(line),
      error: (line) => out.errored.push(line),
    },
  };
}

test("'no thanks' is recorded, and the answer says when it will come back", () => {
  const { out, deps } = harness();

  assert.equal(runUpdateOfferAnswer(["no-thanks"], deps), 0);
  assert.deepEqual(out.written, {
    version: "v5.3.0",
    declines: 1,
    nextAskAt: new Date(NOW + 3 * DAY).toISOString(),
    silenced: false,
  });
  assert.equal(out.errored.length, 0);
  assert.match(out.logged.join("\n"), /v5\.3\.0/);
});

test("'later' is the floor: a day, and the ladder is untouched", () => {
  const { out, deps } = harness({ state: { version: "v5.3.0", declines: 2, nextAskAt: null, silenced: true } });

  assert.equal(runUpdateOfferAnswer(["later"], deps), 0);
  assert.deepEqual(out.written, {
    version: "v5.3.0",
    declines: 2,
    nextAskAt: new Date(NOW + DAY).toISOString(),
    silenced: false,
  });
});

test("'install' also buys a day, so the offer does not reappear while the update runs", () => {
  const { out, deps } = harness();

  assert.equal(runUpdateOfferAnswer(["install"], deps), 0);
  assert.equal(out.written.nextAskAt, new Date(NOW + DAY).toISOString());
  assert.equal(out.written.silenced, false);
});

test("the last rung is announced as what it is: that version will not be raised again", () => {
  const { out, deps } = harness({ state: { version: "v5.3.0", declines: 4, nextAskAt: null, silenced: false } });

  assert.equal(runUpdateOfferAnswer(["no-thanks"], deps), 0);
  assert.equal(out.written.silenced, true);
  assert.match(out.logged.join("\n"), /again|more/i);
});

test("an answer nobody defined is the CALLER's mistake, and it writes nothing", () => {
  for (const argv of [[], ["yes"], ["no-thanks", "extra"]]) {
    const { out, deps } = harness();
    assert.equal(runUpdateOfferAnswer(argv, deps), 2, JSON.stringify(argv));
    assert.equal(out.written, null, "an unrecognised answer must never be guessed at");
    assert.match(out.errored.join("\n"), /update-offer-answer/);
    assert.equal(out.logged.length, 0, "a usage error belongs on stderr");
  }
});

test("nothing on offer → nothing recorded, and it is not an error", () => {
  // The owner updated on their other machine between the question and the answer,
  // or the probe has not run yet. Writing a refusal here would attach it to a
  // version nobody is being offered.
  for (const verdict of [null, { state: "up-to-date", target: "v5.3.0" }, { state: "unknown", target: null }]) {
    const { out, deps } = harness({ verdict });
    assert.equal(runUpdateOfferAnswer(["no-thanks"], deps), 0, JSON.stringify(verdict));
    assert.equal(out.written, null);
    assert.equal(out.errored.length, 0);
  }
});

test("a disk that refuses the answer says so, and says what happens instead", () => {
  const { out, deps } = harness();
  deps.writeState = () => {
    throw new Error("read-only volume");
  };

  assert.equal(runUpdateOfferAnswer(["no-thanks"], deps), 1);
  // The owner is entitled to know the refusal was not kept — and to know the cost
  // is one more question, not a broken brain.
  assert.match(out.errored.join("\n"), /tomorrow/i);
});

// 🚨 THE TEST THAT PROVES THE COMMAND IS PLUGGED IN. Everything above injects every
// dependency, so all of it would still pass if the real deps read the wrong file,
// resolved the wrong brain, or wrote nothing at all.
test("run as a real process, it records the answer in the real brain's .cache/", () => {
  const dir = mkdtempSync(join(tmpdir(), "sbg-offer-cli-"));
  cpSync(HERE, join(dir, "scripts"), { recursive: true });
  mkdirSync(join(dir, ".cache"));
  writeFileSync(
    join(dir, UPSTREAM_CACHE_REL),
    JSON.stringify({ state: "available", installed: "v5.2.0", target: "v5.3.0", ahead: 1, releases: [] }),
  );

  const run = spawnSync(process.execPath, [join(dir, "scripts", "update-offer-answer.mjs"), "no-thanks"], {
    cwd: tmpdir(), // never the brain: the command resolves it from where the SCRIPT lives
    encoding: "utf8",
  });

  assert.equal(run.status, 0, run.stderr);
  const recorded = JSON.parse(readFileSync(join(dir, OFFER_STATE_REL), "utf8"));
  assert.equal(recorded.version, "v5.3.0");
  assert.equal(recorded.declines, 1);
  assert.ok(Date.parse(recorded.nextAskAt) > Date.now(), "it is postponed, not just written");
  assert.notEqual(run.stdout.trim(), "", "the owner's brain must be able to say what it recorded");
});

test("run as a real process with no answer, it refuses and explains itself", () => {
  const run = spawnSync(process.execPath, [CLI], { encoding: "utf8" });

  assert.equal(run.status, 2);
  assert.ok(run.stderr.includes(USAGE.split("\n")[0]), run.stderr);
  assert.equal(run.stdout, "");
});

test("the brain's own allowlist lets this answer be recorded without a permission dialog", () => {
  // 🧭 Deliberate, and the only allowlist entry this release adds. Everywhere else
  // a permission prompt is healthy — it is how an owner stays in charge of their
  // own machine. Here it would land at the single worst moment: immediately after
  // someone chose "No thanks", a dialog naming a script they have never heard of,
  // to record the fact that they want to be left alone. Declining THAT dialog then
  // costs them the ladder, and the offer returns tomorrow as if they had said
  // nothing.
  //
  // The entry is as narrow as the mechanism: this one command, which writes one
  // gitignored file under .cache/ and can do nothing else.
  //
  // ⚠️ It reaches a FRESH brain at install. An existing one meets it through the
  // ordinary merge regime `.claude/settings.json` already sits in — the reconciler
  // additively merges HOOKS, never permissions — so until its owner adopts that,
  // the command still asks. Which is survivable, and by design: declining the
  // dialog costs the ladder, never the brain, because being asked already bought a
  // day (see the floor, at the top of this file).
  const template = JSON.parse(readFileSync(join(HERE, "..", ".claude", "settings.json.template"), "utf8"));

  assert.ok(
    template.permissions.allow.includes("Bash(node scripts/update-offer-answer.mjs:*)"),
    `the allowlist does not cover the answer command:\n${template.permissions.allow.join("\n")}`,
  );
});

test("the usage names all three answers and what each one costs", () => {
  // This text is the whole interface: Claude reads it when it gets the call wrong, and
  // a usage line that lists no answers sends it guessing at the very moment it already
  // guessed once.
  assert.match(USAGE, /^usage: node scripts\/update-offer-answer\.mjs later\|no-thanks\|install$/m);
  assert.match(USAGE, /^ {2}later {7}ask me again tomorrow/m);
  assert.match(USAGE, /^ {2}no-thanks {3}not this version: \+3 days, then \+5 days, \+3 weeks, \+2 months/m);
  assert.match(USAGE, /^ {2}install {5}the update is being run now/m);
});

test("the date the owner reads back is a plain day, not a machine timestamp", () => {
  // The message is read by a person, in the flow of a conversation. `2026-09-15` is a
  // date; `2026-09-15T09:00:00.000Z` is a log line, and it says the same thing worse.
  const { out, deps } = harness();

  assert.equal(runUpdateOfferAnswer(["no-thanks"], deps), 0);
  assert.deepEqual(out.logged, ["Noted. v5.3.0 will not be brought up again before 2026-09-15."]);
});

test("the LAST rung reads differently, because it means something different", () => {
  // Not a longer postponement: an end. The two sentences must not be interchangeable.
  const { out, deps } = harness({ state: { version: "v5.3.0", declines: 4, nextAskAt: null, silenced: false } });

  assert.equal(runUpdateOfferAnswer(["no-thanks"], deps), 0);
  assert.deepEqual(out.logged, ["Noted: v5.3.0 will not be brought up again."]);
});

test("nothing on offer is SAID, not passed over in silence", () => {
  // The owner just clicked an answer. A command that records nothing and says nothing
  // is indistinguishable from one that failed.
  const { out, deps } = harness({ verdict: null });

  assert.equal(runUpdateOfferAnswer(["no-thanks"], deps), 0);
  assert.deepEqual(out.logged, ["There is no update on offer right now, so there was nothing to record."]);
});

test("a disk that refuses the answer names the version and the exact consequence", () => {
  const { out, deps } = harness();
  deps.writeState = () => {
    throw new Error("read-only volume");
  };

  assert.equal(runUpdateOfferAnswer(["no-thanks"], deps), 1);
  assert.deepEqual(out.errored, [
    "I could not write your answer down, so nothing remembers it: the offer for v5.3.0 will come " +
      "back tomorrow. Your brain is fine, and the update itself was not touched.",
  ]);
});

test("run as a real process, it READS the ladder already walked instead of restarting it", () => {
  // The first process test proves the answer is written. This one proves the other
  // half of the round trip: a refusal recorded yesterday must still count today, or
  // every "no thanks" is the first one and the ladder never climbs.
  const dir = mkdtempSync(join(tmpdir(), "sbg-offer-cli-ladder-"));
  cpSync(HERE, join(dir, "scripts"), { recursive: true });
  mkdirSync(join(dir, ".cache"));
  writeFileSync(
    join(dir, UPSTREAM_CACHE_REL),
    JSON.stringify({ state: "available", installed: "v5.2.0", target: "v5.3.0", ahead: 1, releases: [] }),
  );
  writeFileSync(
    join(dir, OFFER_STATE_REL),
    JSON.stringify({ version: "v5.3.0", declines: 2, nextAskAt: null, silenced: false }),
  );

  const run = spawnSync(process.execPath, [join(dir, "scripts", "update-offer-answer.mjs"), "no-thanks"], {
    cwd: tmpdir(),
    encoding: "utf8",
  });

  assert.equal(run.status, 0, run.stderr);
  const recorded = JSON.parse(readFileSync(join(dir, OFFER_STATE_REL), "utf8"));
  assert.equal(recorded.declines, 3, "the third refusal, not the first");
  assert.ok(readFileSync(join(dir, OFFER_STATE_REL), "utf8").endsWith("\n"));
});
