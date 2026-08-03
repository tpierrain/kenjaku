// ─────────────────────────────────────────────────────────────────────────────
// filed-note.mjs — the pure, I/O-free core of Track B ("file the good answer
// back", ADR 0009 rung 1: correctness in a function with no I/O). Given a filing
// spec it builds a note that is conformant to the vault taxonomy BY CONSTRUCTION:
// the right path, complete frontmatter (type/created/updated/tags), and woven
// [[links]] — so a filed-back answer never re-introduces the defects the `/lint`
// scanner (Track A) reports. A thin CLI (rung 2) injects the date and the fs.
// ─────────────────────────────────────────────────────────────────────────────

// Turn a human title into a filename-safe slug: lowercased, accent-stripped,
// kebab-case (e.g. "Jane Doe" → "jane-doe").
import { DEFAULT_UNIVERSE } from "./universes.mjs";

// The active universe carried by a spec, or null when the note belongs to the
// vault root — no universe, or the implicit default (ADR 0034: a default-universe
// brain lives at the root and behaves exactly as a single-universe brain). Pure:
// just the constant, no I/O. Kept as the single gate so the path and the
// frontmatter agree on what "in a universe" means.
function activeUniverse(spec) {
  return spec.universe && spec.universe !== DEFAULT_UNIVERSE ? spec.universe : null;
}

export function slugify(title) {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any run of non-alphanumerics → one hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
  if (slug === "") throw new Error(`empty slug: title "${title}" has no slug-able characters`);
  return slug;
}

// The vault folder each note type lives in (mirrors the constitution taxonomy).
const FOLDER = {
  person: "people",
  topic: "topics",
  decision: "decisions",
  meeting: "meetings",
};

// Dated types carry a YYYY-MM-DD prefix in their filename (constitution taxonomy);
// living pages (person/topic) do not.
const DATED = new Set(["decision", "meeting"]);

// How sure the card's own resolution is, in the words the claim discipline
// already ships (`sync-sources`, "Mark it in the artifact"). One scale for the
// whole brain: a second vocabulary here would be a second discipline.
export const CONFIDENCE = {
  observed: "✅ observed",
  probable: "🟡 derived or probable",
  unverified: "🔴 unverified",
};

// The rendered reliability line, or a loud refusal. A level outside the scale is
// NOT rendered leniently: "— undefined · …" is a card whose reliability line
// looks like it says something and says nothing, which is the very conflation
// the block exists to end.
function confidenceLine({ level, basis }) {
  const marker = CONFIDENCE[level];
  if (!marker) {
    throw new Error(
      `unknown confidence level "${level}": use one of ${Object.keys(CONFIDENCE).join(", ")}`,
    );
  }
  if (!basis || !String(basis).trim()) {
    throw new Error(
      `confidence "${level}" needs a basis: say what the resolution rests on (source, date, card)`,
    );
  }
  return `${marker} · ${basis}`;
}

// The vault-relative path a filed-back note must live at, derived from its type
// (and title, and — for dated types — its date). Pure: no clock, no fs.
export function filedNotePath(spec) {
  const folder = FOLDER[spec.type];
  if (!folder) {
    throw new Error(
      `unknown type "${spec.type}": supported types are ${Object.keys(FOLDER).join(", ")}`,
    );
  }
  if (DATED.has(spec.type) && !spec.date) {
    throw new Error(`type "${spec.type}" requires a date (YYYY-MM-DD) for its filename`);
  }
  const stem = DATED.has(spec.type) ? `${spec.date}-${slugify(spec.title)}` : slugify(spec.title);
  const universe = activeUniverse(spec);
  const prefix = universe ? `${universe}/` : "";
  return `${prefix}${folder}/${stem}.md`;
}

// Build a filed-back note as { path, content }. The content is conformant to the
// vault taxonomy BY CONSTRUCTION: complete frontmatter (type/created/updated/tags
// all present), an H1 title, the distilled body, and — when links are given — a
// "Related" section weaving them in as [[wikilinks]]. Pure: `today` is injected,
// never read from a clock.
export function renderFiledNote(spec) {
  if (!spec.today) throw new Error("today (YYYY-MM-DD) is required to stamp created/updated");
  if (!spec.tags || spec.tags.length === 0) {
    throw new Error("at least one tag is required (frontmatter conformance: tags must be non-empty)");
  }
  const links = spec.links ?? [];
  const path = filedNotePath(spec);
  const universe = activeUniverse(spec);
  // Rendered (and validated) before the frontmatter, because the level lands in
  // both: the field is what a later pass can FIND, the line is what a human reads.
  const sure = spec.confidence ? `> **Confidence** — ${confidenceLine(spec.confidence)}\n\n` : "";
  const frontmatter = [
    "---",
    `type: ${spec.type}`,
    `created: ${spec.today}`,
    `updated: ${spec.today}`,
    `tags: [${spec.tags.join(", ")}]`,
    // A caveat left in prose is a caveat the next session absorbs as confidence
    // (the claim discipline's "yesterday's caveat is a debt"). As a field, it is
    // findable without reading the sentence.
    ...(spec.confidence ? [`confidence: ${spec.confidence.level}`] : []),
    // Additive scope key so retrieval travels with the file (ADR 0034), appended
    // last to match the import stamper (stamp-universe.mjs). Omitted at the root.
    ...(universe ? [`universe: ${universe}`] : []),
    "---",
  ].join("\n");
  const related =
    links.length > 0 ? `\n## Related\n\n${links.map((l) => `- [[${l}]]`).join("\n")}\n` : "";
  // The homonymy block sits ABOVE the body, because it is what makes the card
  // usable to the next resolution: a first name is rarely unique, and a card
  // that does not say which one only moves the ambiguity.
  const which = spec.distinguish ? `> **Which one** — ${spec.distinguish}\n\n` : "";
  const content = `${frontmatter}\n\n# ${spec.title}\n\n${which}${sure}${spec.body}\n${related}`;
  return { path, content };
}

// The first-name segment of a people-card path: `acme/people/romain-durand.md`
// → `romain`. Cards are named `<firstname>-<lastname>.md` (slugified, so already
// accent-free and lowercased), which is what makes the shared first name a
// mechanical fact rather than a judgement call.
function firstNameSegment(cardPath) {
  return cardPath.split("/").pop().replace(/\.md$/, "").split("-")[0];
}

// The existing `people/` cards that already bear the first name a new card is
// about to claim. Pure: the caller hands it what it found on disk.
export function homonymCards(path, existing) {
  const firstName = firstNameSegment(path);
  return existing.filter((card) => firstNameSegment(card) === firstName);
}
