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
import { renderSourcesField, SOURCES_FIELD, sourceKey } from "./source-key.mjs";

// The active universe carried by a spec, or null when the note belongs to the
// vault root — no universe, or the implicit default (ADR 0034: a default-universe
// brain lives at the root and behaves exactly as a single-universe brain). Pure:
// just the constant, no I/O. Kept as the single gate so the path and the
// frontmatter agree on what "in a universe" means.
function activeUniverse(spec) {
  return spec.universe && spec.universe !== DEFAULT_UNIVERSE ? spec.universe : null;
}

// The slug rule itself, answering `null` instead of throwing when a title reduces
// to nothing. Split out of `slugify` — not duplicated beside it (CONVENTIONS
// §5quater) — because the per-person note paths need to ASK whether a name has a
// slug and carry on when it does not: a git author name written in a script with
// no Latin letters is legitimate, and the right answer there is to fall back to
// the shared path, never to refuse the note.
export function slugSafe(title) {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // any run of non-alphanumerics → one hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
  return slug === "" ? null : slug;
}

export function slugify(title) {
  const slug = slugSafe(title);
  if (slug === null) throw new Error(`empty slug: title "${title}" has no slug-able characters`);
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
export function confidenceLine({ level, basis }) {
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

// What a note can be built from, in the order the constitution already states
// ("verbatim > human synthesis > AI synthesis"). One scale for the whole brain,
// like CONFIDENCE above: a second vocabulary would be a second discipline.
// ⚠️ THE KEY ORDER IS THE RANKING, best first — it is what the frontmatter stamp
// reads to name a note's weakest source. `conversation` sits under `verbatim`
// (a transcript can be re-read; an exchange is gone at the next /clear) and over
// anything that re-tells someone else's words.
export const SOURCE_TIERS = {
  verbatim: "📄 verbatim",
  conversation: "💬 this conversation",
  "human-summary": "📝 human synthesis",
  "ai-summary": "🤖 AI synthesis",
};

// A search hit is not a tier of the scale, it is BELOW it: the snippet arrives
// unasked, before any document is opened, so no ranking rule ever gets a moment
// to apply. Named here so the refusal can say which door to take instead of
// reading as a spelling mistake.
const SNIPPET_TIERS = new Set(["snippet", "search-result", "search-snippet", "contentsnippet"]);

// The weakest of the declared tiers — the one a note's reliability is actually
// capped by. Read from SOURCE_TIERS' own key order (best first), so the ranking
// has exactly one owner: adding a tier in the right place is all it takes.
export function weakestSourceTier(sources) {
  const rank = Object.keys(SOURCE_TIERS);
  return sources
    .map(({ tier }) => tier)
    .reduce((worst, tier) => (rank.indexOf(tier) > rank.indexOf(worst) ? tier : worst));
}

// The rendered source header: what this note rests on, one declared source per
// line. Rendered as a list even for a single source, so the shape a reader (and
// a later pass) meets is always the same one.
export function sourcesBlock(sources) {
  const lines = sources.map(({ tier, ref }) => {
    const marker = SOURCE_TIERS[tier];
    if (!marker && SNIPPET_TIERS.has(String(tier).toLowerCase())) {
      throw new Error(
        `"${tier}": a search-result snippet is never a source — open the document, read it, ` +
          `and declare the tier you actually read (${Object.keys(SOURCE_TIERS).join(", ")}).`,
      );
    }
    if (!marker) {
      throw new Error(
        `unknown source tier "${tier}": use one of ${Object.keys(SOURCE_TIERS).join(", ")}`,
      );
    }
    if (!ref || !String(ref).trim()) {
      throw new Error(
        `source "${tier}" needs a reference: name the document, the section and the date, ` +
          `so the reading can be gone back to.`,
      );
    }
    return `> - ${marker} · ${ref}`;
  });
  return `> **Sources**\n${lines.join("\n")}`;
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
  // A note that does not say what it rests on is refused, not written silently.
  // The rule it enforces existed in prose long before this line and never fired:
  // ranking sources is advice you consult when citing, whereas the tier is
  // decided far earlier, when a summary lands in context unasked and already has
  // the shape of the deliverable. Asked here, the question cannot be skipped.
  if (!spec.sources || spec.sources.length === 0) {
    throw new Error(
      `at least one source is required: say what this note was built from, as ` +
        `"sources": [{ "tier": …, "ref": … }] — tier is one of ` +
        `${Object.keys(SOURCE_TIERS).join(", ")}, ref names the document, section and date.`,
    );
  }
  const links = spec.links ?? [];
  const path = filedNotePath(spec);
  const universe = activeUniverse(spec);
  // The MACHINE identity of what this note drew on (ADR 0041) — not to be confused
  // with `spec.sources` one field above, which says what TIER of material it rests
  // on and is read by a human. Composed here rather than accepted ready-made, so a
  // half-filled descriptor refuses the note instead of stamping a key that would
  // match nothing. Deduplicated: one source named twice is one source.
  const sourceKeys = [...new Set((spec.sourceKeys ?? []).map(sourceKey))];
  // Rendered (and validated) before the frontmatter, because the level lands in
  // both: the field is what a later pass can FIND, the line is what a human reads.
  const sure = spec.confidence ? `> **Confidence** — ${confidenceLine(spec.confidence)}\n\n` : "";
  // Unconditional, and it has to be: the guard above already refused a note with
  // no sources, so a `spec.sources ? … : ""` here (and on the frontmatter stamp
  // below) was a branch nothing could reach — the mutation pass could put
  // anything in the else and stay green. An unreachable branch is a design
  // defect, not an exemption.
  const built = `${sourcesBlock(spec.sources)}\n\n`;
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
    // What the note rests on, as a field: "which notes here were built on an AI
    // synthesis?" must be answerable without re-reading every one of them.
    `source_tier: ${weakestSourceTier(spec.sources)}`,
    // Which objects this note was captured from, so a second brain can ask "do I
    // already hold this?" without reading the prose. Omitted when there is nothing
    // to claim: ABSENT means unknown (ADR 0041 §3), and an empty list would say
    // "drew on nothing", which is a different and usually false statement.
    ...(sourceKeys.length > 0 ? [`${SOURCES_FIELD}: ${renderSourcesField(sourceKeys)}`] : []),
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
  const content = `${frontmatter}\n\n# ${spec.title}\n\n${which}${sure}${built}${spec.body}\n${related}`;
  // The keys travel back out, because the CALLER is the one that must ask the vault
  // whether it already holds one of them — and composing them twice is how the
  // question and the stamp come to disagree.
  return { path, content, sourceKeys };
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
