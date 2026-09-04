// ─────────────────────────────────────────────────────────────────────────────
// dated-note-path.mjs — where today's dated note goes, when a brain has more than
// one author. Pure, I/O-free (ADR 0009 rung 1).
//
// THE DEFECT IT REMOVES: two people sharing a brain both write
// `briefings/2026-09-02.md` on the same day, and the union merge — the right
// resolution for an append-only ledger, the wrong one for a synthesis —
// concatenates two whole documents into one file with no marker and no question.
// That is what a first duo meets in its first week, and it is a PATH problem: a
// different path cannot collide, and it needs no discipline from any writer.
//
// THE RULE, and it is deliberately asymmetric:
//
//   the base name (`daily/2026-09-02.md`) belongs to whoever writes FIRST; a
//   DIFFERENT author writing the same day gets `daily/2026-09-02-<slug>.md`.
//
// So a solo owner — even one with two Macs and a remote — never sees a suffix at
// all: nothing surfaces until a second person exists, the same doctrine as
// universes (ADR 0034). And every degradation here falls back to the BASE name,
// i.e. to exactly today's behaviour, which is a visible union merge rather than an
// invented path nobody would think to look in.
//
// The author is the git author name, which git already writes into every commit
// this brain makes and which the live sync already speaks aloud ("1 note from
// Claire arrived"). Nothing new is recorded, and no list of people is maintained.
// ─────────────────────────────────────────────────────────────────────────────
import { canonicalAuthor } from "./brain-author.mjs";
import { slugSafe } from "./filed-note.mjs";

/** The frontmatter key a dated note stamps so the rule can read it back next time. */
export const AUTHOR_FIELD = "author";

/**
 * The author a note claims, or null. A note written before this rule claims
 * nothing — which is not the same as claiming nobody wrote it, and is why the
 * caller must fall back rather than treat it as a stranger.
 */
export function noteAuthor(frontmatter) {
  const raw = frontmatter?.[AUTHOR_FIELD];
  const name = typeof raw === "string" ? raw.trim() : "";
  return name === "" ? null : name;
}

/**
 * Where `author`'s dated note goes today.
 *
 * `base` is what the vault holds at `<folder>/<date>.md`: `null` when there is no
 * such note, otherwise `{ author }` read off its frontmatter.
 *
 * @returns { path, suffixed }
 */
export function datedNotePath({ folder, date, author, base, identities }) {
  const shared = { path: `${folder}/${date}.md`, suffixed: false };
  // Nobody has written today, or the note that exists is this same person's: the
  // base name is theirs and stays theirs.
  if (base == null) return shared;
  // Both sides go through the registry FIRST (step 8), so the promise in this file's
  // header — a solo owner, even one with two Macs, never sees a suffix — is true
  // rather than hopeful: until the owner's answer was consulted here, it held only
  // while both machines happened to spell the name identically, and nothing checked.
  const owner = base.author == null ? null : slugSafe(canonicalAuthor(base.author, identities) ?? "");
  const mine = slugSafe(canonicalAuthor(author ?? "", identities) ?? "");
  // A note predating this rule names no author, and a name with no slug cannot be
  // spelled into a filename. Both degrade to the shared file — today's behaviour,
  // which is a union merge: visible, and not a path nobody expects.
  if (owner === null || mine === null || owner === mine) return shared;
  return { path: `${folder}/${date}-${mine}.md`, suffixed: true };
}

/**
 * The same rule, applied against what the vault actually holds. The folder is
 * matched WHOLE: without that, `daily` would find `acme/daily/…` and a universe's
 * note would decide where a root note goes (ADR 0034 puts a universe one level
 * deeper, and its days are its own).
 */
export function resolveDatedNotePath({ notes, folder, date, author, identities }) {
  const basePath = `${folder}/${date}.md`;
  const base = notes.find((note) => note.path === basePath);
  return datedNotePath({
    folder,
    date,
    author,
    identities,
    base: base ? { author: noteAuthor(base.frontmatter) } : null,
  });
}
