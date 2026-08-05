// ─────────────────────────────────────────────────────────────────────────────
// universe-profile.mjs — the pure, I/O-free core of a universe's PROFILE
// (universes v2, decision D1): what this sphere IS (an employer, a client, a
// personal space), who is in it, which accounts its connectors use.
//
// The profile is a note in the vault (versioned, editable in Obsidian, indexed by
// the RAG) plus a short digest injected at session start — because the ambient
// facts of a universe are needed exactly when nobody thinks to search for them.
// ─────────────────────────────────────────────────────────────────────────────
import { DEFAULT_UNIVERSE } from "./universes.mjs";
import { parseNote } from "./note-parse.mjs";
import { renderConnectorAccounts } from "./connector-accounts.mjs";

// The profile note's filename. No leading underscore ON PURPOSE: the scanner
// excludes `_template.md` BY NAME, so an `_`-prefixed file would never be indexed
// — and an unindexed profile is a profile the RAG cannot answer from.
const PROFILE_FILENAME = "universe.md";

// How many lines of profile may ride EVERY session (D1: the cap is a design
// constraint, not a nicety). Enough for the identity line, a short description and
// the lists; anything longer stays in the note, which the RAG can still search.
const DIGEST_MAX_LINES = 12;

// The single gate on what "the default universe" means here, so the note's PATH
// and its FRONTMATTER can never disagree about it (an absent slug reads as the
// default, exactly like the pointer does).
const isDefaultUniverse = (universe) => !universe || universe === DEFAULT_UNIVERSE;

/**
 * The vault-relative path of a universe's profile note. The default universe has
 * no subtree of its own (it IS the vault root, ADR 0034), so its profile sits at
 * the root; a created universe keeps its profile inside its own subtree. Pure.
 */
export function universeProfilePath(universe) {
  return isDefaultUniverse(universe) ? PROFILE_FILENAME : `${universe}/${PROFILE_FILENAME}`;
}

/**
 * The raw profile note of a universe, or null when it has none yet. "None yet" is
 * the normal state of every brain installed before profiles existed, so it is a
 * quiet null and never an error. Injected fs.
 */
export function readUniverseProfile(io, vaultDir, universe) {
  const path = `${vaultDir}/${universeProfilePath(universe)}`;
  return io.existsSync(path) ? io.readFileSync(path) : null;
}

/**
 * Writes a universe's profile note, and REFUSES if one already exists: the page
 * belongs to its owner (they edit it in Obsidian), so a capture flow run twice
 * must never quietly replace what they wrote. Injected fs; returns the
 * vault-relative path either way so the caller can name it.
 */
export function writeUniverseProfile(io, vaultDir, answers) {
  const { path, content } = renderUniverseProfile(answers);
  const absolute = `${vaultDir}/${path}`;
  if (io.existsSync(absolute)) return { ok: false, reason: "exists", path };
  io.mkdirSync(dirnamePosix(absolute), { recursive: true });
  io.writeFileSync(absolute, content);
  return { ok: true, path };
}

// POSIX-only dirname: vault paths are built here with "/" separators, so the
// node:path version would only add a platform dependency this module does not need.
function dirnamePosix(path) {
  return path.slice(0, path.lastIndexOf("/"));
}

// Where a refusal is remembered. Under .vault-rag/ and therefore COMMITTED (only
// the active pointer is gitignored): declining is the owner's decision, not the
// machine's, so it must travel with the brain instead of coming back on the laptop.
const NUDGE_STATE_FILE = "profile-nudges.json";

/** True when the owner has said no to describing this universe. Injected fs. */
export function profileCaptureDeclined(io, dir, universe) {
  return readDeclined(io, dir).includes(universe);
}

/** Remembers a refusal, keeping the ones already recorded. Injected fs. */
export function declineProfileCapture(io, dir, universe) {
  const declined = [...new Set([...readDeclined(io, dir), universe])].sort();
  io.mkdirSync(dir, { recursive: true });
  io.writeFileSync(`${dir}/${NUDGE_STATE_FILE}`, JSON.stringify({ declined }, null, 2) + "\n");
}

// A corrupt or absent marker reads as "nobody was ever asked": worst case the
// offer comes once more, which beats wedging a session over a broken state file.
function readDeclined(io, dir) {
  const path = `${dir}/${NUDGE_STATE_FILE}`;
  if (!io.existsSync(path)) return [];
  try {
    const parsed = JSON.parse(io.readFileSync(path));
    return Array.isArray(parsed?.declined) ? parsed.declined : [];
  } catch {
    return [];
  }
}

/**
 * The short block injected at session start for the active universe, built from
 * the profile note as it is ON DISK (so an owner editing the note in Obsidian
 * changes what gets injected, with nothing to re-run). Pure.
 */
export function renderUniverseDigest(raw, { maxLines = DIGEST_MAX_LINES } = {}) {
  const { frontmatter, body } = parseNote(raw);
  const sections = bodySections(body);
  const lines = [
    identityLine(frontmatter),
    ...sections.about,
    ...listLine("People", sections.people),
    ...listLine("Topics", sections.topics),
    // NOT a listLine like the two above, and that asymmetry is the point (14.6):
    // people and topics are the owner's own words about their own world, where a
    // connector account is a claim about a LIVE tool that may have moved since.
    ...renderConnectorAccounts(sections.connectors),
  ];
  if (lines.length <= maxLines) return lines.join("\n");
  // Truncation names the note, so the session can go read the rest on purpose
  // instead of acting on a profile it does not know is partial.
  return [
    ...lines.slice(0, maxLines - 1),
    `(profile truncated — the full page is ${vaultNotePath(frontmatter.universe)})`,
  ].join("\n");
}

