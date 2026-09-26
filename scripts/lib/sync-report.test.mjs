// Tests for sync-report.mjs — the report `/sync` relays VERBATIM (issue #131,
// plan v5.5.2 § S2).
//
// Measured on a real brain on 2026-09-25/26: machine A pushed all Friday, machine B's
// live sync pulled the 17 files at 19:06, a session announced them, and a `/sync` run
// the next morning in ANOTHER session found nothing to rebase and told the owner, in
// prose Claude composed, "your other machine pushed nothing since last time". It had
// pushed all day. Claude then wrote "jeudi" for a Friday by hand.
//
// So the report is a machine's, and the tests pin its WORDS: they are what the owner
// reads, the skill relays them unchanged, and a report asserted by fragments can be
// half-blanked with the suite still green. The fr text is a deliberate PRODUCT
// localization (the brain speaks the owner's language).
//
// Every fixture is hand-written, never produced by the code under test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatWhen, syncReport } from "./sync-report.mjs";

const PARIS = "Europe/Paris";
const ME = { name: "Thomas Pierrain", email: "thomas@home.example" };

// The trace as the live-sync tick leaves it, ALREADY ANNOUNCED by another session.
const FRIDAY_TRACE = {
  arrivedAt: "2026-09-25T17:06:29.000Z",
  files: [
    ...Array.from({ length: 16 }, (_, i) => `vault/notes/n${i}.md`),
    "vault/assets/diagram.png",
  ],
  authors: ["Thomas Pierrain"],
  blocked: null,
  announcedAt: "2026-09-26T06:13:02.000Z",
};
// Machine A commits under another email: the case the owner has.
const REMOTE_FROM_OTHER_MACHINE = { at: "2026-09-25T17:05:11.000Z", name: "Thomas Pierrain", email: "thomas@work.example" };
const NOTHING_THIS_SYNC = { committed: false, pulled: [], pushed: "ok" };

const report = (overrides = {}) =>
  syncReport({
    locale: "fr",
    timeZone: PARIS,
    trace: FRIDAY_TRACE,
    remoteHead: REMOTE_FROM_OTHER_MACHINE,
    me: ME,
    identities: [],
    thisSync: NOTHING_THIS_SYNC,
    ...overrides,
  });

// ── The dates are the machine's ──────────────────────────────────────────────

test("formatWhen: the weekday comes from the calendar, in the owner's time zone and language", () => {
  assert.equal(formatWhen("2026-09-25T17:06:29.000Z", "fr", PARIS), "vendredi 25/09 à 19h06");
  assert.equal(formatWhen("2026-09-24T08:01:00.000Z", "fr", PARIS), "jeudi 24/09 à 10h01");
  assert.equal(formatWhen("2026-09-25T17:06:29.000Z", "en", PARIS), "Friday 25 Sep at 19:06");
});

test("formatWhen: the time zone moves the day, not only the hour", () => {
  // 23:30 UTC on a Friday is already Saturday in Paris, still Friday in New York.
  assert.equal(formatWhen("2026-09-25T23:30:00.000Z", "fr", PARIS), "samedi 26/09 à 01h30");
  assert.equal(formatWhen("2026-09-25T23:30:00.000Z", "fr", "America/New_York"), "vendredi 25/09 à 19h30");
});

test("formatWhen: an unknown locale falls back to English rather than failing", () => {
  assert.equal(formatWhen("2026-09-25T17:06:29.000Z", "de", PARIS), "Friday 25 Sep at 19:06");
});

// ── The incident itself ──────────────────────────────────────────────────────

test("nothing to rebase, but the live sync already brought the work: the report says WHEN, and never 'nothing was pushed'", () => {
  assert.equal(
    report(),
    [
      "✅ Rien de nouveau depuis vendredi 25/09 à 19h06, heure à laquelle la synchro automatique a déjà rapatrié ici 17 fichiers (dont 16 notes) de ton autre machine.",
      "📤 Dernier push reçu par le dépôt distant : vendredi 25/09 à 19h05, depuis ton autre machine (thomas@work.example).",
      "Ce /sync : commit local non · push envoyé.",
    ].join("\n"),
  );
});

