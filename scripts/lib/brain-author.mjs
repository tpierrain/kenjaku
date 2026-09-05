// ─────────────────────────────────────────────────────────────────────────────
// brain-author.mjs — who writes in this brain, and the one thing implicitness owes
// them in exchange: a QUESTION, asked until it is answered.
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
// opaque, so it owes the human a word about it.
//
// AND THAT WORD IS A QUESTION, NOT A STATEMENT (step 8). All this module has is git
// author names, so one owner whose two Macs say `Thomas Pierrain` and `tpierrain`
// is the same evidence as two colleagues. It used to ASSERT "a second person now
// writes here" — to somebody who may be alone. **A brain may FILE on a guess (a file
// in an unexpected place is visible and reversible); it may not ASSERT one.** So it
// asks, the answer is remembered in a registry that travels between the machines,
// and what the answer buys is silence in both directions.
//
// Below two authors this module is silent, in every direction. Same doctrine as
// universes (ADR 0034): nothing surfaces until a second one exists.
// ─────────────────────────────────────────────────────────────────────────────
import { slugSafe } from "./filed-note.mjs";
import { countOf } from "./plural.mjs";

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
 * Are these two spellings the same human? THE comparison for the whole brain — the
 * arrival banner, the per-person note paths and the session line all ask it here, so
 * they can never disagree about a name.
 *
 * Confirmed identities first, then slug, because case and spacing were never two
 * people. A name with no slug is nobody this brain can name, and two nobodies are
 * not each other: answering true there would silence a banner about a stranger.
 */
export function isSamePerson(a, b, identities) {
  const left = personSlug(a, identities);
  return left !== null && left === personSlug(b, identities);
}

/**
 * What `name` slugs to once the registry has had its say, or null when it is not a
 * name at all — a missing author, a frontmatter field somebody typed a number into.
 *
 * Written as a type check rather than a `?? ""` default: a placeholder would make two
 * ANONYMOUS callers slug identically, and *"nobody === nobody"* is the one answer this
 * brain may never give — it would file a stranger's note into the owner's day and
 * silence the banner about it. Exported because the note paths compare names too, and
 * one notion of "who" means one place where a name becomes comparable.
 */
export function personSlug(name, identities) {
  const canonical = canonicalAuthor(name, identities);
  return typeof canonical === "string" ? slugSafe(canonical) : null;
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
 * The names writing in this brain that the owner has never placed: neither fused
 * into somebody (`identities`) nor confirmed as a second person (`distinct`).
 *
 * Whoever is at the keyboard is never in this list — the question is about the
 * OTHER name, and asking somebody to place themselves is asking them nothing.
 */
function unplacedAuthors({ authors, me, identities, distinct }) {
  // `me` is a name with a slug — its only caller has just refused anything else — and
  // `canonicalAuthor` hands back what it was given when nobody claims it.
  const mine = slugSafe(canonicalAuthor(me, identities));
  const confirmed = new Set(
    (Array.isArray(distinct) ? distinct : []).map((name) => (typeof name === "string" ? slugSafe(name) : null)),
  );
  // Every name here came through `distinctAuthors`, which already dropped the ones
  // this brain cannot spell: re-checking for a null slug would be a branch no test
  // could ever reach. Measured: it was one, and it is gone.
  return everyone({ authors, me, identities }).filter((person) => {
    const slug = slugSafe(person);
    return slug !== mine && !confirmed.has(slug);
  });
}

/**
 * What implicitness owes back — and step 8 raised the price from a sentence to a
 * QUESTION, for a reason that generalises: **this brain may FILE on a guess, it may
 * not ASSERT one.** It compares git author names and nothing else, so an owner's
 * second Mac spelled `tpierrain` and a colleague named `tpierrain` are the same
 * evidence. The sentence that used to stand here ("a second person now writes
 * here") is therefore a statement the brain cannot know is true, said to someone
 * who may well be alone — and for a product whose asset is trust, an alarming false
 * statement costs more than a missing feature.
 *
 * So it asks, and it keeps asking until it is answered EITHER WAY. Null once every
 * name is placed, and null on a brain that has no second name or no name at this
 * keyboard — a brain that does not know who "you" is cannot ask "or you on another
 * machine?", and could not record the answer either (a fusion needs a canonical
 * name to fuse into).
 */
export function secondAuthorQuestion({ authors, me, identities, distinct }) {
  if (!me || slugSafe(me) === null) return null;
  const unplaced = unplacedAuthors({ authors, me, identities, distinct });
  if (unplaced.length === 0) return null;
  // Named up to three then counted, exactly like the line above: five unplaced names
  // is a brain that was handed round a team, and a roll call is not a question
  // anybody answers.
  const named = unplaced.slice(0, NAMES_SHOWN);
  const rest = unplaced.length - named.length;
  const list = `${named.join(", ")}${rest > 0 ? ` +${rest}` : ""}`;
  return (
    `This brain cannot place ${countOf(unplaced.length, "name")} writing here: ${list}. ASK before ` +
    `today's first note, in their language — is that someone else, or them on another machine? ` +
    `NEVER guess. Record their answer: \`node scripts/author-identity.mjs --same-person "<name>"\`, ` +
    `or \`--different "<name>"\`. Until then nothing changes.`
  );
}

/**
 * And what a CONFIRMED duo is owed, said once: the explanation duo mode always owed,
 * moved from the guess to the confirmation. Printed by the entry point that records
 * the answer, so it is said exactly once by construction — the event that triggers
 * it happens once — and needs no marker anybody has to remember to write.
 */
export function duoConfirmedNotice(name) {
  return (
    `Recorded: ${name} is a second person. Say ONCE, in their language: from here on each person's ` +
    `day gets its own note instead of the two being merged, and a source you both meet is not stored ` +
    `twice. Nothing to switch on, and nothing else changes.`
  );
}

/**
 * Wraps whatever there is to say into the SessionStart hook output, or null when
 * there is nothing — a solo brain's session start must be byte-identical to what it
 * was. Mirrors buildUniverseHookOutput: `additionalContext` is the only channel
 * Claude Desktop shows, `systemMessage` carries the raw fact for the CLI.
 */
export function buildAuthorsHookOutput({ reminder = null, question = null } = {}) {
  if (!reminder && !question) return null;
  const parts = [];
  if (reminder) parts.push(`[authors] ${reminder}`);
  if (question) parts.push(`[authors — ask, never guess] ${question}`);
  return {
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: parts.join("\n\n") },
    systemMessage: [reminder, question].filter(Boolean).join("\n"),
  };
}
