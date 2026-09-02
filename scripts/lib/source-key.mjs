// ─────────────────────────────────────────────────────────────────────────────
// source-key.mjs — the pure, I/O-free core of the source identity (ADR 0041,
// rung 1 of the determinism ladder). It turns what a connector handed back about
// a mail, a message, an event or a document into ONE normalized string, so that
// two brains meeting the same source land on the same key and the duplicate check
// is a `grep` rather than a judgement call.
//
// Two rules do all the work, and they pull in opposite directions on purpose:
//
//   - an OPAQUE IDENTIFIER keeps its case. Folding it would invent collisions
//     between two genuinely different documents, and a collision is a false
//     "already held" — the one direction ADR 0041 §5 forbids.
//   - HUMAN TEXT loses its case, its accents and its punctuation. Keeping them
//     would invent misses between two spellings of one subject, and a check that
//     never matches is indistinguishable from a check nobody wired up.
//
// The result carries no comma, no colon, no bracket and no space — so a key is
// safe in a YAML inline list (the only list shape note-parse.mjs reads), safe as
// ONE shell argument, and greppable.
// ─────────────────────────────────────────────────────────────────────────────

// Every character a key may carry inside a field. `|` is the separator and is
// therefore NOT here; a field that contained one would forge a key of its own.
const SAFE_IN_FIELD = /[^A-Za-z0-9_.@+-]+/g;

// A field that is missing, or whose value reduces to nothing a key may carry,
// leaves the source with no identity — and half a key is not one. Named, so the
// caller learns which field to go and read rather than which line threw.
function noKey(name, type) {
  return new Error(
    `a ${type} source has no "${name}" — there is no key to compose without it. ` +
      `A source you cannot identify is UNKNOWN: write no key rather than a partial one.`,
  );
}

// An opaque identifier: whatever the source called it, minus what a key may not
// carry. Case survives — see the header. No `.trim()`: surrounding whitespace is
// already unsafe, so it becomes a hyphen and is then stripped from the edges.
function normalizeId(raw, { name, type }) {
  const value = String(raw ?? "")
    .replace(SAFE_IN_FIELD, "-")
    // `-` is itself safe, so a value that really carries leading or trailing
    // hyphens can carry SEVERAL of them: the `+` is load-bearing here, unlike in
    // the text normalizer below where every run has already been collapsed.
    .replace(/^-+|-+$/g, "");
  if (value === "") throw noKey(name, type);
  return value;
}

// An email address, out of whatever the connector wrapped it in: `Name <a@b.com>`
// and `a@b.com` are the same person writing. Lowercased, because mail addresses
// are compared without regard to case everywhere they are actually used.
function normalizeAddress(raw, ctx) {
  const text = String(raw ?? "");
  const angled = text.match(/<([^>]*)>/);
  return normalizeId((angled ? angled[1] : text).toLowerCase(), ctx);
}