test("an arrival not yet announced is reported the same way: /sync does not depend on who spoke first", () => {
  assert.equal(
    report({ trace: { ...FRIDAY_TRACE, announcedAt: null } }).split("\n")[0],
    "✅ Rien de nouveau depuis vendredi 25/09 à 19h06, heure à laquelle la synchro automatique a déjà rapatrié ici 17 fichiers (dont 16 notes) de ton autre machine.",
  );
});

test("the same report in English", () => {
  assert.equal(
    report({ locale: "en" }),
    [
      "✅ Nothing new since Friday 25 Sep at 19:06, when the automatic sync had already brought 17 files (16 of them notes) here from your other machine.",
      "📤 Last push the remote received: Friday 25 Sep at 19:05, from your other machine (thomas@work.example).",
      "This /sync: local commit no · push sent.",
    ].join("\n"),
  );
});

// ── What this /sync itself brought ───────────────────────────────────────────

test("files pulled by this /sync lead, and the earlier arrival is still dated", () => {
  assert.equal(
    report({ thisSync: { committed: true, pulled: ["vault/notes/a.md", "scripts/x.mjs", "vault/notes/b.md"], pushed: "ok" } }),
    [
      "📥 Ce /sync a récupéré 3 fichiers (dont 2 notes).",
      "🕘 Arrivée précédente sur cette machine : vendredi 25/09 à 19h06, par la synchro automatique : 17 fichiers (dont 16 notes) de ton autre machine.",
      "📤 Dernier push reçu par le dépôt distant : vendredi 25/09 à 19h05, depuis ton autre machine (thomas@work.example).",
      "Ce /sync : commit local oui · push envoyé.",
    ].join("\n"),
  );
});

test("one file, one note: singular agreement", () => {
  const out = report({ thisSync: { committed: false, pulled: ["vault/notes/a.md"], pushed: "ok" }, trace: null });
  assert.equal(out.split("\n")[0], "📥 Ce /sync a récupéré 1 fichier (dont 1 note).");
});

test("pulled files with no note among them: no 'of them notes' clause", () => {
  const out = report({ thisSync: { committed: false, pulled: ["scripts/x.mjs", "rag/y.ts"], pushed: "ok" }, trace: null });
  assert.equal(out.split("\n")[0], "📥 Ce /sync a récupéré 2 fichiers.");
});

// ── No arrival on record ─────────────────────────────────────────────────────

test("no trace at all and nothing pulled: nothing new, and no invented arrival", () => {
  assert.equal(
    report({ trace: null }),
    [
      "✅ Rien de nouveau : cette machine a déjà tout ce que le dépôt distant contient.",
      "📤 Dernier push reçu par le dépôt distant : vendredi 25/09 à 19h05, depuis ton autre machine (thomas@work.example).",
      "Ce /sync : commit local non · push envoyé.",
    ].join("\n"),
  );
});

test("a trace that only records a blocked merge (no arrivedAt) is not an arrival", () => {
  const blockedOnly = { arrivedAt: null, files: [], authors: [], blocked: { files: ["vault/a.md"], reason: "conflict" }, announcedAt: null };
  assert.equal(report({ trace: blockedOnly }).split("\n")[0], "✅ Rien de nouveau : cette machine a déjà tout ce que le dépôt distant contient.");
});

// ── Who the remote heard from ────────────────────────────────────────────────

test("remote's last push under THIS machine's email: said as such, not guessed as the other machine", () => {
  const out = report({ remoteHead: { ...REMOTE_FROM_OTHER_MACHINE, email: ME.email } });
  assert.equal(out.split("\n")[1], "📤 Dernier push reçu par le dépôt distant : vendredi 25/09 à 19h05, avec la même identité git que cette machine.");
});

test("remote's last push by somebody else: named, never called 'your other machine'", () => {
  const out = report({ remoteHead: { at: REMOTE_FROM_OTHER_MACHINE.at, name: "Claire Martin", email: "claire@example.org" } });
  assert.equal(out.split("\n")[1], "📤 Dernier push reçu par le dépôt distant : vendredi 25/09 à 19h05, par Claire Martin (claire@example.org).");
});

