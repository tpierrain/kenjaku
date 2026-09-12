import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

import {
  DECLINE_LADDER_MS,
  OFFER_STATE_REL,
  REMIND_LATER_MS,
  afterAnswer,
  afterAsked,
  offerDue,
  readOfferState,
  updateOfferDirective,
  writeOfferState,
} from "./update-offer.mjs";
import { UPDATE_DURATION_SENTENCE } from "./update-duration.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// #100 — an available update was a LINE, and a line is something you scroll past.
// The daily probe already knows a release is waiting (upstream-cache.mjs) and the
// session start already says so once, at the top of a session that may run for
// hours. On Desktop that banner is dropped entirely (ADR 0036). So the fleet sits
// several releases behind while every machine in it knows better.
//
// This module is the memory that turns that verdict into an OFFER THAT COMES BACK:
// what was offered, what the owner answered, and when it may be raised again.
//
// Two rules shape every decision below, and both are the owner's:
//
//   • "REMIND ME LATER" IS THE FLOOR, AND IT IS THE HOOK'S OWN STAMP. The hook
//     stamps 24 h the moment it speaks, before any answer exists. So the worst
//     case — an owner who answers nothing, a recording the host refuses to run, a
//     conversation abandoned mid-question — is being asked once a day, which is
//     exactly what "remind me later" means. Nothing can produce a nag.
//   • A REFUSAL IS ABOUT A VERSION, NEVER ABOUT UPDATING. "No thanks" walks a
//     ladder (+3 days, +5 days, +3 weeks, +2 months, then silence) and a newly
//     published release resets it: someone who declined v5.3 has said nothing
//     about v5.4.
// ═══════════════════════════════════════════════════════════════════════════