/**
 * The short block injected at EVERY session start (F1). Deliberately NOT the
 * digest: it states which sphere is in force and stops there. Pure.
 */
export function renderUniverseSynthesis(raw, { universe } = {}) {
  const { frontmatter } = parseNote(raw);
  // The path is stated by the caller when it knows it, because the caller LOCATED
  // the file: that is a fact, where the frontmatter is a claim a hand-edit can lose.
  // A pointer to a note that is not there would be worse than no pointer at all.
  const at = universe === undefined ? frontmatter.universe : universe;
  return [
    identityLine(frontmatter),
    `Full profile: ${vaultNotePath(at)} — read it when the answer depends ` +
      `on the people, tools or scope here.`,
    "(for the description itself, they can ask `/switch`)",
  ].join("\n");
}

// Who this sphere is, in one line, built from the frontmatter the owner answered.
// Shared by the pulled digest and the injected synthesis so the two renderings can
// never introduce themselves differently for the same universe.
function identityLine(frontmatter) {
  const kind = frontmatter.kind ? ` (${frontmatter.kind})` : "";
  const details = [
    frontmatter.role ? `your role: ${frontmatter.role}` : null,
    frontmatter.period ? `period: ${frontmatter.period}` : null,
  ].filter(Boolean);
  const tail = details.length ? ` — ${details.join(", ")}` : "";
  return `${frontmatter.displayName}${kind}${tail}.`;
}

// Where this profile lives, as the owner would type it — vault-relative, so the
// same string works whether the session reads it or the owner opens it.
function vaultNotePath(universe) {
  return `vault/${universeProfilePath(universe)}`;
}

// One line per list section, dropped entirely when the section is absent.
function listLine(title, items) {
  return items.length ? [`${title}: ${items.join(", ")}.`] : [];
}

// The headings the digest knows how to quote. A table rather than a ternary
// chain: the list is now long enough that adding one must not mean re-reading a
// nested conditional.
const SECTIONS = { People: "people", Topics: "topics", "Connector accounts": "connectors" };

// Split the profile note's body into the pieces the digest quotes: the free text
// under the H1, and the bullet lists of the known sections. Anything an owner
// added by hand beyond those lands in `other` and is left to the note (and to the
// RAG), so a hand-written section never leaks into every session's context.
function bodySections(body) {
  const out = { about: [], people: [], topics: [], connectors: [], other: [] };
  let current = "about";
  for (const line of body.split("\n")) {
    const heading = line.match(/^##\s+(.*)$/);
    if (heading) {
      current = SECTIONS[heading[1].trim()] ?? "other";
      continue;
    }
    if (line.startsWith("# ") || line.trim() === "") continue;
    // The free text is quoted as written; list sections are quoted as values, so
    // the digest can join them into one line instead of a bullet list.
    out[current].push(current === "about" ? line : line.replace(/^[-*]\s*/, ""));
  }
  return out;
}

/**
 * Builds a universe's profile note as { path, content }, conformant to the vault
 * taxonomy BY CONSTRUCTION (mirrors renderFiledNote): complete frontmatter so
 * `/lint` stays green, and an EXPLICIT `type: universe` so the parser never has to
 * infer a type from the folder. Pure: `today` is injected, never read off a clock.
 */
export function renderUniverseProfile(answers) {
  const { universe, displayName, kind, role, period, today } = answers;
  if (!today) throw new Error("today (YYYY-MM-DD) is required to stamp created/updated");
  if (!displayName) throw new Error("displayName is required: it is the profile note's title");
  // An unanswered question writes NO key at all: a profile half-filled today and
  // completed later must not carry empty keys in between (they read as facts).
  const optional = (key, value) => (value ? [`${key}: ${value}`] : []);
  const frontmatter = [
    "---",
    "type: universe",
    `created: ${today}`,
    `updated: ${today}`,
    "tags: [universe]",
    // Additive scope key, omitted at the root exactly like every other note: the
    // ABSENCE of `universe:` is what "default" means (ADR 0034), so stamping it
    // would make the default universe's own profile the one note that lies.
    ...(isDefaultUniverse(universe) ? [] : [`universe: ${universe}`]),
    `displayName: ${displayName}`,
    ...optional("kind", kind),
    ...optional("role", role),
    ...optional("period", period),
    "---",
  ];
  // A section is written only when it has content: an empty "## People" heading
  // would claim the question was answered with "nobody".
  const section = (title, lines) => (lines.length ? ["", `## ${title}`, "", ...lines] : []);
  // People stay in the ANSWERED order, never sorted: the owner named the most
  // present ones first, and that ordering is itself information.
  const people = answers.people ?? [];
  // The recurring subjects of this sphere. They answer a different question from
  // People ("is this note about my work HERE?"), which is what lets an ambiguous
  // ask resolve without a round-trip.
  const topics = answers.topics ?? [];
  // Which account each single-account connector uses HERE. Those connectors do not
  // follow a universe switch, so this is what turns the switch reminder from a
  // generic warning into "reconnect Slack to acme.slack.com".
  const connectors = answers.connectors ?? [];
  return {
    path: universeProfilePath(universe),
    content: [
      ...frontmatter,
      "",
      `# ${displayName}`,
      ...(answers.about ? ["", answers.about] : []),
      ...section("People", people.map((p) => `- ${p}`)),
      ...section("Topics", topics.map((t) => `- ${t}`)),
      ...section("Connector accounts", connectors.map((c) => `- ${c.tool}: ${c.account}`)),
      "",
    ].join("\n"),
  };
}