test("a confirmed identity fuses two spellings into 'your other machine'", () => {
  const out = report({
    remoteHead: { at: REMOTE_FROM_OTHER_MACHINE.at, name: "tpierrain", email: "t@work.example" },
    identities: [{ name: "Thomas Pierrain", aka: ["tpierrain"] }],
  });
  assert.equal(out.split("\n")[1], "📤 Dernier push reçu par le dépôt distant : vendredi 25/09 à 19h05, depuis ton autre machine (t@work.example).");
});

test("one outside author is named alone; three are listed with commas", () => {
  const one = report({ trace: { ...FRIDAY_TRACE, authors: ["Claire Martin"] } }).split("\n")[0];
  assert.equal(
    one,
    "✅ Rien de nouveau depuis vendredi 25/09 à 19h06, heure à laquelle la synchro automatique a déjà rapatrié ici 17 fichiers (dont 16 notes) de Claire Martin.",
  );
  const three = report({ trace: { ...FRIDAY_TRACE, authors: ["Claire Martin", "Bob Durand", "Thomas Pierrain"] } }).split("\n")[0];
  assert.equal(
    three,
    "✅ Rien de nouveau depuis vendredi 25/09 à 19h06, heure à laquelle la synchro automatique a déjà rapatrié ici 17 fichiers (dont 16 notes) de Claire Martin, Bob Durand et Thomas Pierrain.",
  );
});

test("every other English sentence, pinned whole", () => {
  const en = (overrides) => report({ locale: "en", ...overrides }).split("\n");
  assert.deepEqual(en({ trace: null, remoteHead: null, thisSync: { committed: true, pulled: [], pushed: "failed" } }), [
    "✅ Nothing new: this machine already has everything the remote holds.",
    "📤 Last push the remote received: unknown (the remote branch could not be read).",
    "This /sync: local commit yes · push failed.",
  ]);
  assert.deepEqual(
    en({
      trace: { ...FRIDAY_TRACE, authors: ["Claire Martin", "Bob Durand"] },
      remoteHead: { ...REMOTE_FROM_OTHER_MACHINE, email: ME.email },
      thisSync: { committed: false, pulled: ["vault/notes/a.md", "vault/notes/b.md"], pushed: "ok" },
    }),
    [
      "📥 This /sync brought 2 files (2 of them notes).",
      "🕘 Previous arrival on this machine: Friday 25 Sep at 19:06, by the automatic sync: 17 files (16 of them notes) from Claire Martin and Bob Durand.",
      "📤 Last push the remote received: Friday 25 Sep at 19:05, under the same git identity as this machine.",
      "This /sync: local commit no · push sent.",
    ],
  );
  assert.equal(
    en({ remoteHead: { at: REMOTE_FROM_OTHER_MACHINE.at, name: "Claire Martin", email: "claire@example.org" } })[1],
    "📤 Last push the remote received: Friday 25 Sep at 19:05, by Claire Martin (claire@example.org).",
  );
});

test("arrivals from somebody else are named, not called 'your other machine'", () => {
  const out = report({ trace: { ...FRIDAY_TRACE, authors: ["Claire Martin", "Thomas Pierrain"] } });
  assert.equal(
    out.split("\n")[0],
    "✅ Rien de nouveau depuis vendredi 25/09 à 19h06, heure à laquelle la synchro automatique a déjà rapatrié ici 17 fichiers (dont 16 notes) de Claire Martin et Thomas Pierrain.",
  );
});

test("an arrival with no author on record names nobody", () => {
  const out = report({ trace: { ...FRIDAY_TRACE, authors: [] } });
  assert.equal(
    out.split("\n")[0],
    "✅ Rien de nouveau depuis vendredi 25/09 à 19h06, heure à laquelle la synchro automatique a déjà rapatrié ici 17 fichiers (dont 16 notes).",
  );
});

test("an unreadable remote branch is said, never skipped", () => {
  const out = report({ remoteHead: null });
  assert.equal(out.split("\n")[1], "📤 Dernier push reçu par le dépôt distant : inconnu (la branche distante n'a pas pu être lue).");
});

test("a failed push is reported as failed", () => {
  const out = report({ thisSync: { committed: true, pulled: [], pushed: "failed" } });
  assert.equal(out.split("\n").at(-1), "Ce /sync : commit local oui · push en échec.");
});