const NOW = Date.parse("2026-09-12T09:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const iso = (ms) => new Date(ms).toISOString();

const AVAILABLE = {
  state: "available",
  installed: "v5.2.0",
  target: "v5.3.0",
  ahead: 1,
  releases: [{ version: "v5.3.0", title: "v5.3.0 — The One Where It Says Which Universe", whatYouGet: "- it names the sphere it answered from" }],
};

// ── Which verdicts may be offered at all ───────────────────────────────────

test("offerDue — nothing is offered when nobody has looked yet", () => {
  assert.equal(offerDue({ verdict: null, state: null, now: NOW }), false);
});

test("offerDue — 'I could not find out' is never rendered as an offer", () => {
  const unknown = { state: "unknown", installed: "v5.2.0", target: null, ahead: null, reason: "the source did not answer" };
  assert.equal(offerDue({ verdict: unknown, state: null, now: NOW }), false);
});

test("offerDue — a brain that is current is told nothing", () => {
  const current = { state: "up-to-date", installed: "v5.3.0", target: "v5.3.0", ahead: 0 };
  assert.equal(offerDue({ verdict: current, state: null, now: NOW }), false);
});

test("offerDue — 'available' without a version names nothing, so it offers nothing", () => {
  assert.equal(offerDue({ verdict: { ...AVAILABLE, target: null }, state: null, now: NOW }), false);
});

test("offerDue — an update is waiting and was never raised → offer it", () => {
  assert.equal(offerDue({ verdict: AVAILABLE, state: null, now: NOW }), true);
});

// ── When it may come back ──────────────────────────────────────────────────

test("offerDue — already raised today: silence until the rung falls due", () => {
  const state = { version: "v5.3.0", declines: 0, nextAskAt: iso(NOW + DAY) };
  assert.equal(offerDue({ verdict: AVAILABLE, state, now: NOW }), false);
  assert.equal(offerDue({ verdict: AVAILABLE, state, now: NOW + DAY - 1 }), false);
});

test("offerDue — exactly at the rung it is due, and it stays due afterwards", () => {
  const state = { version: "v5.3.0", declines: 0, nextAskAt: iso(NOW + DAY) };
  assert.equal(offerDue({ verdict: AVAILABLE, state, now: NOW + DAY }), true);
  assert.equal(offerDue({ verdict: AVAILABLE, state, now: NOW + 10 * DAY }), true);
});

test("offerDue — a NEWER release resets everything a refusal bought", () => {
  const silenced = { version: "v5.3.0", declines: 4, nextAskAt: null, silenced: true };
  const next = { ...AVAILABLE, target: "v5.4.0", releases: [{ version: "v5.4.0", title: null, whatYouGet: null }] };
  assert.equal(offerDue({ verdict: next, state: silenced, now: NOW }), true);

  // …and so does a rung that has not fallen due yet: the refusal was about v5.3.0.
  const waiting = { version: "v5.3.0", declines: 1, nextAskAt: iso(NOW + 3 * DAY) };
  assert.equal(offerDue({ verdict: next, state: waiting, now: NOW }), true);
});

test("offerDue — silence for THIS version is honoured, however long it has been", () => {
  const silenced = { version: "v5.3.0", declines: 4, nextAskAt: null, silenced: true };
  assert.equal(offerDue({ verdict: AVAILABLE, state: silenced, now: NOW + 400 * DAY }), false);
});

test("offerDue — a half-written record reads as 'nothing asked yet', never as a lockout", () => {
  // Same fail-soft discipline as upstream-cache.mjs: the damaged case must cost at
  // most one extra question, and may never be the reason an owner is never asked.
  for (const broken of [{ version: "v5.3.0" }, { version: "v5.3.0", nextAskAt: "tomorrow-ish" }, { version: "v5.3.0", nextAskAt: "" }]) {
    assert.equal(offerDue({ verdict: AVAILABLE, state: broken, now: NOW }), true, JSON.stringify(broken));
  }
});

// ── The stamp the hook writes the moment it speaks ─────────────────────────

test("afterAsked — asking stamps tomorrow, which IS 'remind me later'", () => {
  assert.deepEqual(afterAsked({ state: null, version: "v5.3.0", now: NOW }), {
    version: "v5.3.0",
    declines: 0,
    nextAskAt: iso(NOW + REMIND_LATER_MS),
    silenced: false,
  });
  assert.equal(REMIND_LATER_MS, DAY);
});

test("afterAsked — the ladder already walked for THIS version survives being asked again", () => {
  const state = { version: "v5.3.0", declines: 2, nextAskAt: iso(NOW - 1), silenced: false };
  assert.equal(afterAsked({ state, version: "v5.3.0", now: NOW }).declines, 2);
});

test("afterAsked — a different version starts its own ladder at zero", () => {
  const state = { version: "v5.3.0", declines: 3, nextAskAt: null, silenced: true };
  assert.deepEqual(afterAsked({ state, version: "v5.4.0", now: NOW }), {
    version: "v5.4.0",
    declines: 0,
    nextAskAt: iso(NOW + REMIND_LATER_MS),
    silenced: false,
  });
});

// ── What each answer buys ──────────────────────────────────────────────────

test("afterAnswer — 'no thanks' walks the ladder the owner specified, rung by rung", () => {
  assert.deepEqual(DECLINE_LADDER_MS, [3 * DAY, 5 * DAY, 21 * DAY, 60 * DAY]);

  let state = null;
  const due = [];
  for (let round = 0; round < DECLINE_LADDER_MS.length; round++) {
    state = afterAnswer({ state, version: "v5.3.0", answer: "no-thanks", now: NOW });
    due.push(state.nextAskAt);
  }
  assert.deepEqual(
    due,
    DECLINE_LADDER_MS.map((wait) => iso(NOW + wait)),
  );
  assert.equal(state.declines, 4);
  assert.equal(state.silenced, false);
});

test("afterAnswer — past the last rung, that version is never raised again", () => {
  let state = { version: "v5.3.0", declines: 4, nextAskAt: iso(NOW + 60 * DAY), silenced: false };
  state = afterAnswer({ state, version: "v5.3.0", answer: "no-thanks", now: NOW });
  assert.deepEqual(state, { version: "v5.3.0", declines: 5, nextAskAt: null, silenced: true });
});

test("afterAnswer — 'remind me later' is 24 h, and it repeats indefinitely", () => {
  let state = { version: "v5.3.0", declines: 0, nextAskAt: iso(NOW - 1), silenced: false };
  for (let round = 1; round <= 5; round++) {
    state = afterAnswer({ state, version: "v5.3.0", answer: "later", now: NOW + round * DAY });
    assert.deepEqual(state, {
      version: "v5.3.0",
      declines: 0,
      nextAskAt: iso(NOW + round * DAY + DAY),
      silenced: false,
    });
  }
});

test("afterAnswer — saying yes also buys a day, so a running update is not re-offered mid-way", () => {
  const state = afterAnswer({ state: null, version: "v5.3.0", answer: "install", now: NOW });
  assert.deepEqual(state, { version: "v5.3.0", declines: 0, nextAskAt: iso(NOW + DAY), silenced: false });
});

test("afterAnswer — an answer nobody defined is treated as the floor, never as silence", () => {
  const state = afterAnswer({ state: null, version: "v5.3.0", answer: "mmmh", now: NOW });
  assert.deepEqual(state, { version: "v5.3.0", declines: 0, nextAskAt: iso(NOW + DAY), silenced: false });
});

test("afterAnswer — declining a NEW version starts that version's own ladder", () => {
  const state = { version: "v5.3.0", declines: 3, nextAskAt: iso(NOW + 21 * DAY), silenced: false };
  const next = afterAnswer({ state, version: "v5.4.0", answer: "no-thanks", now: NOW });
  assert.deepEqual(next, { version: "v5.4.0", declines: 1, nextAskAt: iso(NOW + 3 * DAY), silenced: false });
});

// ── The words ──────────────────────────────────────────────────────────────

test("updateOfferDirective — nothing due adds not one character to the prompt", () => {
  const state = { version: "v5.3.0", declines: 0, nextAskAt: iso(NOW + DAY), silenced: false };
  assert.equal(updateOfferDirective({ verdict: AVAILABLE, state, now: NOW }), null);
  assert.equal(updateOfferDirective({ verdict: { state: "up-to-date" }, state: null, now: NOW }), null);
});

test("updateOfferDirective — it names the version, quotes the release's own words, and offers three answers", () => {
  const directive = updateOfferDirective({ verdict: AVAILABLE, state: null, now: NOW });
  assert.match(directive, /v5\.3\.0/);
  assert.ok(directive.includes("- it names the sphere it answered from"), directive);
  assert.match(directive, /AskUserQuestion/);
  assert.match(directive, /Install now/);
  assert.match(directive, /Remind me later/);
  assert.match(directive, /No thanks/);
  // The fallback where no such control exists — same rule as #98.
  assert.match(directive, /prose/i);
});

test("updateOfferDirective — the cost of saying yes is stated, from the one module that owns it", () => {
  const directive = updateOfferDirective({ verdict: AVAILABLE, state: null, now: NOW });
  assert.ok(directive.includes(UPDATE_DURATION_SENTENCE), directive);
});

test("updateOfferDirective — it says how the two refusals are recorded, or nothing would remember them", () => {
  const directive = updateOfferDirective({ verdict: AVAILABLE, state: null, now: NOW });
  assert.match(directive, /node scripts\/update-offer-answer\.mjs no-thanks/);
  assert.match(directive, /node scripts\/update-offer-answer\.mjs later/);
});

test("updateOfferDirective — it speaks to Claude, in the owner's language, and never alarms", () => {
  const directive = updateOfferDirective({ verdict: AVAILABLE, state: null, now: NOW });
  assert.match(directive, /in their own language/);
  // §11's tone: nothing that reads as a warning about a brain that is working fine.
  assert.doesNotMatch(directive, /urgent|immediately|at once|must update|⚠️|🛑/i);
});

test("updateOfferDirective — several releases behind: the count is said, not hidden", () => {
  const behind = { ...AVAILABLE, ahead: 3, installed: "v5.0.0" };
  const directive = updateOfferDirective({ verdict: behind, state: null, now: NOW });
  assert.match(directive, /3 releases/);
});

test("updateOfferDirective — a release whose notes could not be read is still offered, with nothing invented", () => {
  const bare = { ...AVAILABLE, releases: [{ version: "v5.3.0", title: null, whatYouGet: null }] };
  const directive = updateOfferDirective({ verdict: bare, state: null, now: NOW });
  assert.match(directive, /v5\.3\.0/);
  assert.match(directive, /update-engine --check/);
  assert.doesNotMatch(directive, /what you get:\s*\n?\s*$/i);
});

test("updateOfferDirective — long release notes are CUT, never summarised, and say where the rest is", () => {
  const long = {
    ...AVAILABLE,
    releases: [
      {
        version: "v5.3.0",
        title: null,
        // A real `What you get` is a page, not a label: v5.1.3's ran to eight bullets.
        whatYouGet: Array.from({ length: 40 }, (_, i) => `- line ${i}: one more thing this release brings you`).join("\n"),
      },
    ],
  };
  const directive = updateOfferDirective({ verdict: long, state: null, now: NOW });
  assert.ok(directive.length <= 1400, `directive was ${directive.length} characters`);
  assert.ok(directive.includes("- line 0"), "the quote starts at the release's first line");
  assert.ok(!directive.includes("- line 39"), "and it does not carry all forty");
  assert.match(directive, /update-engine --check/);
});

// ── Where the answer is kept ───────────────────────────────────────────────

test("the record sits under .cache/, which every brain gitignores", () => {
  // One laptop's "no thanks" is not the other's. Written anywhere else in the
  // brain it would be auto-committed and pulled by the other machine, which would
  // then honour a refusal it was never given.
  assert.deepEqual(OFFER_STATE_REL.split(sep), [".cache", "engine-update-offer.json"]);
});

test("readOfferState — absent, empty or damaged all read as 'nothing asked yet'", () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-offer-read-"));
  assert.equal(readOfferState({ brainDir }), null, "absent");

  mkdirSync(join(brainDir, ".cache"));
  for (const bytes of ["", "{", '{"version":']) {
    writeFileSync(join(brainDir, OFFER_STATE_REL), bytes);
    assert.equal(readOfferState({ brainDir }), null, JSON.stringify(bytes));
  }
});

test("readOfferState / writeOfferState — what was written is what comes back", () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-offer-write-"));
  const state = afterAnswer({ state: null, version: "v5.3.0", answer: "no-thanks", now: NOW });

  assert.equal(existsSync(join(brainDir, ".cache")), false, "the folder does not exist yet");
  writeOfferState({ brainDir, state });

  assert.deepEqual(readOfferState({ brainDir }), state);
  assert.ok(readFileSync(join(brainDir, OFFER_STATE_REL), "utf8").endsWith("\n"));
});

test("writeOfferState — the second answer overwrites the first, it does not throw", () => {
  // This runs every time an owner answers, for years, on a folder that exists
  // after the first time. A non-idempotent mkdir would freeze the ladder at rung
  // one — and silently, because the caller treats a failed write as the floor.
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-offer-twice-"));
  writeOfferState({ brainDir, state: afterAnswer({ state: null, version: "v5.3.0", answer: "no-thanks", now: NOW }) });
  const second = afterAnswer({ state: readOfferState({ brainDir }), version: "v5.3.0", answer: "no-thanks", now: NOW });
  writeOfferState({ brainDir, state: second });

  assert.deepEqual(readOfferState({ brainDir }), second);
  assert.equal(second.declines, 2);
});