// Human text — a subject line. Accents stripped and punctuation collapsed, the
// same reduction slugify performs on a title, so two keyboards spell one subject
// once. An empty subject is a legitimate mail, not a refusal: it keys as "-".
function normalizeText(raw) {
  const slug = String(raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    // One `-` at each edge at most: the run collapse above has already happened,
    // and a hyphen is itself non-alphanumeric, so it was collapsed with the rest.
    .replace(/^-|-$/g, "");
  return slug === "" ? "-" : slug;
}

// The instant, as basic ISO 8601 in UTC to the second: `20260902T161932Z`. Basic
// rather than extended because the extended form carries colons, and a colon is
// what would make the key unsafe in the very list it is written into. Two people
// in two timezones name one instant one way.
function normalizeTimestamp(raw, { name, type }) {
  const text = String(raw ?? "").trim();
  if (text === "") throw noKey(name, type);
  // Epoch forms first, and ANCHORED: `Date.parse` answers NaN to a bare number, so
  // a connector handing back `internalDate` would otherwise read as "names no
  // instant" — and an unanchored match would read the last thirteen digits of a
  // longer number as a timestamp, i.e. silently key a different instant.
  const ms = /^\d{10}$/.test(text)
    ? Number(text) * 1000
    : /^\d{13}$/.test(text)
      ? Number(text)
      : Date.parse(text);
  if (!Number.isFinite(ms)) {
    throw new Error(
      `a ${type} source's "${name}" does not name an instant: ${JSON.stringify(text)}. ` +
        `Give the sent time as ISO 8601 (2026-09-02T16:19:32Z) or as an epoch in seconds or milliseconds.`,
    );
  }
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

// The identifying fields of each source type, in the order they are joined — ADR
// 0041's key table, in code. Each field carries its NORMALIZER rather than the name
// of one: a label would need a dispatch to turn back into behaviour, and a mistyped
// label would quietly fall through to whatever the dispatch defaults to.
const FIELDS = {
  slack: [["channel", normalizeId], ["ts", normalizeId]],
  calendar: [["event", normalizeId]],
  drive: [["file", normalizeId]],
  notion: [["page", normalizeId]],
  // Mail is the only composite, because it is the only source where each person
  // holds their OWN copy of the object rather than a view onto one shared object.
  mail: [["from", normalizeAddress], ["date", normalizeTimestamp], ["subject", normalizeText]],
};

/** The source types that have an identity at all. Anything else is UNKNOWN, never "already seen". */
export const SOURCE_TYPES = Object.keys(FIELDS);

/**
 * The normalized key for one source, e.g.
 *   { type: "slack", channel: "C0CEQ4R5E", ts: "1725283200.001200" }
 *     → "slack|C0CEQ4R5E|1725283200.001200"
 *
 * Refuses loudly rather than guessing: an unknown type is a typo that would
 * quietly disable dedup for a whole source, and a missing identifier is a key
 * nobody can invent. A source with no identity at all is expressed by writing no
 * key — not by passing a half-filled descriptor.
 */
export function sourceKey(descriptor) {
  const declared = String(descriptor?.type ?? "");
  const type = declared.trim().toLowerCase();
  const fields = FIELDS[type];
  if (!fields) {
    throw new Error(
      `unknown source type ${JSON.stringify(declared)}: ` +
        `the sources that carry an identity are ${SOURCE_TYPES.join(", ")}.`,
    );
  }
  const parts = fields.map(([name, normalize]) => normalize(descriptor[name], { name, type }));
  return [type, ...parts].join("|");
}

/** Whether a string is a key this module could have produced — the shape the frontmatter may carry. */
export function isSourceKey(value) {
  // `typeof` first, deliberately: `RegExp.test` stringifies its argument, so an ARRAY
  // holding one key would test true and a note could claim a source through a shape
  // this module never produced.
  return typeof value === "string" && /^[a-z]+(\|[A-Za-z0-9_.@+-]+)+$/.test(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// The vault IS the ledger (ADR 0041). "Has anyone digested this source?" is
// answered by "does any note list it?" — so there is no second store to seed,
// migrate or repair, and nothing that can go out of step with the notes.
//
// The field's name and the two directions it travels — read by the check, written
// by the producers — live here together, because a reader and a writer that drift
// into two spellings make a check that silently never matches.
// ─────────────────────────────────────────────────────────────────────────────

/** The frontmatter key a note lists its sources under. One name, one owner. */
export const SOURCES_FIELD = "sources";

/**
 * The source keys one note claims. The frontmatter reader hands back an array for
 * an inline list and a plain string for a lone value, and a note written before
 * this decision hands back nothing at all — which is UNKNOWN, never "none".
 */
export function noteSources(frontmatter) {
  const raw = frontmatter?.[SOURCES_FIELD];
  const values = Array.isArray(raw) ? raw : [raw];
  return values.map((v) => String(v ?? "").trim()).filter((v) => v !== "");
}

/**
 * Every note that lists `key`, in the order the notes were given. Plural on
 * purpose: a source is legitimately held by the capture that stored it AND by
 * every synthesis that drew on it, and the caller should cite the right one.
 * The comparison is whole-string equality — a key that merely starts like
 * another one is a different source, which is the false hit ADR 0041 §5 forbids.
 */
export function notesHoldingSource(notes, key) {
  return notes.filter((note) => noteSources(note.frontmatter).includes(key)).map((note) => note.path);
}

/**
 * The frontmatter value a producer writes: an inline list, deduplicated, in the
 * order the note drew on its sources. Refuses anything the composer could not
 * have produced — a hand-written key matches nothing, so it is not a weaker
 * claim but a silent no-op wearing the shape of one.
 */
export function renderSourcesField(keys) {
  for (const key of keys) {
    if (!isSourceKey(key)) {
      throw new Error(
        `${JSON.stringify(key)} is not a source key, so it cannot go in "${SOURCES_FIELD}": ` +
          `compose it with sourceKey({ type, … }) — a key nothing can match is worse than none.`,
      );
    }
  }
  return `[${[...new Set(keys)].join(", ")}]`;
}
