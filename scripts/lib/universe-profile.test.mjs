import { test } from "node:test";
import assert from "node:assert/strict";

import {
  universeProfilePath,
  renderUniverseProfile,
  renderUniverseDigest,
  readUniverseProfile,
  writeUniverseProfile,
  declineProfileCapture,
  profileCaptureDeclined,
} from "./universe-profile.mjs";
import { DEFAULT_UNIVERSE } from "./universes.mjs";

// A universe's profile is a NOTE (decision D1): it lives in the vault, next to the
// notes of the universe it describes, so it is versioned, editable in Obsidian and
// searchable by the RAG like everything else.

test("universeProfilePath puts a created universe's profile inside its own subtree", () => {
  assert.equal(universeProfilePath("acme"), "acme/universe.md");
});

test("universeProfilePath puts the DEFAULT universe's profile at the vault root", () => {
  // The default universe has no subtree — it IS the root (ADR 0034), so its
  // profile cannot live under `default/`, a folder that must never exist.
  assert.equal(universeProfilePath(DEFAULT_UNIVERSE), "universe.md");
});

// --- reading a profile back (and knowing when there is none yet) -------------

// In-memory fs fake behind the surface this module uses.
function fakeFs(initial = {}) {
  const files = new Map(Object.entries(initial));
  const writes = [];
  return {
    files,
    writes,
    existsSync: (p) => files.has(p),
    readFileSync: (p) => {
      if (!files.has(p)) throw new Error(`ENOENT: ${p}`);
      return files.get(p);
    },
    writeFileSync: (p, data) => {
      writes.push({ path: p, data });
      files.set(p, data);
    },
    mkdirSync: () => {},
  };
}

test("readUniverseProfile returns null when the universe has no profile yet", () => {
  // The backfill case (D2): an existing universe — Thomas' own default one — has
  // no profile note, and that must be a plain, quiet "not yet", never an error.
  assert.equal(readUniverseProfile(fakeFs(), "/brain/vault", "acme"), null);
});

test("readUniverseProfile reads the profile note of the universe it was asked about", () => {
  // Two profiles on disk, and the OTHER one is the decoy: a reader ignoring the
  // slug would return the wrong universe's page and nothing would look wrong.
  const io = fakeFs({
    "/brain/vault/universe.md": "root profile",
    "/brain/vault/acme/universe.md": "acme profile",
  });

  assert.equal(readUniverseProfile(io, "/brain/vault", "acme"), "acme profile");
  assert.equal(readUniverseProfile(io, "/brain/vault", DEFAULT_UNIVERSE), "root profile");
});

// --- writing a profile --------------------------------------------------------

test("writeUniverseProfile creates the profile note under the universe's subtree", () => {
  const io = fakeFs();

  const res = writeUniverseProfile(io, "/brain/vault", {
    universe: "acme",
    displayName: "Acme Corp",
    kind: "employer",
    today: "2026-07-27",
  });

  assert.deepEqual(res, { ok: true, path: "acme/universe.md" });
  assert.deepEqual(io.writes, [
    {
      path: "/brain/vault/acme/universe.md",
      data: renderUniverseProfile({
        universe: "acme",
        displayName: "Acme Corp",
        kind: "employer",
        today: "2026-07-27",
      }).content,
    },
  ]);
});

test("writeUniverseProfile refuses to overwrite a profile the owner already has", () => {
  // Same rule as filing back a note: this page is theirs to edit in Obsidian, and
  // a capture flow re-run must never quietly replace what they wrote.
  const io = fakeFs({ "/brain/vault/acme/universe.md": "hand-written by the owner" });

  const res = writeUniverseProfile(io, "/brain/vault", {
    universe: "acme",
    displayName: "Acme Corp",
    today: "2026-07-27",
  });

  assert.deepEqual(res, { ok: false, reason: "exists", path: "acme/universe.md" });
  assert.deepEqual(io.writes, []);
  assert.equal(io.files.get("/brain/vault/acme/universe.md"), "hand-written by the owner");
});

// --- "do not ask again" (D2) --------------------------------------------------

test("declineProfileCapture remembers a refusal, per universe", () => {
  const io = fakeFs();

  declineProfileCapture(io, "/brain/.vault-rag", "acme");

  assert.equal(profileCaptureDeclined(io, "/brain/.vault-rag", "acme"), true);
  // Declining for one sphere says nothing about another: creating a universe later
  // must still get its own offer.
  assert.equal(profileCaptureDeclined(io, "/brain/.vault-rag", "blue"), false);
});

test("profileCaptureDeclined reads false on a brain that was never asked", () => {
  assert.equal(profileCaptureDeclined(fakeFs(), "/brain/.vault-rag", "acme"), false);
});

test("declineProfileCapture keeps the refusals it already had", () => {
  // Two entries, and the second must not erase the first: a refusal is forever.
  const io = fakeFs();

  declineProfileCapture(io, "/brain/.vault-rag", "acme");
  declineProfileCapture(io, "/brain/.vault-rag", "blue");

  assert.equal(profileCaptureDeclined(io, "/brain/.vault-rag", "acme"), true);
  assert.equal(profileCaptureDeclined(io, "/brain/.vault-rag", "blue"), true);
});

