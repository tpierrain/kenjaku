// ─────────────────────────────────────────────────────────────────────────────
// brain-author.mjs — who writes in this brain, and the one thing implicitness owes
// them in exchange: a sentence, said once.
//
// Duo mode is IMPLICIT (the owner's call, plan § *The owner's call*). Nothing to
// switch on, no per-person profile to fill in, no list of people to maintain. The
// name comes from `git config --get user.name`, which git already writes into every
// commit this brain makes and which the live sync already speaks aloud ("1 note
// from Claire arrived"). Reading it is not collecting it.
//
// A switch would protect whoever thought to flip it, which is never the duo about
// to have its notes doubled — a protection that must be foreseen before the problem
// is not a protection. But a brain that quietly starts filing things differently is
// opaque, so the first time a second author is seen it SAYS so, once, and offers to
// describe who is who: an offer that activates nothing, and whose refusal changes
// no behaviour at all.
//
// Below two authors this module is silent, in every direction. Same doctrine as
// universes (ADR 0034): nothing surfaces until a second one exists.
// ─────────────────────────────────────────────────────────────────────────────
import { slugSafe } from "./filed-note.mjs";

/** How many authors get named before the rest are merely counted (F5: volume IS the defect). */
const NAMES_SHOWN = 3;

/** How this brain asks git who is at the keyboard. Shared with remote-sync.mjs — one notion of "who". */
export const GIT_AUTHOR_ARGS = ["config", "--get", "user.name"];

/** How it asks git who has ever written here. History, not a list somebody maintains. */
export const GIT_AUTHORS_ARGS = ["log", "--format=%an"];

/** The name git is configured with on this machine, or null when it has none. `git` is the injected `(args) → {out, ok}` runner. */
export function localAuthorName(git) {
  const name = git(GIT_AUTHOR_ARGS).out.trim();
  return name === "" ? null : name;
}

/**
 * The spelling the owner keeps for `name`, when they have CONFIRMED that several
 * spellings are one person; `name` untouched otherwise (step 8).
 *
 * `identities` is `[{ name, aka: [...] }]` — the registry that travels between
 * machines. It remembers an answer already given and never infers one: two names
 * that merely look alike stay two people, because the only thing that can tell
 * `tpierrain` (the same owner's other Mac) from `tpierrain` (a colleague who
 * happens to share the handle) is the human who was asked.
 *
 * Fail-open in every direction. This registry is read off disk at session start,
 * so a missing file, a half-written one or a hand-edited one must cost the fusion
 * and strictly nothing else: every malformed shape degrades to "no registry".
 */
export function canonicalAuthor(name, identities) {
  const slug = typeof name === "string" ? slugSafe(name) : null;
  if (slug === null || !Array.isArray(identities)) return name;
  for (const entry of identities) {
    const canonical = typeof entry?.name === "string" ? entry.name : null;
    // An entry whose own canonical name cannot be spelled into a filename is not an
    // identity anyone can be fused INTO: honouring it would replace a usable name
    // with an unusable one, which is worse than not fusing at all.
    if (canonical === null || slugSafe(canonical) === null) continue;
    if (slugSafe(canonical) === slug) return canonical;
    const aka = Array.isArray(entry.aka) ? entry.aka : [];
    if (aka.some((alias) => typeof alias === "string" && slugSafe(alias) === slug)) return canonical;
  }
  return name;
}

/**
 * The distinct people among a list of git author names, in the order they first
 * appear, each kept in the spelling it first appeared with. Compared by slug, so
 * one person who typed their name three ways is one person — and a name with no
 * slug at all is not someone this brain can name, so it is dropped rather than
 * counted as a mysterious second author.
 *
 * Confirmed identities are resolved FIRST, so an owner's two Macs count once and
 * are listed under the spelling they kept, whichever machine committed first.
 */
export function distinctAuthors(names, identities) {
  const seen = new Set();
  const people = [];
  for (const raw of names) {
    const resolved = canonicalAuthor(raw, identities);
    const slug = typeof resolved === "string" ? slugSafe(resolved) : null;
    if (slug === null || seen.has(slug)) continue;
    seen.add(slug);
    people.push(resolved.trim().replace(/\s+/g, " "));
  }
  return people;
}

// Everyone this brain knows about: its history PLUS whoever is sitting here. The
// second person has committed nothing yet on their first session, and that is
// exactly the session where the brain must not be silent.
function everyone({ authors, me, identities }) {
  return distinctAuthors([...authors, ...(me ? [me] : [])], identities);
}

/**
 * The line every session gets once a brain has more than one author, or null below
 * that. A directive to the agent, not a sentence for the human: it says who is at
 * the keyboard and where to get a dated note's path, because composing that path by
 * hand is what makes two people's days collide.
 */
export function authorsReminder({ authors, me, identities }) {
  const people = everyone({ authors, me, identities });
  if (people.length < 2) return null;
  // Named the way the list names them: an owner who confirmed two spellings reads
  // the one they kept, not whichever one this machine happens to be configured with.
  const iAm = canonicalAuthor(me, identities);
  const here = iAm && slugSafe(iAm) !== null ? ` At this keyboard: ${iAm.trim().replace(/\s+/g, " ")}.` : "";
  // Named up to three, then counted. Volume IS the defect (F5): this block is echoed
  // VERBATIM to a CLI owner before they have typed a word, and a brain that grew to a
  // dozen authors would otherwise open every session with a roll call.
  const named = people.slice(0, NAMES_SHOWN);
  const rest = people.length - named.length;
  return (
    `More than one person writes here (${named.join(", ")}${rest > 0 ? ` +${rest}` : ""}).${here} ` +
    `Take a dated note's path from \`node scripts/dated-note-path.mjs --folder <f> --date <d>\`; ` +
    `never compose it. Silent background.`
  );
}

/**
 * What implicitness owes back, said exactly once in this brain's life: the first
 * time a second author is seen. Null once it has been said, and null on a brain
 * with one author.
 */
export function secondAuthorAnnouncement({ authors, me, announced, identities }) {
  if (announced) return null;
  const people = everyone({ authors, me, identities });
  if (people.length < 2) return null;
  return (
    `A second person now writes here. Say ONCE, in their language: each person's day gets its own ` +
    `note instead of the two being merged, and a source both meet is not stored twice. Then OFFER ` +
    `(never require) to say who is who — declining changes nothing.`
  );
}

/**
 * Wraps whatever there is to say into the SessionStart hook output, or null when
 * there is nothing — a solo brain's session start must be byte-identical to what it
 * was. Mirrors buildUniverseHookOutput: `additionalContext` is the only channel
 * Claude Desktop shows, `systemMessage` carries the raw fact for the CLI.
 */
export function buildAuthorsHookOutput({ reminder = null, announcement = null } = {}) {
  if (!reminder && !announcement) return null;
  const parts = [];
  if (reminder) parts.push(`[authors] ${reminder}`);
  if (announcement) parts.push(`[authors — say this once] ${announcement}`);
  return {
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: parts.join("\n\n") },
    systemMessage: [reminder, announcement].filter(Boolean).join("\n"),
  };
}