test("profileCaptureDeclined treats a corrupt marker file as 'never asked'", () => {
  // A broken state file must never wedge a session; the worst case is asking once
  // more, which is strictly better than crashing session start.
  const io = fakeFs({ "/brain/.vault-rag/profile-nudges.json": "{ not json" });

  assert.equal(profileCaptureDeclined(io, "/brain/.vault-rag", "acme"), false);
});

// --- the injected digest -----------------------------------------------------
// The profile is also injected at session start (D1: a note alone surfaces only
// when someone searches for it, and nobody searches for "what is Acme" before
// preparing a 1-1). It rides EVERY session, so its length is a design constraint,
// enforced here in the pure function rather than trusted to the caller.

test("renderUniverseDigest opens with the identity line the session needs", () => {
  const raw = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    kind: "employer",
    role: "Head of Engineering",
    period: "since 2024",
    today: "2026-07-27",
  }).content;

  const digest = renderUniverseDigest(raw);

  assert.equal(
    digest.split("\n")[0],
    "Acme Corp (employer) — your role: Head of Engineering, period: since 2024.",
  );
});

test("renderUniverseDigest carries the people and the connector accounts", () => {
  const raw = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    about: "Industrial widgets.",
    people: ["Zoe (CTO)", "Alice (PM)"],
    connectors: [{ tool: "Slack", account: "acme.slack.com" }],
    today: "2026-07-27",
  }).content;

  assert.equal(
    renderUniverseDigest(raw),
    [
      "Acme Corp.",
      "Industrial widgets.",
      "People: Zoe (CTO), Alice (PM).",
      "Connector accounts: Slack: acme.slack.com.",
    ].join("\n"),
  );
});

test("renderUniverseDigest caps a long profile and says where the rest is", () => {
  // This block rides EVERY session, so a profile someone grew into an essay must
  // not grow the context with it. The cap belongs here, not to the caller's
  // goodwill: an over-long digest is a bug the caller cannot see.
  const raw = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    about: Array.from({ length: 40 }, (_, i) => `Paragraph ${i}.`).join("\n"),
    people: Array.from({ length: 40 }, (_, i) => `Person ${i}`),
    today: "2026-07-27",
  }).content;

  const lines = renderUniverseDigest(raw, { maxLines: 6 }).split("\n");

  assert.equal(lines.length, 6);
  assert.equal(lines.at(-1), "(profile truncated — the full page is vault/acme/universe.md)");
});

test("renderUniverseDigest leaves a profile that is EXACTLY at the cap intact", () => {
  // On the boundary, where `<=` and `<` stop being the same function: 4 lines
  // (identity + two about lines + people) under a cap of 4 must lose nothing.
  const raw = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    about: "Industrial widgets.\nTwo teams.",
    people: ["Zoe (CTO)"],
    today: "2026-07-27",
  }).content;

  const digest = renderUniverseDigest(raw, { maxLines: 4 });

  assert.equal(
    digest,
    ["Acme Corp.", "Industrial widgets.", "Two teams.", "People: Zoe (CTO)."].join("\n"),
  );
});

// --- rendering the profile note ----------------------------------------------
// The note must be conformant to the vault taxonomy BY CONSTRUCTION (like
// renderFiledNote): complete frontmatter, so `/lint` stays green on it, and an
// explicit `type: universe` so the parser never has to guess from the folder.

test("renderUniverseProfile builds a lint-conformant note for a created universe", () => {
  const { path, content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    kind: "employer",
    today: "2026-07-27",
  });

  assert.equal(path, "acme/universe.md");
  assert.equal(
    content,
    [
      "---",
      "type: universe",
      "created: 2026-07-27",
      "updated: 2026-07-27",
      "tags: [universe]",
      "universe: acme",
      "displayName: Acme Corp",
      "kind: employer",
      "---",
      "",
      "# Acme Corp",
      "",
    ].join("\n"),
  );
});

test("renderUniverseProfile carries the optional role and period when they were answered", () => {
  // The twin (both absent → both omitted) is asserted by the two whole-content
  // tests around this one: they render no role/period line at all.
  const { content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    kind: "employer",
    role: "Head of Engineering",
    period: "since 2024",
    today: "2026-07-27",
  });

  assert.equal(
    content,
    [
      "---",
      "type: universe",
      "created: 2026-07-27",
      "updated: 2026-07-27",
      "tags: [universe]",
      "universe: acme",
      "displayName: Acme Corp",
      "kind: employer",
      "role: Head of Engineering",
      "period: since 2024",
      "---",
      "",
      "# Acme Corp",
      "",
    ].join("\n"),
  );
});

test("renderUniverseProfile omits the universe key for the default (absence IS the default)", () => {
  const { path, content } = renderUniverseProfile({
    universe: DEFAULT_UNIVERSE,
    displayName: "My world",
    kind: "personal",
    today: "2026-07-27",
  });

  assert.equal(path, "universe.md");
  assert.equal(
    content,
    [
      "---",
      "type: universe",
      "created: 2026-07-27",
      "updated: 2026-07-27",
      "tags: [universe]",
      "displayName: My world",
      "kind: personal",
      "---",
      "",
      "# My world",
      "",
    ].join("\n"),
  );
});

test("renderUniverseProfile lists the key people in the body, in the order given", () => {
  // Two entries, deliberately NOT alphabetical: a renderer that sorted or kept
  // only the first would diverge here. The answered order is the owner's order.
  const { content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    people: ["Zoe (CTO)", "Alice (PM)"],
    today: "2026-07-27",
  });

  assert.match(content, /# Acme Corp\n\n## People\n\n- Zoe \(CTO\)\n- Alice \(PM\)\n$/);
});

test("renderUniverseProfile writes no People section when nobody was named", () => {
  const { content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    people: [],
    today: "2026-07-27",
  });

  assert.doesNotMatch(content, /## People/);
});

test("renderUniverseProfile puts the free-text description right under the title", () => {
  // Everything the fixed questions did not anticipate lives here, so it must read
  // FIRST — before the lists — exactly like a human would write the page.
  const { content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    about: "Industrial widgets. Two engineering teams, one in Lyon.",
    people: ["Zoe (CTO)"],
    today: "2026-07-27",
  });

  assert.match(
    content,
    /# Acme Corp\n\nIndustrial widgets\. Two engineering teams, one in Lyon\.\n\n## People\n/,
  );
});

test("renderUniverseProfile records which account each connector uses in this universe", () => {
  // The single-account connectors (Slack, Notion, Google…) do NOT follow a
  // universe switch, so naming the account per universe is what makes the switch
  // reminder actionable instead of generic.
  const { content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    connectors: [
      { tool: "Slack", account: "acme.slack.com" },
      { tool: "Notion", account: "Acme workspace" },
    ],
    today: "2026-07-27",
  });

  assert.match(
    content,
    /## Connector accounts\n\n- Slack: acme\.slack\.com\n- Notion: Acme workspace\n$/,
  );
});

test("renderUniverseProfile writes no kind key when the question was skipped", () => {
  // A backfill can be answered partially. An unanswered key must be ABSENT, never
  // present-and-empty: `kind: undefined` would read as a fact to every later reader.
  const { content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    today: "2026-07-27",
  });

  assert.doesNotMatch(content, /kind:/);
  assert.match(content, /displayName: Acme Corp/);
});

test("renderUniverseProfile refuses a profile with no display name (it IS the note's title)", () => {
  assert.throws(
    () => renderUniverseProfile({ universe: "acme", kind: "employer", today: "2026-07-27" }),
    /displayName is required/,
  );
});

test("renderUniverseProfile refuses to guess the date instead of being given one", () => {
  assert.throws(
    () => renderUniverseProfile({ universe: "acme", displayName: "Acme Corp" }),
    /today .* is required/,
  );
});

test("universeProfilePath treats a missing universe as the default (single-universe brain)", () => {
  // Callers read the pointer, which reads back as the default when absent; an
  // undefined slug must land at the root too, never at "undefined/universe.md".
  assert.equal(universeProfilePath(undefined), "universe.md");
});

// ── Topics: what this sphere is ABOUT ────────────────────────────────────────
// People answer "who is Zoe?"; topics answer "is this note even about my work
// here?" — the recurring subjects (a product, a migration, a client account) that
// make an ambiguous question resolvable without asking back.

test("renderUniverseProfile records the recurring topics as their own section", () => {
  const { content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    topics: ["platform migration", "hiring"],
    today: "2026-07-27",
  });

  assert.match(content, /## Topics\n\n- platform migration\n- hiring\n/);
});

test("renderUniverseDigest carries the topics, in the note's order, after the people", () => {
  // A topic that lives only in the note is a topic the session cannot use to
  // disambiguate — and disambiguating is the whole reason to record them.
  const raw = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    people: ["Zoe (CTO)"],
    topics: ["platform migration", "hiring"],
    connectors: [{ tool: "Slack", account: "acme.slack.com" }],
    today: "2026-07-27",
  }).content;

  assert.equal(
    renderUniverseDigest(raw),
    [
      "Acme Corp.",
      "People: Zoe (CTO).",
      "Topics: platform migration, hiring.",
      "Connector accounts: Slack: acme.slack.com.",
    ].join("\n"),
  );
});

test("renderUniverseDigest reads a HAND-EDITED profile, trailing spaces in the headings and all", () => {
  // The note belongs to its owner: they edit it in Obsidian, which happily leaves
  // a trailing space behind a heading. A digest that silently dropped a section
  // over one invisible character would look like the profile itself was ignored.
  const raw = [
    "---",
    "type: universe",
    "displayName: Acme Corp",
    "---",
    "",
    "# Acme Corp",
    "",
    "## People  ",
    "* Zoe (CTO)",
    "- Alice (PM)",
  ].join("\n");

  // `*` and `-` are both Markdown bullets, and a digest that quoted one of them
  // back as part of a person's name would read as a typo the owner never made.
  assert.equal(renderUniverseDigest(raw), "Acme Corp.\nPeople: Zoe (CTO), Alice (PM).");
});
